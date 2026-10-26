import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { memberships, users, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Role, ROLE_PERMISSIONS } from "@/lib/types";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const team = await db
        .select({
          id: memberships.id,
          userId: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          avatar: users.avatar,
          role: memberships.role,
          status: memberships.status,
          createdAt: memberships.createdAt,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(eq(memberships.businessId, session.businessId));
      return NextResponse.json({ team });
    } catch {
      const bizMems = memoryStore.memberships.filter((m) => m.businessId === session.businessId);
      const team = bizMems.map((m) => {
        const u = memoryStore.users.find((usr) => usr.id === m.userId);
        return {
          id: m.id,
          userId: m.userId,
          name: u?.name || "Staff",
          email: u?.email || "staff@store.in",
          phone: u?.phone || null,
          avatar: u?.avatar || null,
          role: m.role,
          status: m.status,
          createdAt: m.createdAt,
        };
      });
      return NextResponse.json({ team });
    }
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canManageTeam) {
      return NextResponse.json({ error: "Only Owner and Admin can invite team members" }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role = "salesperson", phone } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const newUserId = "usr_" + Math.random().toString(36).substring(2, 9);
    const newMemberId = "mem_" + Math.random().toString(36).substring(2, 10);

    const userObj = {
      id: newUserId,
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split("@")[0],
      phone: phone?.trim() || "",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || cleanEmail)}`,
      createdAt: new Date(),
    };

    try {
      let user = (await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1))[0];
      if (!user) {
        const [created] = await db.insert(users).values(userObj).returning();
        user = created;
      }

      await db.insert(memberships).values({
        id: newMemberId,
        businessId: session.businessId,
        userId: user.id,
        role: role as Role,
        status: "active",
      });

      return NextResponse.json({ success: true, user });
    } catch {
      let user = memoryStore.users.find((u) => u.email === cleanEmail);
      if (!user) {
        user = userObj;
        memoryStore.users.push(user);
      }

      memoryStore.memberships.push({
        id: newMemberId,
        businessId: session.businessId,
        userId: user.id,
        role: role as Role,
        status: "active",
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, user });
    }
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canManageTeam) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { membershipId, role } = await req.json();
    if (!membershipId || !role) {
      return NextResponse.json({ error: "Membership ID and role are required" }, { status: 400 });
    }

    try {
      await db
        .update(memberships)
        .set({ role: role as Role })
        .where(and(eq(memberships.id, membershipId), eq(memberships.businessId, session.businessId)));
    } catch {
      const m = memoryStore.memberships.find((mem) => mem.id === membershipId);
      if (m) m.role = role as Role;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = ROLE_PERMISSIONS[session.role];
    if (!permissions.canManageTeam) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get("membershipId");
    if (!membershipId) {
      return NextResponse.json({ error: "Membership ID required" }, { status: 400 });
    }

    try {
      await db
        .delete(memberships)
        .where(and(eq(memberships.id, membershipId), eq(memberships.businessId, session.businessId)));
    } catch {
      const idx = memoryStore.memberships.findIndex((m) => m.id === membershipId);
      if (idx !== -1) memoryStore.memberships.splice(idx, 1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
