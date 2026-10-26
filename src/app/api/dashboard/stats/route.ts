import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import {
  invoices,
  purchases,
  payments,
  expenses,
  products,
  customers,
  suppliers,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.businessId;

    let invoiceList: any[] = [];
    let customerList: any[] = [];
    let supplierList: any[] = [];
    let purchaseList: any[] = [];
    let expenseList: any[] = [];
    let allProducts: any[] = [];
    let paymentList: any[] = [];

    try {
      invoiceList = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: invoices.customerName,
          invoiceDate: invoices.invoiceDate,
          grandTotal: invoices.grandTotal,
          paidAmount: invoices.paidAmount,
          balanceAmount: invoices.balanceAmount,
          status: invoices.status,
          paymentStatus: invoices.paymentStatus,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(eq(invoices.businessId, businessId))
        .orderBy(desc(invoices.createdAt));

      customerList = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          currentBalance: customers.currentBalance,
          creditLimit: customers.creditLimit,
        })
        .from(customers)
        .where(eq(customers.businessId, businessId))
        .orderBy(desc(customers.currentBalance));

      supplierList = await db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          phone: suppliers.phone,
          currentBalance: suppliers.currentBalance,
        })
        .from(suppliers)
        .where(eq(suppliers.businessId, businessId))
        .orderBy(desc(suppliers.currentBalance));

      purchaseList = await db
        .select({
          id: purchases.id,
          billNumber: purchases.billNumber,
          supplierName: purchases.supplierName,
          billDate: purchases.billDate,
          grandTotal: purchases.grandTotal,
          paidAmount: purchases.paidAmount,
          balanceAmount: purchases.balanceAmount,
          status: purchases.status,
          paymentStatus: purchases.paymentStatus,
          createdAt: purchases.createdAt,
        })
        .from(purchases)
        .where(eq(purchases.businessId, businessId))
        .orderBy(desc(purchases.createdAt));

      expenseList = await db
        .select({
          id: expenses.id,
          category: expenses.category,
          amount: expenses.amount,
          expenseDate: expenses.expenseDate,
          notes: expenses.notes,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .where(eq(expenses.businessId, businessId))
        .orderBy(desc(expenses.createdAt));

      allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          unit: products.unit,
          costPrice: products.costPrice,
          sellingPrice: products.sellingPrice,
          currentStock: products.currentStock,
          minStockAlert: products.minStockAlert,
        })
        .from(products)
        .where(eq(products.businessId, businessId));

      paymentList = await db
        .select({
          id: payments.id,
          paymentType: payments.paymentType,
          partyName: payments.partyName,
          amount: payments.amount,
          paymentDate: payments.paymentDate,
          paymentMethod: payments.paymentMethod,
          referenceNumber: payments.referenceNumber,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.businessId, businessId))
        .orderBy(desc(payments.createdAt));
    } catch {
      // Fallback to in-memory store for environments without local PostgreSQL (Vercel)
      invoiceList = memoryStore.invoices.filter((i) => i.businessId === businessId);
      customerList = memoryStore.customers.filter((c) => c.businessId === businessId);
      supplierList = memoryStore.suppliers.filter((s) => s.businessId === businessId);
      purchaseList = memoryStore.purchases.filter((p) => p.businessId === businessId);
      expenseList = memoryStore.expenses.filter((e) => e.businessId === businessId);
      allProducts = memoryStore.products.filter((p) => p.businessId === businessId);
      paymentList = memoryStore.payments.filter((p) => p.businessId === businessId);
    }

    const totalSales = invoiceList
      .filter((inv) => inv.status !== "cancelled")
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    const totalReceivables = customerList.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
    const totalPayables = supplierList.reduce((sum, s) => sum + Math.max(0, s.currentBalance), 0);

    const totalPurchases = purchaseList
      .filter((p) => p.status !== "cancelled")
      .reduce((sum, p) => sum + p.grandTotal, 0);

    const totalExpenses = expenseList.reduce((sum, e) => sum + e.amount, 0);

    const totalInventoryValue = allProducts.reduce(
      (sum, p) => sum + Math.max(0, p.currentStock) * p.costPrice,
      0
    );

    const lowStockItems = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

    const totalCollected = paymentList
      .filter((p) => p.paymentType === "customer_receipt")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDisbursed = paymentList
      .filter((p) => p.paymentType === "supplier_payment")
      .reduce((sum, p) => sum + p.amount, 0);

    const recentActivity = [
      ...invoiceList.slice(0, 5).map((inv) => ({
        id: inv.id,
        type: "sale",
        title: `Sale to ${inv.customerName}`,
        ref: inv.invoiceNumber,
        date: inv.invoiceDate,
        amount: inv.grandTotal,
        status: inv.paymentStatus,
        createdAt: inv.createdAt,
      })),
      ...purchaseList.slice(0, 5).map((pur) => ({
        id: pur.id,
        type: "purchase",
        title: `Purchase from ${pur.supplierName}`,
        ref: pur.billNumber,
        date: pur.billDate,
        amount: pur.grandTotal,
        status: pur.paymentStatus,
        createdAt: pur.createdAt,
      })),
      ...paymentList.slice(0, 5).map((pmt) => ({
        id: pmt.id,
        type: pmt.paymentType === "customer_receipt" ? "receipt" : "payment",
        title:
          pmt.paymentType === "customer_receipt"
            ? `Receipt from ${pmt.partyName}`
            : `Payment to ${pmt.partyName}`,
        ref: pmt.referenceNumber || pmt.paymentMethod.toUpperCase(),
        date: pmt.paymentDate,
        amount: pmt.amount,
        status: "completed",
        createdAt: pmt.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    const now = new Date();
    const last7Days: { date: string; label: string; sales: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });

      const dayInvoices = invoiceList.filter(
        (inv) => inv.invoiceDate === dateStr && inv.status !== "cancelled"
      );
      const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

      last7Days.push({
        date: dateStr,
        label: dayLabel,
        sales: dayTotal,
        count: dayInvoices.length,
      });
    }

    return NextResponse.json({
      metrics: {
        totalSales,
        totalPurchases,
        totalExpenses,
        totalReceivables,
        totalPayables,
        totalInventoryValue,
        totalCollected,
        totalDisbursed,
        productsCount: allProducts.length,
        lowStockCount: lowStockItems.length,
        customersCount: customerList.length,
        suppliersCount: supplierList.length,
      },
      lowStockItems: lowStockItems.slice(0, 5),
      pendingCollections: customerList.filter((c) => c.currentBalance > 0).slice(0, 5),
      recentActivity,
      salesTrend: last7Days,
      currency: "INR",
    });
  } catch (error) {
    console.error("Error in dashboard stats:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
