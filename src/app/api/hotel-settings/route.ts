import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

// GET — Get hotel settings
export async function GET() {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo?.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [hotel] = await db
      .select({ settings: hotels.settings })
      .from(hotels)
      .where(eq(hotels.id, roleInfo.hotelId))
      .limit(1);

    return NextResponse.json(hotel?.settings || {});
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Update hotel settings (merge with existing)
export async function POST(req: Request) {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo?.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (roleInfo.role !== "owner" && roleInfo.role !== "manager") {
      return NextResponse.json({ error: "Only managers can update settings" }, { status: 403 });
    }

    const newSettings = await req.json();

    // Get existing settings
    const [hotel] = await db
      .select({ settings: hotels.settings })
      .from(hotels)
      .where(eq(hotels.id, roleInfo.hotelId))
      .limit(1);

    const existing = (hotel?.settings as any) || {};
    const merged = { ...existing, ...newSettings };

    const [updated] = await db
      .update(hotels)
      .set({ settings: merged, updatedAt: new Date() })
      .where(eq(hotels.id, roleInfo.hotelId))
      .returning();

    return NextResponse.json(updated.settings);
  } catch (error) {
    console.error("Hotel settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
