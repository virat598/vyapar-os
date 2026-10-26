import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { businesses, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ROLE_PERMISSIONS } from "@/lib/types";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
    }

    let userBusinesses: any[] = [];
    try {
      userBusinesses = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          legalName: businesses.legalName,
          industry: businesses.industry,
          gstin: businesses.gstin,
          role: memberships.role,
        })
        .from(memberships)
        .innerJoin(businesses, eq(businesses.id, memberships.businessId))
        .where(eq(memberships.userId, session.id));
    } catch {
      const userMems = memoryStore.memberships.filter((m) => m.userId === session.id);
      userBusinesses = userMems.map((m) => {
        const b = memoryStore.businesses.find((biz) => biz.id === m.businessId);
        return {
          id: b?.id || m.businessId,
          name: b?.name || "Business",
          legalName: b?.legalName || "",
          industry: b?.industry || "Distributors and wholesalers",
          gstin: b?.gstin || "",
          role: m.role,
        };
      });
    }

    const permissions = ROLE_PERMISSIONS[session.role] || ROLE_PERMISSIONS.owner;

    return NextResponse.json({
      authenticated: true,
      session,
      permissions,
      businesses: userBusinesses,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
