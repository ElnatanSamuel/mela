import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels, hotelUsers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const allHotels = await db.select().from(hotels).orderBy(desc(hotels.createdAt));
  return NextResponse.json(allHotels);
}

export async function POST(req: Request) {
  try {
    const { name, slug, location, phone, userId, logoUrl } = await req.json();

    if (!name || !slug || !userId) {
      return NextResponse.json({ error: "Name, slug, and userId are required" }, { status: 400 });
    }

    const existing = await db.select({ id: hotels.id }).from(hotels).where(eq(hotels.slug, slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "A hotel with this slug already exists" }, { status: 409 });
    }

    const [hotel] = await db.insert(hotels).values({
      name,
      slug,
      location,
      phone,
      logoUrl,
    }).returning();

    await db.insert(hotelUsers).values({
      hotelId: hotel.id,
      userId,
      role: "owner",
    });

    return NextResponse.json(hotel);
  } catch (err: any) {
    if (err.message?.includes("duplicate key")) {
      return NextResponse.json({ error: "A hotel with this slug already exists" }, { status: 409 });
    }
    console.error("Create hotel error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
