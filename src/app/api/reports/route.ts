import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { invoices, invoiceItems, products, expenses, customers, suppliers, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canViewReports) {
      return NextResponse.json({ error: "Permission denied to view reports" }, { status: 403 });
    }

    const bizId = session.businessId;

    let allInvoices: any[] = [];
    let allInvoiceItems: any[] = [];
    let allProducts: any[] = [];
    let allExpenses: any[] = [];
    let allCategories: any[] = [];
    let allCustomers: any[] = [];
    let allSuppliers: any[] = [];

    try {
      allInvoices = await db.select().from(invoices).where(eq(invoices.businessId, bizId));
      allInvoiceItems = await db
        .select({
          productId: invoiceItems.productId,
          quantity: invoiceItems.quantity,
          totalPrice: invoiceItems.totalPrice,
        })
        .from(invoiceItems)
        .where(eq(invoiceItems.businessId, bizId));
      allProducts = await db.select().from(products).where(eq(products.businessId, bizId));
      allExpenses = await db.select().from(expenses).where(eq(expenses.businessId, bizId));
      allCategories = await db.select().from(categories).where(eq(categories.businessId, bizId));
      allCustomers = await db.select().from(customers).where(eq(customers.businessId, bizId)).orderBy(desc(customers.currentBalance));
      allSuppliers = await db.select().from(suppliers).where(eq(suppliers.businessId, bizId)).orderBy(desc(suppliers.currentBalance));
    } catch {
      allInvoices = memoryStore.invoices.filter((i) => i.businessId === bizId);
      allInvoiceItems = memoryStore.invoiceItems.filter((i) => i.businessId === bizId);
      allProducts = memoryStore.products.filter((p) => p.businessId === bizId);
      allExpenses = memoryStore.expenses.filter((e) => e.businessId === bizId);
      allCategories = memoryStore.categories.filter((c) => c.businessId === bizId);
      allCustomers = memoryStore.customers.filter((c) => c.businessId === bizId).sort((a, b) => b.currentBalance - a.currentBalance);
      allSuppliers = memoryStore.suppliers.filter((s) => s.businessId === bizId).sort((a, b) => b.currentBalance - a.currentBalance);
    }

    const activeInvoices = allInvoices.filter((inv) => inv.status !== "cancelled");
    const totalSalesRevenue = activeInvoices.reduce((s, inv) => s + inv.grandTotal, 0);
    const totalTaxCollected = activeInvoices.reduce((s, inv) => s + inv.taxTotal, 0);
    const netSalesExTax = activeInvoices.reduce((s, inv) => s + inv.subtotal, 0);

    const productMap = new Map(allProducts.map((p) => [p.id, p]));
    let estimatedCogs = 0;
    for (const item of allInvoiceItems) {
      if (item.productId && productMap.has(item.productId)) {
        const p = productMap.get(item.productId)!;
        estimatedCogs += item.quantity * p.costPrice;
      }
    }

    const grossProfit = Math.max(0, netSalesExTax - estimatedCogs);
    const grossMarginPercent = netSalesExTax > 0 ? ((grossProfit / netSalesExTax) * 100).toFixed(1) : "0";

    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
    const expenseByCategory: Record<string, number> = {};
    for (const e of allExpenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    }

    const netOperatingProfit = grossProfit - totalExpenses;

    const catMap = new Map(allCategories.map((c) => [c.id, c.name]));
    let totalStockUnits = 0;
    let totalStockCostValue = 0;
    let totalStockSalesValue = 0;
    const categoryValuation: Record<string, { units: number; costValue: number }> = {};

    for (const p of allProducts) {
      const stock = Math.max(0, p.currentStock);
      totalStockUnits += stock;
      const costVal = stock * p.costPrice;
      const salesVal = stock * (p.sellingPrice || p.costPrice);
      totalStockCostValue += costVal;
      totalStockSalesValue += salesVal;

      const catName = (p.categoryId && catMap.get(p.categoryId)) || "Uncategorized";
      if (!categoryValuation[catName]) {
        categoryValuation[catName] = { units: 0, costValue: 0 };
      }
      categoryValuation[catName].units += stock;
      categoryValuation[catName].costValue += costVal;
    }

    const totalReceivables = allCustomers.reduce((s, c) => s + Math.max(0, c.currentBalance), 0);
    const overdueOrExceeded = allCustomers.filter((c) => c.currentBalance > c.creditLimit);
    const totalPayables = allSuppliers.reduce((s, sup) => s + Math.max(0, sup.currentBalance), 0);

    return NextResponse.json({
      profitLoss: {
        totalSalesRevenue,
        netSalesExTax,
        taxCollected: totalTaxCollected,
        estimatedCogs,
        grossProfit,
        grossMarginPercent,
        totalExpenses,
        netOperatingProfit,
        expenseBreakdown: Object.entries(expenseByCategory).map(([category, amount]) => ({
          category,
          amount,
        })),
      },
      stockValuation: {
        totalProducts: allProducts.length,
        totalStockUnits,
        totalStockCostValue,
        totalStockSalesValue,
        projectedGrossMargin: totalStockSalesValue - totalStockCostValue,
        categoryBreakdown: Object.entries(categoryValuation).map(([name, data]) => ({
          name,
          ...data,
        })),
      },
      receivables: {
        totalReceivables,
        customerCount: allCustomers.length,
        topDebtors: allCustomers.filter((c) => c.currentBalance > 0).slice(0, 8),
        overCreditLimit: overdueOrExceeded,
      },
      payables: {
        totalPayables,
        supplierCount: allSuppliers.length,
        topCreditors: allSuppliers.filter((s) => s.currentBalance > 0).slice(0, 8),
      },
    });
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
