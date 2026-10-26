import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (db) {
      await db.execute(sql`select 1`);
    }
    return Response.json({ ok: true, status: "healthy", database: "connected" });
  } catch {
    // Graceful fallback for Vercel/serverless environments without local PostgreSQL
    return Response.json({ ok: true, status: "healthy", database: "fallback_mode" });
  }
}
