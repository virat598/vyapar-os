import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
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
        .from(categories)
        .where(eq(categories.businessId, session.businessId));
      return NextResponse.json({ categories: list });
    } catch {
      const list = memoryStore.categories.filter((c) => c.businessId === session.businessId);
      return NextResponse.json({ categories: list });
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color = "emerald" } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const newCat = {
      id: "cat_" + Math.random().toString(36).substring(2, 9),
      businessId: session.businessId,
      name: name.trim(),
      color,
      createdAt: new Date(),
    };

    try {
      const [created] = await db
        .insert(categories)
        .values(newCat)
        .returning();
      return NextResponse.json({ success: true, category: created });
    } catch {
      memoryStore.categories.push(newCat);
      return NextResponse.json({ success: true, category: newCat });
    }
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
