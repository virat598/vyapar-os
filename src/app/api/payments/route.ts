import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { payments, customers, suppliers, invoices, purchases, auditLogs } from "@/db/schema";
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    try {
      const list = await db
        .select()
        .from(payments)
        .where(
          type
            ? and(eq(payments.businessId, session.businessId), eq(payments.paymentType, type))
            : eq(payments.businessId, session.businessId)
        )
        .orderBy(desc(payments.createdAt));
      return NextResponse.json({ payments: list });
    } catch {
      const list = memoryStore.payments
        .filter((p) => p.businessId === session.businessId && (!type || p.paymentType === type))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json({ payments: list });
    }
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canRecordPayments) {
      return NextResponse.json({ error: "Permission denied to record payments" }, { status: 403 });
    }

    const body = await req.json();
    const {
      paymentType,
      partyId,
      amount,
      paymentDate = new Date().toISOString().split("T")[0],
      paymentMethod = "upi",
      referenceNumber = "",
      invoiceId,
      purchaseId,
      notes,
    } = body;

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }
    if (!partyId) {
      return NextResponse.json({ error: "Party is required" }, { status: 400 });
    }

    const pmtId = "pay_" + Math.random().toString(36).substring(2, 10);
    let partyName = "";

    try {
      if (paymentType === "customer_receipt") {
        const cust = (
          await db
            .select()
            .from(customers)
            .where(and(eq(customers.id, partyId), eq(customers.businessId, session.businessId)))
            .limit(1)
        )[0];

        if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        partyName = cust.name;

        await db
          .update(customers)
          .set({
            currentBalance: cust.currentBalance - numAmount,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, partyId));

        if (invoiceId) {
          const inv = (
            await db
              .select()
              .from(invoices)
              .where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, session.businessId)))
              .limit(1)
          )[0];

          if (inv) {
            const newPaid = inv.paidAmount + numAmount;
            const newBalance = Math.max(0, inv.grandTotal - newPaid);
            const newStatus = newPaid >= inv.grandTotal ? "paid" : "partial";

            await db
              .update(invoices)
              .set({
                paidAmount: newPaid,
                balanceAmount: newBalance,
                paymentStatus: newStatus,
                updatedAt: new Date(),
              })
              .where(eq(invoices.id, invoiceId));
          }
        }
      } else {
        const sup = (
          await db
            .select()
            .from(suppliers)
            .where(and(eq(suppliers.id, partyId), eq(suppliers.businessId, session.businessId)))
            .limit(1)
        )[0];

        if (!sup) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        partyName = sup.name;

        await db
          .update(suppliers)
          .set({
            currentBalance: sup.currentBalance - numAmount,
            updatedAt: new Date(),
          })
          .where(eq(suppliers.id, partyId));
      }

      const [createdPayment] = await db
        .insert(payments)
        .values({
          id: pmtId,
          businessId: session.businessId,
          paymentType,
          partyType: paymentType === "customer_receipt" ? "customer" : "supplier",
          partyId,
          partyName,
          amount: numAmount,
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber?.trim() || null,
          invoiceId: invoiceId || null,
          purchaseId: purchaseId || null,
          notes: notes?.trim() || null,
          createdByName: session.name,
        })
        .returning();

      return NextResponse.json({ success: true, payment: createdPayment });
    } catch {
      // Memory store fallback
      if (paymentType === "customer_receipt") {
        const cust = memoryStore.customers.find((c) => c.id === partyId);
        partyName = cust?.name || "Customer";
        if (cust) cust.currentBalance = Math.max(0, cust.currentBalance - numAmount);
      } else {
        const sup = memoryStore.suppliers.find((s) => s.id === partyId);
        partyName = sup?.name || "Supplier";
        if (sup) sup.currentBalance = Math.max(0, sup.currentBalance - numAmount);
      }

      const newPayment = {
        id: pmtId,
        businessId: session.businessId,
        paymentType,
        partyType: paymentType === "customer_receipt" ? "customer" : "supplier",
        partyId,
        partyName,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber?.trim() || null,
        invoiceId: invoiceId || null,
        purchaseId: purchaseId || null,
        notes: notes?.trim() || null,
        createdByName: session.name,
        createdAt: new Date(),
      };

      memoryStore.payments.unshift(newPayment);
      return NextResponse.json({ success: true, payment: newPayment });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
