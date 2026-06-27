import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffSchedules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await db
    .select()
    .from(staffSchedules)
    .where(eq(staffSchedules.hotelId, roleInfo.hotelId))
    .orderBy(staffSchedules.dayOfWeek, staffSchedules.startTime);

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, dayOfWeek, startTime, endTime } = await req.json();

  if (!userId || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json(
      { error: "userId, dayOfWeek, startTime, and endTime are required" },
      { status: 400 },
    );
  }

  const existing = await db
    .select()
    .from(staffSchedules)
    .where(
      and(
        eq(staffSchedules.hotelId, roleInfo.hotelId),
        eq(staffSchedules.userId, userId),
        eq(staffSchedules.dayOfWeek, dayOfWeek),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(staffSchedules)
      .set({ startTime, endTime })
      .where(eq(staffSchedules.id, existing[0].id))
      .returning();

    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(staffSchedules)
    .values({
      hotelId: roleInfo.hotelId,
      userId,
      dayOfWeek,
      startTime,
      endTime,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(staffSchedules)
    .where(
      and(
        eq(staffSchedules.id, id),
        eq(staffSchedules.hotelId, roleInfo.hotelId),
      ),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(deleted);
}
