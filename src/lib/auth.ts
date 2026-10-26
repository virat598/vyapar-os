import { cookies } from "next/headers";
import { db } from "@/db";
import { users, businesses, memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Role, UserSession } from "./types";
import { memoryStore } from "./memoryStore";

const SESSION_COOKIE = "vyapar_session";

export interface SessionPayload {
  userId: string;
  businessId: string;
}

export function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeSession(token: string): SessionPayload | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.userId !== "string" || typeof parsed.businessId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Validates a session payload directly against the database,
 * falling back to memoryStore if PostgreSQL is not available (e.g., on Vercel).
 */
export async function verifySessionPayload(payload: SessionPayload | null): Promise<UserSession | null> {
  if (!payload || !payload.userId || !payload.businessId) {
    return null;
  }

  try {
    // 1. Verify user exists in database
    const userList = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (userList.length === 0) {
      return null;
    }
    const user = userList[0];

    // 2. Verify user has an active membership in the target business workspace
    const membershipList = await db
      .select({
        role: memberships.role,
        status: memberships.status,
        businessId: businesses.id,
        businessName: businesses.name,
      })
      .from(memberships)
      .innerJoin(businesses, eq(businesses.id, memberships.businessId))
      .where(
        and(
          eq(memberships.userId, user.id),
          eq(memberships.businessId, payload.businessId),
          eq(memberships.status, "active")
        )
      )
      .limit(1);

    if (membershipList.length === 0) {
      return null;
    }

    const mem = membershipList[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      avatar: user.avatar || undefined,
      role: mem.role as Role,
      businessId: mem.businessId,
      businessName: mem.businessName,
    };
  } catch {
    // Fallback to in-memory store for deployments without live PostgreSQL (Vercel)
    const user = memoryStore.users.find((u) => u.id === payload.userId);
    if (!user) return null;

    const mem = memoryStore.memberships.find(
      (m) => m.userId === payload.userId && m.businessId === payload.businessId
    );
    if (!mem) return null;

    const biz = memoryStore.businesses.find((b) => b.id === payload.businessId);
    if (!biz) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      avatar: user.avatar || undefined,
      role: mem.role as Role,
      businessId: biz.id,
      businessName: biz.name,
    };
  }
}

/**
 * Gets the current verified session from request cookies.
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) {
      return null;
    }

    const payload = decodeSession(sessionCookie);
    return await verifySessionPayload(payload);
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, businessId: string) {
  const cookieStore = await cookies();
  const token = encodeSession({ userId, businessId });
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days persistence
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
