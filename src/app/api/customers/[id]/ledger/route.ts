import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { customers, invoices, payments, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let customer: any = null;
    let biz: any = null;
    let customerInvoices: any[] = [];
    let customerPayments: any[] = [];

    try {
      const customerList = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.businessId, session.businessId)))
        .limit(1);

      if (customerList.length === 0) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      customer = customerList[0];

      biz = (
        await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, session.businessId))
          .limit(1)
      )[0];

      customerInvoices = await db
        .select({
          id: invoices.id,
          ref: invoices.invoiceNumber,
          date: invoices.invoiceDate,
          total: invoices.grandTotal,
          paid: invoices.paidAmount,
          balance: invoices.balanceAmount,
          status: invoices.status,
          paymentStatus: invoices.paymentStatus,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(and(eq(invoices.customerId, id), eq(invoices.businessId, session.businessId)));

      customerPayments = await db
        .select({
          id: payments.id,
          ref: payments.referenceNumber,
          date: payments.paymentDate,
          amount: payments.amount,
          method: payments.paymentMethod,
          notes: payments.notes,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(
          and(
            eq(payments.partyId, id),
            eq(payments.businessId, session.businessId),
            eq(payments.paymentType, "customer_receipt")
          )
        );
    } catch {
      // Memory store fallback
      customer = memoryStore.customers.find((c) => c.id === id && c.businessId === session.businessId);
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      biz = memoryStore.businesses.find((b) => b.id === session.businessId) || memoryStore.businesses[0];

      customerInvoices = memoryStore.invoices
        .filter((inv) => inv.customerId === id && inv.businessId === session.businessId)
        .map((inv) => ({
          id: inv.id,
          ref: inv.invoiceNumber,
          date: inv.invoiceDate,
          total: inv.grandTotal,
          paid: inv.paidAmount,
          balance: inv.balanceAmount,
          status: inv.status,
          paymentStatus: inv.paymentStatus,
          createdAt: inv.createdAt,
        }));

      customerPayments = memoryStore.payments
        .filter(
          (pmt) =>
            pmt.partyId === id &&
            pmt.businessId === session.businessId &&
            pmt.paymentType === "customer_receipt"
        )
        .map((pmt) => ({
          id: pmt.id,
          ref: pmt.referenceNumber,
          date: pmt.paymentDate,
          amount: pmt.amount,
          method: pmt.paymentMethod,
          notes: pmt.notes,
          createdAt: pmt.createdAt,
        }));
    }

    type LedgerRow = {
      id: string;
      date: string;
      type: "INVOICE" | "PAYMENT";
      description: string;
      reference: string;
      debit: number;
      credit: number;
      runningBalance: number;
      createdAt: Date;
    };

    const combined: Omit<LedgerRow, "runningBalance">[] = [];

    for (const inv of customerInvoices) {
      if (inv.status !== "cancelled") {
        combined.push({
          id: inv.id,
          date: inv.date,
          type: "INVOICE",
          description: `Tax Invoice (${inv.paymentStatus.toUpperCase()})`,
          reference: inv.ref,
          debit: inv.total,
          credit: 0,
          createdAt: inv.createdAt,
        });
      }
    }

    for (const pmt of customerPayments) {
      combined.push({
        id: pmt.id,
        date: pmt.date,
        type: "PAYMENT",
        description: `Payment Receipt (${pmt.method.toUpperCase()}${pmt.notes ? " - " + pmt.notes : ""})`,
        reference: pmt.ref || pmt.method,
        debit: 0,
        credit: pmt.amount,
        createdAt: pmt.createdAt,
      });
    }

    combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    const ledger: LedgerRow[] = combined.map((entry) => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: balance,
      };
    });

    return NextResponse.json({
      customer,
      business: biz,
      ledger: ledger.reverse(),
      summary: {
        totalInvoiced: ledger.reduce((s, r) => s + r.debit, 0),
        totalReceived: ledger.reduce((s, r) => s + r.credit, 0),
        currentBalance: customer.currentBalance,
      },
    });
  } catch (error) {
    console.error("Error fetching customer ledger:", error);
    return NextResponse.json({ error: "Failed to fetch customer ledger" }, { status: 500 });
  }
}
