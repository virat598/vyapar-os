import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  products,
  stockMovements,
  customers,
  businesses,
  payments,
  auditLogs,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const list = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerId: invoices.customerId,
          customerName: invoices.customerName,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          status: invoices.status,
          paymentStatus: invoices.paymentStatus,
          subtotal: invoices.subtotal,
          taxTotal: invoices.taxTotal,
          discountTotal: invoices.discountTotal,
          grandTotal: invoices.grandTotal,
          paidAmount: invoices.paidAmount,
          balanceAmount: invoices.balanceAmount,
          notes: invoices.notes,
          createdByName: invoices.createdByName,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(eq(invoices.businessId, session.businessId))
        .orderBy(desc(invoices.createdAt));

      return NextResponse.json({ invoices: list });
    } catch {
      const list = memoryStore.invoices.filter((i) => i.businessId === session.businessId);
      return NextResponse.json({ invoices: list });
    }
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canCreateSales) {
      return NextResponse.json({ error: "Permission denied to create invoices" }, { status: 403 });
    }

    const body = await req.json();
    const {
      customerId,
      customerName: inputCustomerName,
      invoiceDate = new Date().toISOString().split("T")[0],
      dueDate,
      items = [],
      discountTotal = 0,
      paidAmount = 0,
      paymentMethod = "upi",
      paymentReference = "",
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required in the invoice" }, { status: 400 });
    }

    let resolvedCustomerId = customerId;
    let resolvedCustomerName = inputCustomerName;

    try {
      if (customerId) {
        const cust = (
          await db
            .select()
            .from(customers)
            .where(and(eq(customers.id, customerId), eq(customers.businessId, session.businessId)))
            .limit(1)
        )[0];
        if (!cust) {
          return NextResponse.json({ error: "Customer not found in this business workspace" }, { status: 404 });
        }
        resolvedCustomerName = cust.name;
      } else if (inputCustomerName) {
        const quickCustId = "cust_" + Math.random().toString(36).substring(2, 9);
        await db.insert(customers).values({
          id: quickCustId,
          businessId: session.businessId,
          name: inputCustomerName.trim(),
          currentBalance: 0,
        });
        resolvedCustomerId = quickCustId;
        resolvedCustomerName = inputCustomerName.trim();
      } else {
        return NextResponse.json({ error: "Customer is required" }, { status: 400 });
      }

      const biz = (
        await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, session.businessId))
          .limit(1)
      )[0];

      const invoiceNumber = `${biz?.invoicePrefix || "INV-"}${biz?.invoiceCounter || 1001}`;

      let calculatedSubtotal = 0;
      let calculatedTaxTotal = 0;

      const validatedItems: any[] = [];

      for (const line of items) {
        const qty = parseInt(line.quantity, 10);
        if (!qty || qty <= 0) {
          return NextResponse.json({ error: "Item quantity must be greater than 0" }, { status: 400 });
        }

        const prod = (
          await db
            .select()
            .from(products)
            .where(and(eq(products.id, line.productId), eq(products.businessId, session.businessId)))
            .limit(1)
        )[0];

        if (!prod) {
          return NextResponse.json({ error: `Product ID ${line.productId} not found` }, { status: 404 });
        }

        if (prod.currentStock < qty) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Requested: ${qty} ${prod.unit}.`,
            },
            { status: 400 }
          );
        }

        const unitPrice = line.unitPrice !== undefined ? parseInt(line.unitPrice, 10) : prod.sellingPrice;
        const taxRate = line.taxRate !== undefined ? parseInt(line.taxRate, 10) : prod.taxRate;
        const lineSubtotal = qty * unitPrice;
        const lineTax = Math.round((lineSubtotal * taxRate) / 100);
        const lineTotal = lineSubtotal + lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTaxTotal += lineTax;

        validatedItems.push({
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unit: prod.unit,
          unitPrice,
          taxRate,
          taxAmount: lineTax,
          discountAmount: 0,
          totalPrice: lineTotal,
          currentStock: prod.currentStock,
        });
      }

      const numDiscount = Math.max(0, parseInt(discountTotal, 10) || 0);
      const grandTotal = Math.max(0, calculatedSubtotal + calculatedTaxTotal - numDiscount);
      const numPaid = Math.min(grandTotal, Math.max(0, parseInt(paidAmount, 10) || 0));
      const balanceAmount = grandTotal - numPaid;

      const paymentStatus =
        numPaid >= grandTotal ? "paid" : numPaid > 0 ? "partial" : "unpaid";

      const invoiceId = "inv_" + Math.random().toString(36).substring(2, 10);

      await db.insert(invoices).values({
        id: invoiceId,
        businessId: session.businessId,
        invoiceNumber,
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName,
        invoiceDate,
        dueDate: dueDate || null,
        status: "confirmed",
        paymentStatus,
        subtotal: calculatedSubtotal,
        taxTotal: calculatedTaxTotal,
        discountTotal: numDiscount,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
        notes: notes?.trim() || null,
        createdByName: session.name,
      });

      for (const item of validatedItems) {
        await db.insert(invoiceItems).values({
          id: "item_" + Math.random().toString(36).substring(2, 10),
          invoiceId,
          businessId: session.businessId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          discountAmount: 0,
          totalPrice: item.totalPrice,
        });

        const newStock = item.currentStock - item.quantity;
        await db
          .update(products)
          .set({
            currentStock: newStock,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      await db
        .update(businesses)
        .set({
          invoiceCounter: (biz.invoiceCounter || 1000) + 1,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, session.businessId));

      if (resolvedCustomerId) {
        const cust = (
          await db
            .select()
            .from(customers)
            .where(eq(customers.id, resolvedCustomerId))
            .limit(1)
        )[0];
        if (cust) {
          await db
            .update(customers)
            .set({
              currentBalance: cust.currentBalance + balanceAmount,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, resolvedCustomerId));
        }
      }

      if (numPaid > 0) {
        await db.insert(payments).values({
          id: "pay_" + Math.random().toString(36).substring(2, 10),
          businessId: session.businessId,
          paymentType: "customer_receipt",
          partyType: "customer",
          partyId: resolvedCustomerId || "",
          partyName: resolvedCustomerName,
          amount: numPaid,
          paymentDate: invoiceDate,
          paymentMethod: paymentMethod || "upi",
          referenceNumber: paymentReference?.trim() || `Against ${invoiceNumber}`,
          invoiceId,
          notes: `Collected during billing for ${invoiceNumber}`,
          createdByName: session.name,
        });
      }

      return NextResponse.json({
        success: true,
        invoiceId,
        invoiceNumber,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
      });
    } catch {
      // Memory store fallback for Vercel without PostgreSQL
      const biz = memoryStore.businesses.find((b) => b.id === session.businessId) || memoryStore.businesses[0];
      const counter = biz?.invoiceCounter || 1006;
      const invoiceNumber = `${biz?.invoicePrefix || "SKD-"}${counter}`;
      if (biz) biz.invoiceCounter = counter + 1;

      if (!resolvedCustomerName && customerId) {
        const c = memoryStore.customers.find((cust) => cust.id === customerId);
        resolvedCustomerName = c?.name || "Cash Customer";
      }

      let subtotal = 0;
      let taxTotal = 0;
      const invoiceId = "inv_" + Math.random().toString(36).substring(2, 10);

      for (const line of items) {
        const prod = memoryStore.products.find((p) => p.id === line.productId);
        const qty = parseInt(line.quantity, 10) || 1;
        const rate = line.unitPrice ? parseInt(line.unitPrice, 10) : prod?.sellingPrice || 1000;
        const taxR = line.taxRate !== undefined ? parseInt(line.taxRate, 10) : prod?.taxRate || 18;
        const lineSub = qty * rate;
        const lineTax = Math.round((lineSub * taxR) / 100);

        subtotal += lineSub;
        taxTotal += lineTax;

        if (prod) {
          prod.currentStock = Math.max(0, prod.currentStock - qty);
        }

        memoryStore.invoiceItems.push({
          id: "item_" + Math.random().toString(36).substring(2, 10),
          invoiceId,
          businessId: session.businessId,
          productId: line.productId,
          productName: prod?.name || "Product",
          quantity: qty,
          unit: prod?.unit || "PCS",
          unitPrice: rate,
          taxRate: taxR,
          taxAmount: lineTax,
          discountAmount: 0,
          totalPrice: lineSub + lineTax,
        });
      }

      const numDiscount = Math.max(0, parseInt(discountTotal, 10) || 0);
      const grandTotal = Math.max(0, subtotal + taxTotal - numDiscount);
      const numPaid = Math.min(grandTotal, Math.max(0, parseInt(paidAmount, 10) || 0));
      const balanceAmount = grandTotal - numPaid;
      const paymentStatus = numPaid >= grandTotal ? "paid" : numPaid > 0 ? "partial" : "unpaid";

      const newInv = {
        id: invoiceId,
        businessId: session.businessId,
        invoiceNumber,
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName || "Cash Customer",
        invoiceDate,
        dueDate: dueDate || null,
        status: "confirmed",
        paymentStatus,
        subtotal,
        taxTotal,
        discountTotal: numDiscount,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
        notes: notes?.trim() || null,
        createdByName: session.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      memoryStore.invoices.unshift(newInv);

      if (resolvedCustomerId) {
        const c = memoryStore.customers.find((cust) => cust.id === resolvedCustomerId);
        if (c) c.currentBalance += balanceAmount;
      }

      return NextResponse.json({
        success: true,
        invoiceId,
        invoiceNumber,
        grandTotal,
        paidAmount: numPaid,
        balanceAmount,
      });
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
