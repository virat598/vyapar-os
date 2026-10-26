import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { invoices, invoiceItems, customers, businesses } from "@/db/schema";
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
    let inv: any = null;
    let items: any[] = [];
    let biz: any = null;
    let customer: any = null;

    try {
      inv = (
        await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.businessId, session.businessId)))
          .limit(1)
      )[0];

      if (!inv) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      items = await db
        .select()
        .from(invoiceItems)
        .where(and(eq(invoiceItems.invoiceId, id), eq(invoiceItems.businessId, session.businessId)));

      biz = (
        await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, session.businessId))
          .limit(1)
      )[0];

      if (inv.customerId) {
        customer = (
          await db
            .select()
            .from(customers)
            .where(eq(customers.id, inv.customerId))
            .limit(1)
        )[0];
      }
    } catch {
      // Memory store fallback
      inv = memoryStore.invoices.find((i) => i.id === id && i.businessId === session.businessId);
      if (!inv) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      items = memoryStore.invoiceItems.filter((item) => item.invoiceId === id);
      biz = memoryStore.businesses.find((b) => b.id === session.businessId) || memoryStore.businesses[0];
      if (inv.customerId) {
        customer = memoryStore.customers.find((c) => c.id === inv.customerId);
      }
    }

    return NextResponse.json({
      invoice: inv,
      items,
      business: biz,
      customer,
    });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
