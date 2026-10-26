import { NextResponse } from "next/server";
import { getCurrentSession, setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { memoryStore } from "@/lib/memoryStore";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await req.json();
    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    let isMember = false;
    try {
      const mem = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, session.id), eq(memberships.businessId, businessId)))
        .limit(1);
      isMember = mem.length > 0;
    } catch {
      isMember = memoryStore.memberships.some(
        (m) => m.userId === session.id && m.businessId === businessId
      );
    }

    if (!isMember) {
      return NextResponse.json({ error: "You are not a member of this business" }, { status: 403 });
    }

    await setSessionCookie(session.id, businessId);

    return NextResponse.json({ success: true, businessId });
  } catch (error) {
    console.error("Error switching business:", error);
    return NextResponse.json({ error: "Failed to switch business" }, { status: 500 });
  }
}
