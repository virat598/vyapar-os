import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import {
  purchases,
  purchaseItems,
  products,
  stockMovements,
  suppliers,
  payments,
  auditLogs,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const list = await db
        .select()
        .from(purchases)
        .where(eq(purchases.businessId, session.businessId))
        .orderBy(desc(purchases.createdAt));
      return NextResponse.json({ purchases: list });
    } catch {
      const list = memoryStore.purchases.filter((p) => p.businessId === session.businessId);
      return NextResponse.json({ purchases: list });
    }
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canCreatePurchases) {
      return NextResponse.json({ error: "Permission denied to record purchases" }, { status: 403 });
    }

    const body = await req.json();
    const {
      supplierId,
      billNumber,
      billDate = new Date().toISOString().split("T")[0],
      dueDate,
      items = [],
      paidAmount = 0,
      paymentMethod = "bank_transfer",
      paymentReference = "",
      notes,
    } = body;

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
    }
    if (!billNumber || !billNumber.trim()) {
      return NextResponse.json({ error: "Supplier bill/invoice number is required" }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required in the purchase" }, { status: 400 });
    }

    try {
      const supplier = (
        await db
          .select()
          .from(suppliers)
          .where(and(eq(suppliers.id, supplierId), eq(suppliers.businessId, session.businessId)))
          .limit(1)
      )[0];

      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      let calculatedSubtotal = 0;
      let calculatedTaxTotal = 0;

      const validatedItems: any[] = [];

      for (const line of items) {
        const qty = parseInt(line.quantity, 10);
        if (!qty || qty <= 0) {
          return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
        }

        const prod = (
          await db
            .select()
            .from(products)
            .where(and(eq(products.id, line.productId), eq(products.businessId, session.businessId)))
            .limit(1)
        )[0];

        if (!prod) {
          return NextResponse.json({ error: `Product not found` }, { status: 404 });
        }

        const unitCost = line.unitCost !== undefined ? parseInt(line.unitCost, 10) : prod.costPrice;
        const taxRate = line.taxRate !== undefined ? parseInt(line.taxRate, 10) : prod.taxRate;
        const lineSubtotal = qty * unitCost;
        const lineTax = Math.round((lineSubtotal * taxRate) / 100);
        const lineTotal = lineSubtotal + lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTaxTotal += lineTax;

        validatedItems.push({
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unit: prod.unit,
          unitCost,
          taxRate,
          taxAmount: lineTax,
          totalCost: lineTotal,
          currentStock: prod.currentStock,
        });
      }

      const grandTotal = calculatedSubtotal + calculatedTaxTotal;
      const numPaid = Math.min(grandTotal, Math.max(0, parseInt(paidAmount, 10) || 0));
      const balanceAmount = grandTotal - numPaid;

      const paymentStatus =
        numPaid >= grandTotal ? "paid" : numPaid > 0 ? "partial" : "unpaid";

      const purchaseId = "pur_" + Math.random().toString(36).substring(2, 10);

      await db.insert(purchases).values({
        id: purchaseId,
        businessId: session.businessId,
        billNumber: billNumber.trim(),
        supplierId,
        supplierName: supplier.name,
        billDate,
        dueDate: dueDate || null,
        status: "received",
        paymentStatus,
        subtotal: calculatedSubtotal,
        taxTotal: calculatedTaxTotal,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
        notes: notes?.trim() || null,
        createdByName: session.name,
      });

      for (const item of validatedItems) {
        await db.insert(purchaseItems).values({
          id: "pitem_" + Math.random().toString(36).substring(2, 10),
          purchaseId,
          businessId: session.businessId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalCost: item.totalCost,
        });

        const newStock = item.currentStock + item.quantity;
        await db
          .update(products)
          .set({
            currentStock: newStock,
            costPrice: item.unitCost,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      await db
        .update(suppliers)
        .set({
          currentBalance: supplier.currentBalance + balanceAmount,
          updatedAt: new Date(),
        })
        .where(eq(suppliers.id, supplierId));

      return NextResponse.json({
        success: true,
        purchaseId,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
      });
    } catch {
      // Memory store fallback
      const sup = memoryStore.suppliers.find((s) => s.id === supplierId) || memoryStore.suppliers[0];
      const purchaseId = "pur_" + Math.random().toString(36).substring(2, 10);

      let subtotal = 0;
      let taxTotal = 0;

      for (const line of items) {
        const prod = memoryStore.products.find((p) => p.id === line.productId);
        const qty = parseInt(line.quantity, 10) || 1;
        const cost = line.unitCost ? parseInt(line.unitCost, 10) : prod?.costPrice || 1000;
        const taxR = line.taxRate !== undefined ? parseInt(line.taxRate, 10) : prod?.taxRate || 18;
        const lineSub = qty * cost;
        const lineTax = Math.round((lineSub * taxR) / 100);

        subtotal += lineSub;
        taxTotal += lineTax;

        if (prod) {
          prod.currentStock += qty;
          prod.costPrice = cost;
        }

        memoryStore.purchaseItems.push({
          id: "pitem_" + Math.random().toString(36).substring(2, 10),
          purchaseId,
          businessId: session.businessId,
          productId: line.productId,
          productName: prod?.name || "Product",
          quantity: qty,
          unit: prod?.unit || "PCS",
          unitCost: cost,
          taxRate: taxR,
          taxAmount: lineTax,
          totalCost: lineSub + lineTax,
        });
      }

      const grandTotal = subtotal + taxTotal;
      const numPaid = Math.min(grandTotal, Math.max(0, parseInt(paidAmount, 10) || 0));
      const balanceAmount = grandTotal - numPaid;
      const paymentStatus = numPaid >= grandTotal ? "paid" : numPaid > 0 ? "partial" : "unpaid";

      const newPur = {
        id: purchaseId,
        businessId: session.businessId,
        billNumber: billNumber.trim(),
        supplierId,
        supplierName: sup?.name || "Supplier",
        billDate,
        dueDate: dueDate || null,
        status: "received",
        paymentStatus,
        subtotal,
        taxTotal,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
        notes: notes?.trim() || null,
        createdByName: session.name,
        createdAt: new Date(),
      };

      memoryStore.purchases.unshift(newPur);

      if (sup) {
        sup.currentBalance += balanceAmount;
      }

      return NextResponse.json({
        success: true,
        purchaseId,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
      });
    }
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 });
  }
}
