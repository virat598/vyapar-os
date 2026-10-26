import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";
import { setSessionCookie } from "@/lib/auth";
import { resetMemoryStore } from "@/lib/memoryStore";

export async function POST() {
  try {
    try {
      const data = await seedDatabase();
      await setSessionCookie(data.user.id, data.business.id);
      return NextResponse.json({ success: true, message: "Sample data loaded successfully" });
    } catch {
      const store = resetMemoryStore();
      await setSessionCookie(store.users[0].id, store.businesses[0].id);
      return NextResponse.json({ success: true, message: "Sample data loaded successfully (in-memory mode)" });
    }
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to load sample data" }, { status: 500 });
  }
}
