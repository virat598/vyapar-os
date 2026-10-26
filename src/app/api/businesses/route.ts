import { NextResponse } from "next/server";
import { getCurrentSession, setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { businesses, memberships, categories, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IndustryType } from "@/lib/types";
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
        .select({
          id: businesses.id,
          name: businesses.name,
          legalName: businesses.legalName,
          industry: businesses.industry,
          gstin: businesses.gstin,
          phone: businesses.phone,
          email: businesses.email,
          address: businesses.address,
          city: businesses.city,
          state: businesses.state,
          pincode: businesses.pincode,
          invoicePrefix: businesses.invoicePrefix,
          invoiceCounter: businesses.invoiceCounter,
          role: memberships.role,
          createdAt: businesses.createdAt,
        })
        .from(memberships)
        .innerJoin(businesses, eq(businesses.id, memberships.businessId))
        .where(eq(memberships.userId, session.id));

      return NextResponse.json({ businesses: list });
    } catch {
      const userMems = memoryStore.memberships.filter((m) => m.userId === session.id);
      const list = userMems.map((m) => {
        const b = memoryStore.businesses.find((biz) => biz.id === m.businessId);
        return {
          id: b?.id || m.businessId,
          name: b?.name || "Business",
          legalName: b?.legalName || "",
          industry: b?.industry || "Distributors and wholesalers",
          gstin: b?.gstin || "",
          phone: b?.phone || "",
          email: b?.email || "",
          address: b?.address || "",
          city: b?.city || "Pune",
          state: b?.state || "Maharashtra",
          pincode: b?.pincode || "",
          invoicePrefix: b?.invoicePrefix || "INV-",
          invoiceCounter: b?.invoiceCounter || 1001,
          role: m.role,
          createdAt: b?.createdAt || new Date(),
        };
      });
      return NextResponse.json({ businesses: list });
    }
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      legalName,
      industry,
      gstin,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      invoicePrefix = "INV-",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const newBizId = "biz_" + Math.random().toString(36).substring(2, 10);

    const newBiz = {
      id: newBizId,
      name: name.trim(),
      legalName: legalName?.trim() || name.trim(),
      industry: (industry as IndustryType) || "Distributors and wholesalers",
      gstin: gstin?.trim().toUpperCase() || "",
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      address: address?.trim() || "",
      city: city?.trim() || "Mumbai",
      state: state?.trim() || "Maharashtra",
      pincode: pincode?.trim() || "",
      currency: "INR",
      timezone: "Asia/Kolkata",
      financialYearStart: "04-01",
      invoicePrefix: (invoicePrefix || "INV-").toUpperCase(),
      invoiceCounter: 1001,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const [createdBiz] = await db
        .insert(businesses)
        .values(newBiz)
        .returning();

      // Add user as Owner
      await db.insert(memberships).values({
        id: "mem_" + Math.random().toString(36).substring(2, 10),
        businessId: newBizId,
        userId: session.id,
        role: "owner",
        status: "active",
      });

      // Seed default categories according to industry
      const defaultCats = getIndustryDefaultCategories(industry);
      for (const catName of defaultCats) {
        await db.insert(categories).values({
          id: "cat_" + Math.random().toString(36).substring(2, 9),
          businessId: newBizId,
          name: catName,
          color: "emerald",
        });
      }

      await setSessionCookie(session.id, newBizId);
      return NextResponse.json({ success: true, business: createdBiz });
    } catch {
      // Memory store fallback
      memoryStore.businesses.push(newBiz);
      memoryStore.memberships.push({
        id: "mem_" + Math.random().toString(36).substring(2, 10),
        businessId: newBizId,
        userId: session.id,
        role: "owner",
        status: "active",
        createdAt: new Date(),
      });

      const defaultCats = getIndustryDefaultCategories(industry);
      for (const catName of defaultCats) {
        memoryStore.categories.push({
          id: "cat_" + Math.random().toString(36).substring(2, 9),
          businessId: newBizId,
          name: catName,
          color: "emerald",
          createdAt: new Date(),
        });
      }

      await setSessionCookie(session.id, newBizId);
      return NextResponse.json({ success: true, business: newBiz });
    }
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}

function getIndustryDefaultCategories(industry?: string): string[] {
  switch (industry) {
    case "FMCG distributors":
      return ["Packaged Foods", "Edible Oils", "Soaps & Cleaners", "Personal Care", "Beverages"];
    case "Grocery and general retail":
      return ["Grains & Pulses", "Spices & Masalas", "Dairy Products", "Snacks", "Home Essentials"];
    case "Electronics and mobile shops":
      return ["Smartphones", "Mobile Accessories", "Laptops & Tablets", "Audio & Speakers", "Smart Wearables"];
    case "Automobile dealers and auto-parts businesses":
      return ["Braking Systems", "Engine Oils & Lubricants", "Filters & Belts", "Electrical & Lighting", "Suspension"];
    case "Hardware and building materials":
      return ["Pipes & Fittings", "Cements & Mortar", "Fasteners & Screws", "Paints & Waterproofing", "Hand & Power Tools"];
    case "Garments and fashion retail":
      return ["Men's Wear", "Women's Ethnic", "Western Wear", "Kids Fashion", "Accessories & Belts"];
    case "Furniture businesses":
      return ["Living Room", "Bedroom Sets", "Office Chairs & Desks", "Dining Tables", "Modular Storage"];
    case "Pharmacies":
      return ["Prescription Medicines", "OTC Pain Relief", "Vitamins & Supplements", "First Aid & Surgical", "Ayurvedic Products"];
    case "Service businesses":
      return ["Standard Labor", "Inspection & Diagnosis", "Annual Maintenance", "Emergency Callout", "Spare Part Replacements"];
    default:
      return ["General Products", "Fast Moving Goods", "Seasonal Items", "Raw Materials"];
  }
}
