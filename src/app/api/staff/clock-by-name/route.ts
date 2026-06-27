import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffAttendance, hotelUsers, shifts } from "@/db/schema";
import { eq, and, isNull, or, ilike, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

// POST — Clock in/out by name (standalone or authenticated)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, identifier, hotelId: bodyHotelId } = body;

    const roleInfo = await getUserRole().catch(() => null);
    const hotelId = roleInfo?.hotelId || bodyHotelId;

    if (!hotelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    if (!["in", "out"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const searchTerm = identifier.trim();

    // Try to find staff by name in hotel_users (text column, safe to ilike)
    const staffByName = await db
      .select()
      .from(hotelUsers)
      .where(
        and(
          eq(hotelUsers.hotelId, hotelId),
          ilike(hotelUsers.name, `%${searchTerm}%`)
        )
      )
      .limit(5);

    // Also try exact UUID match for users who type their userId
    let found = staffByName[0];
    if (!found) {
      const byUuid = await db
        .select()
        .from(hotelUsers)
        .where(
          and(
            eq(hotelUsers.hotelId, hotelId),
            eq(hotelUsers.userId, searchTerm)
          )
        )
        .limit(1);
      found = byUuid[0];
    }

    if (!found) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (staffByName.length > 1) {
      return NextResponse.json({ error: "Multiple matches. Be more specific." }, { status: 400 });
    }

    if (action === "in") {
      const [existing] = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.userId, found.userId),
            eq(staffAttendance.hotelId, hotelId),
            isNull(staffAttendance.clockOut),
          )
        )
        .limit(1);

      if (existing) {
        return NextResponse.json({ error: "Already clocked in" }, { status: 400 });
      }

      const [activeShift] = await db
        .select()
        .from(shifts)
        .where(and(eq(shifts.hotelId, hotelId), isNull(shifts.closedAt)))
        .limit(1);

      const [record] = await db
        .insert(staffAttendance)
        .values({
          hotelId,
          userId: found.userId,
          name: found.name || searchTerm,
          clockIn: new Date(),
          shiftId: activeShift?.id || null,
        })
        .returning();

      return NextResponse.json({ ...record, role: found.role, name: found.name || searchTerm });
    }

    if (action === "out") {
      const [openRecord] = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.userId, found.userId),
            eq(staffAttendance.hotelId, hotelId),
            isNull(staffAttendance.clockOut),
          )
        )
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

      return NextResponse.json({ ...updated, role: found.role, name: found.name || searchTerm });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Clock by name error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — List staff for a hotel (standalone or authenticated)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const hotelIdParam = searchParams.get("hotelId");

    const roleInfo = await getUserRole().catch(() => null);
    const hotelId = hotelIdParam || roleInfo?.hotelId;

    if (!hotelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staff = await db
      .select({
        userId: hotelUsers.userId,
        name: hotelUsers.name,
        role: hotelUsers.role,
      })
      .from(hotelUsers)
      .where(eq(hotelUsers.hotelId, hotelId));

    let filtered = staff;
    if (query) {
      filtered = staff.filter((s) => {
        const search = query.toLowerCase();
        return (
          (s.name && s.name.toLowerCase().includes(search)) ||
          s.role.toLowerCase().includes(search)
        );
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Staff list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
