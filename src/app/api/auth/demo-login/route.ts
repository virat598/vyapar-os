import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { users, memberships, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDefaultBusiness } from "@/lib/seed";
import { memoryStore } from "@/lib/memoryStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, businessId } = body;

    try {
      await ensureDefaultBusiness();
    } catch {
      // Gracefully continue on environments without local PostgreSQL
    }

    let targetUserId = userId;
    let targetBizId = businessId;

    try {
      if (!targetUserId) {
        const firstUser = await db.select().from(users).limit(1);
        if (firstUser.length > 0) targetUserId = firstUser[0].id;
      }

      if (!targetBizId && targetUserId) {
        const mem = await db
          .select()
          .from(memberships)
          .where(eq(memberships.userId, targetUserId))
          .limit(1);

        if (mem.length > 0) {
          targetBizId = mem[0].businessId;
        } else {
          const firstBiz = await db.select().from(businesses).limit(1);
          if (firstBiz.length > 0) targetBizId = firstBiz[0].id;
        }
      }
    } catch {
      // Fallback to memoryStore
      if (!targetUserId) {
        targetUserId = memoryStore.users[0]?.id;
      }
      if (!targetBizId) {
        const mem = memoryStore.memberships.find((m) => m.userId === targetUserId);
        targetBizId = mem ? mem.businessId : memoryStore.businesses[0]?.id;
      }
    }

    if (!targetUserId || !targetBizId) {
      targetUserId = memoryStore.users[0]?.id || "usr_rajesh_owner";
      targetBizId = memoryStore.businesses[0]?.id || "biz_krishna_fmcg";
    }

    await setSessionCookie(targetUserId, targetBizId);

    return NextResponse.json({ success: true, userId: targetUserId, businessId: targetBizId });
  } catch (error) {
    console.error("Error in demo-login:", error);
    return NextResponse.json({ error: "Failed to switch persona" }, { status: 500 });
  }
}
