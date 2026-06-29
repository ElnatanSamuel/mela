import { NextResponse } from "next/server";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUserRole, getSession } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const { data: { user } } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole();
    if (!role?.hotelId) {
      return NextResponse.json({ error: "No hotel found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const conditions = [eq(complaints.hotelId, role.hotelId)];
    if (status) {
      conditions.push(eq(complaints.status, status as "new" | "acknowledged" | "resolved"));
    }

    const data = await db
      .select()
      .from(complaints)
      .where(and(...conditions))
      .orderBy(desc(complaints.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { data: { user } } = await getSession();
    const body = await request.json();
    const { message, tableId, orderId, hotelId: guestHotelId } = body;

    let hotelId: string | null = null;
    let userId: string | null = null;

    if (user) {
      // Authenticated user (dashboard)
      const role = await getUserRole();
      hotelId = role?.hotelId || null;
      userId = user.id;
    } else if (guestHotelId) {
      // Guest submission (no auth, hotelId from request body)
      hotelId = guestHotelId;
      userId = null;
    }

    if (!hotelId) {
      return NextResponse.json({ error: "Unauthorized or missing hotelId" }, { status: 401 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const data = await db
      .insert(complaints)
      .values({
        hotelId,
        userId,
        message: message.trim(),
        tableId: tableId || null,
        orderId: orderId || null,
      })
      .returning();

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create complaint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
