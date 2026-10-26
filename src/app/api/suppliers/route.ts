import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { suppliers, auditLogs } from "@/db/schema";
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
        .from(suppliers)
        .where(eq(suppliers.businessId, session.businessId))
        .orderBy(desc(suppliers.currentBalance));
      return NextResponse.json({ suppliers: list });
    } catch {
      const list = memoryStore.suppliers.filter((s) => s.businessId === session.businessId);
      return NextResponse.json({ suppliers: list });
    }
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, gstin, address, city, currentBalance = 0, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    const newSupId = "sup_" + Math.random().toString(36).substring(2, 10);
    const balancePaise = parseInt(currentBalance, 10) || 0;

    const supplierRecord = {
      id: newSupId,
      businessId: session.businessId,
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      gstin: gstin?.trim().toUpperCase() || null,
      address: address?.trim() || null,
      city: city?.trim() || "Pune",
      currentBalance: balancePaise,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const [created] = await db
        .insert(suppliers)
        .values(supplierRecord)
        .returning();
      return NextResponse.json({ success: true, supplier: created });
    } catch {
      memoryStore.suppliers.push(supplierRecord);
      return NextResponse.json({ success: true, supplier: supplierRecord });
    }
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, phone, email, gstin, address, city, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    try {
      const [updated] = await db
        .update(suppliers)
        .set({
          name: name?.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          gstin: gstin?.trim().toUpperCase() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          notes: notes?.trim() || null,
          updatedAt: new Date(),
        })
        .where(and(eq(suppliers.id, id), eq(suppliers.businessId, session.businessId)))
        .returning();
      return NextResponse.json({ success: true, supplier: updated });
    } catch {
      const sup = memoryStore.suppliers.find((s) => s.id === id);
      if (sup) {
        if (name) sup.name = name.trim();
        if (phone) sup.phone = phone.trim();
        if (address) sup.address = address.trim();
      }
      return NextResponse.json({ success: true, supplier: sup });
    }
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}
