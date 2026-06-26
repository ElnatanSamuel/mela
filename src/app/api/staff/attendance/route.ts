import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffAttendance, hotelUsers } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || roleInfo.hotelId;
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date parameter required (YYYY-MM-DD)" }, { status: 400 });
  }

  const startDate = new Date(`${date}T00:00:00.000Z`);
  const endDate = new Date(`${date}T23:59:59.999Z`);

  const records = await db
    .select({
      id: staffAttendance.id,
      userId: staffAttendance.userId,
      clockIn: staffAttendance.clockIn,
      clockOut: staffAttendance.clockOut,
      shiftId: staffAttendance.shiftId,
      createdAt: staffAttendance.createdAt,
    })
    .from(staffAttendance)
    .where(and(
      eq(staffAttendance.hotelId, hotelId),
      gte(staffAttendance.clockIn, startDate),
      lte(staffAttendance.clockIn, endDate),
    ))
    .orderBy(staffAttendance.clockIn);

  const userIds = [...new Set(records.map((r) => r.userId))];

  const users = await db
    .select({
      userId: hotelUsers.userId,
      role: hotelUsers.role,
    })
    .from(hotelUsers)
    .where(and(
      eq(hotelUsers.hotelId, hotelId),
    ));

  const userMap = new Map(users.map((u) => [u.userId, u.role]));

  const result = records.map((r) => {
    const duration = r.clockOut
      ? Math.round((new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime()) / 60000)
      : null;
    return {
      ...r,
      role: userMap.get(r.userId) || null,
      durationMinutes: duration,
    };
  });

  return NextResponse.json(result);
}
