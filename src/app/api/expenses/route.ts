import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { expenses, auditLogs } from "@/db/schema";
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
        .from(expenses)
        .where(eq(expenses.businessId, session.businessId))
        .orderBy(desc(expenses.createdAt));
      return NextResponse.json({ expenses: list });
    } catch {
      const list = memoryStore.expenses.filter((e) => e.businessId === session.businessId);
      return NextResponse.json({ expenses: list });
    }
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { category, amount, expenseDate = new Date().toISOString().split("T")[0], paymentMethod = "cash", notes } = body;

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }
    if (!category || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const expId = "exp_" + Math.random().toString(36).substring(2, 10);
    const expRecord = {
      id: expId,
      businessId: session.businessId,
      category: category.trim(),
      amount: numAmount,
      expenseDate,
      paymentMethod,
      notes: notes?.trim() || null,
      createdByName: session.name,
      createdAt: new Date(),
    };

    try {
      const [created] = await db
        .insert(expenses)
        .values(expRecord)
        .returning();
      return NextResponse.json({ success: true, expense: created });
    } catch {
      memoryStore.expenses.unshift(expRecord);
      return NextResponse.json({ success: true, expense: expRecord });
    }
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    try {
      await db
        .delete(expenses)
        .where(and(eq(expenses.id, id), eq(expenses.businessId, session.businessId)));
    } catch {
      const idx = memoryStore.expenses.findIndex((e) => e.id === id);
      if (idx !== -1) memoryStore.expenses.splice(idx, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
