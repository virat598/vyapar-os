import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { products, categories, stockMovements, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const lowStockOnly = searchParams.get("lowStock") === "true";

    let allProducts: any[] = [];
    try {
      allProducts = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          categoryId: products.categoryId,
          categoryName: categories.name,
          unit: products.unit,
          costPrice: products.costPrice,
          sellingPrice: products.sellingPrice,
          mrp: products.mrp,
          taxRate: products.taxRate,
          hsnCode: products.hsnCode,
          barcode: products.barcode,
          currentStock: products.currentStock,
          minStockAlert: products.minStockAlert,
          isActive: products.isActive,
          createdAt: products.createdAt,
        })
        .from(products)
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .where(eq(products.businessId, session.businessId));
    } catch {
      allProducts = memoryStore.products
        .filter((p) => p.businessId === session.businessId)
        .map((p) => {
          const c = memoryStore.categories.find((cat) => cat.id === p.categoryId);
          return { ...p, categoryName: c?.name || "General" };
        });
    }

    let filtered = allProducts;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    if (categoryId) {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }

    if (lowStockOnly) {
      filtered = filtered.filter((p) => p.currentStock <= p.minStockAlert);
    }

    return NextResponse.json({ products: filtered });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
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
      return NextResponse.json({ error: "Permission denied to add products" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      categoryId,
      unit = "PCS",
      costPrice = 0,
      sellingPrice = 0,
      mrp = 0,
      taxRate = 18,
      hsnCode = "",
      barcode = "",
      initialStock = 0,
      minStockAlert = 10,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const cleanSku = (sku && sku.trim())
      ? sku.trim().toUpperCase()
      : `PRD-${Date.now().toString(36).toUpperCase()}`;
    const newProdId = "prod_" + Math.random().toString(36).substring(2, 10);
    const numInitialStock = Math.max(0, parseInt(initialStock, 10) || 0);

    const productRecord = {
      id: newProdId,
      businessId: session.businessId,
      sku: cleanSku,
      name: name.trim(),
      categoryId: categoryId || null,
      unit: unit || "PCS",
      costPrice: Math.max(0, parseInt(costPrice, 10) || 0),
      sellingPrice: Math.max(0, parseInt(sellingPrice, 10) || 0),
      mrp: Math.max(0, parseInt(mrp, 10) || 0),
      taxRate: parseInt(taxRate, 10) || 18,
      hsnCode: hsnCode?.trim() || null,
      barcode: barcode?.trim() || null,
      currentStock: numInitialStock,
      minStockAlert: Math.max(0, parseInt(minStockAlert, 10) || 10),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const existing = await db
        .select()
        .from(products)
        .where(and(eq(products.businessId, session.businessId), eq(products.sku, cleanSku)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ error: `A product with SKU "${cleanSku}" already exists.` }, { status: 400 });
      }

      const [createdProduct] = await db
        .insert(products)
        .values(productRecord)
        .returning();

      if (numInitialStock > 0) {
        await db.insert(stockMovements).values({
          id: "mov_" + Math.random().toString(36).substring(2, 10),
          businessId: session.businessId,
          productId: newProdId,
          movementType: "opening_stock",
          quantity: numInitialStock,
          balanceAfter: numInitialStock,
          referenceType: "opening",
          notes: "Initial inventory setup",
          createdByName: session.name,
        });
      }

      return NextResponse.json({ success: true, product: createdProduct });
    } catch {
      // Memory store fallback
      memoryStore.products.push(productRecord);
      return NextResponse.json({ success: true, product: productRecord });
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, sku, categoryId, unit, costPrice, sellingPrice, mrp, taxRate, minStockAlert, isActive, barcode } = body;

    try {
      const [updated] = await db
        .update(products)
        .set({
          name: name?.trim(),
          ...(sku ? { sku: sku.trim().toUpperCase() } : {}),
          categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
          unit,
          costPrice: costPrice !== undefined ? parseInt(costPrice, 10) : undefined,
          sellingPrice: sellingPrice !== undefined ? parseInt(sellingPrice, 10) : undefined,
          mrp: mrp !== undefined ? parseInt(mrp, 10) : undefined,
          taxRate: taxRate !== undefined ? parseInt(taxRate, 10) : undefined,
          barcode: barcode !== undefined ? (barcode?.trim() || null) : undefined,
          minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert, 10) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, id), eq(products.businessId, session.businessId)))
        .returning();

      return NextResponse.json({ success: true, product: updated });
    } catch {
      const p = memoryStore.products.find((prod) => prod.id === id);
      if (p) {
        if (name) p.name = name.trim();
        if (sku) p.sku = sku.trim().toUpperCase();
        if (categoryId !== undefined) p.categoryId = categoryId || null;
        if (unit) p.unit = unit;
        if (costPrice !== undefined) p.costPrice = parseInt(costPrice, 10);
        if (sellingPrice !== undefined) p.sellingPrice = parseInt(sellingPrice, 10);
        if (taxRate !== undefined) p.taxRate = parseInt(taxRate, 10);
        if (barcode !== undefined) p.barcode = barcode?.trim() || null;
        if (minStockAlert !== undefined) p.minStockAlert = parseInt(minStockAlert, 10);
        if (isActive !== undefined) p.isActive = Boolean(isActive);
      }
      return NextResponse.json({ success: true, product: p });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    try {
      await db
        .delete(products)
        .where(and(eq(products.id, id), eq(products.businessId, session.businessId)));
    } catch {
      const idx = memoryStore.products.findIndex((p) => p.id === id);
      if (idx !== -1) memoryStore.products.splice(idx, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
