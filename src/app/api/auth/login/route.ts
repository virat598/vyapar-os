import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { db } from "@/db";
import { users, businesses, memberships, categories, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, phone, avatar, googleId } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let existingUser: any = null;
    let isNewUser = false;

    try {
      existingUser = (await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1))[0];

      if (!existingUser) {
        isNewUser = true;
        const newUserId = "usr_" + Math.random().toString(36).substring(2, 9);
        const [created] = await db
          .insert(users)
          .values({
            id: newUserId,
            email: cleanEmail,
            name: name?.trim() || cleanEmail.split("@")[0],
            phone: phone?.trim() || null,
            avatar:
              avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || cleanEmail)}`,
          })
          .returning();
        existingUser = created;
      }

      const userMems = await db
        .select({
          membershipId: memberships.id,
          businessId: memberships.businessId,
          role: memberships.role,
        })
        .from(memberships)
        .where(eq(memberships.userId, existingUser.id))
        .limit(1);

      let activeBusinessId: string;
      let needsOnboarding = false;

      if (userMems.length > 0) {
        activeBusinessId = userMems[0].businessId;
      } else {
        const newBizId = "biz_" + Math.random().toString(36).substring(2, 9);
        const bizName = name ? `${name.trim()}'s Business` : "My Business Enterprise";

        await db.insert(businesses).values({
          id: newBizId,
          name: bizName,
          legalName: bizName,
          industry: "Distributors and wholesalers",
          currency: "INR",
          timezone: "Asia/Kolkata",
          invoicePrefix: "INV-",
          invoiceCounter: 1001,
        });

        await db.insert(memberships).values({
          id: "mem_" + Math.random().toString(36).substring(2, 9),
          businessId: newBizId,
          userId: existingUser.id,
          role: "owner",
          status: "active",
        });

        activeBusinessId = newBizId;
        needsOnboarding = true;
      }

      await setSessionCookie(existingUser.id, activeBusinessId);

      return NextResponse.json({
        success: true,
        user: existingUser,
        businessId: activeBusinessId,
        needsOnboarding,
        isNewUser,
      });
    } catch {
      // Memory store fallback for Vercel without PostgreSQL
      existingUser = memoryStore.users.find((u) => u.email === cleanEmail);

      if (!existingUser) {
        isNewUser = true;
        existingUser = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          email: cleanEmail,
          name: name?.trim() || cleanEmail.split("@")[0],
          phone: phone?.trim() || null,
          avatar:
            avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || cleanEmail)}`,
          createdAt: new Date(),
        };
        memoryStore.users.push(existingUser);
      }

      const userMem = memoryStore.memberships.find((m) => m.userId === existingUser.id);
      let activeBusinessId: string;
      let needsOnboarding = false;

      if (userMem) {
        activeBusinessId = userMem.businessId;
      } else {
        const newBizId = "biz_" + Math.random().toString(36).substring(2, 9);
        const bizName = name ? `${name.trim()}'s Business` : "My Business Enterprise";
        const newBiz = {
          id: newBizId,
          name: bizName,
          legalName: bizName,
          industry: "Distributors and wholesalers",
          currency: "INR",
          timezone: "Asia/Kolkata",
          invoicePrefix: "INV-",
          invoiceCounter: 1001,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        memoryStore.businesses.push(newBiz);
        memoryStore.memberships.push({
          id: "mem_" + Math.random().toString(36).substring(2, 9),
          businessId: newBizId,
          userId: existingUser.id,
          role: "owner",
          status: "active",
          createdAt: new Date(),
        });
        activeBusinessId = newBizId;
        needsOnboarding = true;
      }

      await setSessionCookie(existingUser.id, activeBusinessId);

      return NextResponse.json({
        success: true,
        user: existingUser,
        businessId: activeBusinessId,
        needsOnboarding,
        isNewUser,
      });
    }
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
