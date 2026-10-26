import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { products, customers, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "products";
    const bizId = session.businessId;

    let csvContent = "";
    const filename = `export_${type}_${new Date().toISOString().split("T")[0]}.csv`;

    if (type === "products") {
      let prods: any[] = [];
      try {
        prods = await db.select().from(products).where(eq(products.businessId, bizId));
      } catch {
        prods = memoryStore.products.filter((p) => p.businessId === bizId);
      }
      const headers = ["SKU", "Name", "Unit", "Cost_Price_INR", "Selling_Price_INR", "Tax_Rate_GST", "Current_Stock", "Min_Alert"];
      const rows = prods.map((p) => [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.unit}"`,
        (p.costPrice / 100).toFixed(2),
        (p.sellingPrice / 100).toFixed(2),
        p.taxRate,
        p.currentStock,
        p.minStockAlert,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "customers") {
      let custs: any[] = [];
      try {
        custs = await db.select().from(customers).where(eq(customers.businessId, bizId));
      } catch {
        custs = memoryStore.customers.filter((c) => c.businessId === bizId);
      }
      const headers = ["Name", "Phone", "Email", "GSTIN", "City", "Credit_Limit_INR", "Current_Balance_INR"];
      const rows = custs.map((c) => [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone || ""}"`,
        `"${c.email || ""}"`,
        `"${c.gstin || ""}"`,
        `"${c.city || ""}"`,
        (c.creditLimit / 100).toFixed(2),
        (c.currentBalance / 100).toFixed(2),
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "sales") {
      let invs: any[] = [];
      try {
        invs = await db.select().from(invoices).where(eq(invoices.businessId, bizId));
      } catch {
        invs = memoryStore.invoices.filter((i) => i.businessId === bizId);
      }
      const headers = ["Invoice_No", "Customer", "Date", "Status", "Payment_Status", "Total_INR", "Paid_INR", "Balance_INR"];
      const rows = invs.map((i) => [
        `"${i.invoiceNumber}"`,
        `"${i.customerName.replace(/"/g, '""')}"`,
        `"${i.invoiceDate}"`,
        `"${i.status}"`,
        `"${i.paymentStatus}"`,
        (i.grandTotal / 100).toFixed(2),
        (i.paidAmount / 100).toFixed(2),
        (i.balanceAmount / 100).toFixed(2),
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = (await import("@/lib/types")).ROLE_PERMISSIONS[session.role];
    const body = await req.json();
    const { type, rows = [] } = body;

    if (type === "products" && !permissions.canManageProducts) {
      return NextResponse.json({ error: "Permission denied: Only Manager, Admin, or Owner can import products" }, { status: 403 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided for import" }, { status: 400 });
    }

    const errors: { row: number; error: string }[] = [];
    let importedCount = 0;

    if (type === "products") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        const name = (row.name || row.Name || row["Product Name"] || "").trim();
        const sku = (row.sku || row.SKU || row["Item Code"] || "").trim().toUpperCase();
        const unit = (row.unit || row.Unit || "PCS").trim().toUpperCase();
        const costPriceINR = parseFloat(row.costPrice || row.cost_price || row["Cost Price"] || "0");
        const sellingPriceINR = parseFloat(row.sellingPrice || row.selling_price || row["Selling Price"] || "0");
        const stock = parseInt(row.stock || row.currentStock || row["Initial Stock"] || "0", 10);
        const taxRate = parseInt(row.taxRate || row.tax_rate || row["GST"] || "18", 10);

        if (!name) {
          errors.push({ row: rowNum, error: "Product name is required" });
          continue;
        }
        if (!sku) {
          errors.push({ row: rowNum, error: "SKU is required" });
          continue;
        }

        const newProd = {
          id: "prod_" + Math.random().toString(36).substring(2, 10),
          businessId: session.businessId,
          sku,
          name,
          unit: unit || "PCS",
          costPrice: Math.round(costPriceINR * 100),
          sellingPrice: Math.round(sellingPriceINR * 100),
          currentStock: Math.max(0, stock || 0),
          minStockAlert: 10,
          taxRate: taxRate || 18,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          await db.insert(products).values(newProd);
        } catch {
          memoryStore.products.push(newProd);
        }
        importedCount++;
      }
    } else if (type === "customers") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
        const name = (row.name || row.Name || row["Customer Name"] || "").trim();
        const phone = (row.phone || row.Phone || row["Mobile"] || "").trim();
        const gstin = (row.gstin || row.GSTIN || "").trim().toUpperCase();
        const city = (row.city || row.City || "Pune").trim();
        const openingBalanceINR = parseFloat(row.openingBalance || row.balance || "0");

        if (!name) {
          errors.push({ row: rowNum, error: "Customer name is required" });
          continue;
        }

        const newCust = {
          id: "cust_" + Math.random().toString(36).substring(2, 10),
          businessId: session.businessId,
          name,
          phone: phone || null,
          gstin: gstin || null,
          city: city || null,
          currentBalance: Math.round(openingBalanceINR * 100),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          await db.insert(customers).values(newCust);
        } catch {
          memoryStore.customers.push(newCust);
        }
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      errors,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to process CSV import" }, { status: 500 });
  }
}
