import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { customers, auditLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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
        .from(customers)
        .where(eq(customers.businessId, session.businessId))
        .orderBy(desc(customers.currentBalance));
      return NextResponse.json({ customers: list });
    } catch {
      const list = memoryStore.customers.filter((c) => c.businessId === session.businessId);
      return NextResponse.json({ customers: list });
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, gstin, billingAddress, city, state, creditLimit = 5000000, openingBalance = 0, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const newCustId = "cust_" + Math.random().toString(36).substring(2, 10);
    const balancePaise = parseInt(openingBalance, 10) || 0;

    const customerRecord = {
      id: newCustId,
      businessId: session.businessId,
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      gstin: gstin?.trim().toUpperCase() || null,
      billingAddress: billingAddress?.trim() || null,
      city: city?.trim() || "Pune",
      state: state?.trim() || "Maharashtra",
      creditLimit: parseInt(creditLimit, 10) || 5000000,
      currentBalance: balancePaise,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const [created] = await db
        .insert(customers)
        .values(customerRecord)
        .returning();
      return NextResponse.json({ success: true, customer: created });
    } catch {
      memoryStore.customers.push(customerRecord);
      return NextResponse.json({ success: true, customer: customerRecord });
    }
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, phone, email, gstin, billingAddress, city, state, creditLimit, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    try {
      const [updated] = await db
        .update(customers)
        .set({
          name: name?.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          gstin: gstin?.trim().toUpperCase() || null,
          billingAddress: billingAddress?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          creditLimit: parseInt(creditLimit, 10) || 5000000,
          notes: notes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(and(eq(customers.id, id), eq(customers.businessId, session.businessId)))
        .returning();

      return NextResponse.json({ success: true, customer: updated });
    } catch {
      const cust = memoryStore.customers.find((c) => c.id === id);
      if (cust) {
        if (name) cust.name = name.trim();
        if (phone) cust.phone = phone.trim();
        if (creditLimit !== undefined) cust.creditLimit = parseInt(creditLimit, 10);
      }
      return NextResponse.json({ success: true, customer: cust });
    }
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
