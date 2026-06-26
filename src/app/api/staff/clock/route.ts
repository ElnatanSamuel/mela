import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffAttendance } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getSession, getUserRole } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const session = await getSession();
  const user = session?.data?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, shiftId } = await req.json();

  if (action === "in") {
    const [record] = await db.insert(staffAttendance).values({
      hotelId: roleInfo.hotelId,
      userId: user.id,
      clockIn: new Date(),
      shiftId: shiftId || null,
    }).returning();

    return NextResponse.json(record);
  }

  if (action === "out") {
    const [openRecord] = await db
      .select()
      .from(staffAttendance)
      .where(and(
        eq(staffAttendance.userId, user.id),
        eq(staffAttendance.hotelId, roleInfo.hotelId),
        isNull(staffAttendance.clockOut),
      ))
      .orderBy(staffAttendance.createdAt)
      .limit(1);

    if (!openRecord) {
      return NextResponse.json({ error: "No open clock-in found" }, { status: 400 });
    }

    const [updated] = await db
      .update(staffAttendance)
      .set({ clockOut: new Date() })
      .where(eq(staffAttendance.id, openRecord.id))
      .returning();

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
