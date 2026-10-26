import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { stockMovements, products, auditLogs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
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
    const productId = searchParams.get("productId");

    try {
      const query = db
        .select({
          id: stockMovements.id,
          productId: stockMovements.productId,
          productName: products.name,
          productSku: products.sku,
          unit: products.unit,
          movementType: stockMovements.movementType,
          quantity: stockMovements.quantity,
          balanceAfter: stockMovements.balanceAfter,
          referenceType: stockMovements.referenceType,
          referenceId: stockMovements.referenceId,
          notes: stockMovements.notes,
          createdByName: stockMovements.createdByName,
          createdAt: stockMovements.createdAt,
        })
        .from(stockMovements)
        .innerJoin(products, eq(products.id, stockMovements.productId))
        .where(
          productId
            ? and(eq(stockMovements.businessId, session.businessId), eq(stockMovements.productId, productId))
            : eq(stockMovements.businessId, session.businessId)
        )
        .orderBy(desc(stockMovements.createdAt))
        .limit(100);

      const movements = await query;
      return NextResponse.json({ movements });
    } catch {
      const list = memoryStore.stockMovements
        .filter(
          (m) =>
            m.businessId === session.businessId &&
            (!productId || m.productId === productId)
        )
        .map((m) => {
          const p = memoryStore.products.find((prod) => prod.id === m.productId);
          return {
            id: m.id,
            productId: m.productId,
            productName: p?.name || "Product",
            productSku: p?.sku || "",
            unit: p?.unit || "PCS",
            movementType: m.movementType,
            quantity: m.quantity,
            balanceAfter: m.balanceAfter,
            referenceType: m.referenceType,
            referenceId: m.referenceId,
            notes: m.notes,
            createdByName: m.createdByName,
            createdAt: m.createdAt,
          };
        });
      return NextResponse.json({ movements: list });
    }
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canManageProducts) {
      return NextResponse.json({ error: "Permission denied to adjust stock" }, { status: 403 });
    }

    const body = await req.json();
    const { productId, adjustmentType, quantity, notes } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product is required" }, { status: 400 });
    }
    const delta = parseInt(quantity, 10);
    if (!delta || delta === 0) {
      return NextResponse.json({ error: "Non-zero quantity is required" }, { status: 400 });
    }

    try {
      const prodList = await db
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.businessId, session.businessId)))
        .limit(1);

      if (prodList.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const product = prodList[0];
      const newStock = Math.max(0, product.currentStock + delta);

      await db
        .update(products)
        .set({
          currentStock: newStock,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, productId), eq(products.businessId, session.businessId)));

      const movementId = "mov_" + Math.random().toString(36).substring(2, 10);
      const movType = delta > 0 ? "adjustment_in" : "adjustment_out";

      await db.insert(stockMovements).values({
        id: movementId,
        businessId: session.businessId,
        productId,
        movementType: movType,
        quantity: delta,
        balanceAfter: newStock,
        referenceType: "adjustment",
        referenceId: adjustmentType || "Manual Adjustment",
        notes: notes?.trim() || `Manual stock adjustment (${delta > 0 ? "+" : ""}${delta})`,
        createdByName: session.name,
      });

      return NextResponse.json({ success: true, newStock, movementId });
    } catch {
      const p = memoryStore.products.find((prod) => prod.id === productId);
      if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 });

      const newStock = Math.max(0, p.currentStock + delta);
      p.currentStock = newStock;

      const movementId = "mov_" + Math.random().toString(36).substring(2, 10);
      memoryStore.stockMovements.unshift({
        id: movementId,
        businessId: session.businessId,
        productId,
        movementType: delta > 0 ? "adjustment_in" : "adjustment_out",
        quantity: delta,
        balanceAfter: newStock,
        referenceType: "adjustment",
        referenceId: adjustmentType || "Manual Adjustment",
        notes: notes?.trim() || `Manual stock adjustment (${delta > 0 ? "+" : ""}${delta})`,
        createdByName: session.name,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, newStock, movementId });
    }
  } catch (error) {
    console.error("Error creating stock adjustment:", error);
    return NextResponse.json({ error: "Failed to record adjustment" }, { status: 500 });
  }
}
