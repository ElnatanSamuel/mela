import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotelUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { hotelId, pin } = await req.json();

    if (!hotelId || !pin) {
      return NextResponse.json({ error: "hotelId and pin required" }, { status: 400 });
    }

    const pinStr = pin.toString().trim();
    if (pinStr.length < 4 || pinStr.length > 6) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }

    const [staff] = await db
      .select({ userId: hotelUsers.userId, name: hotelUsers.name, role: hotelUsers.role })
      .from(hotelUsers)
      .where(and(eq(hotelUsers.hotelId, hotelId), eq(hotelUsers.pin, pinStr)))
      .limit(1);

    if (!staff) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Staff PIN verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
