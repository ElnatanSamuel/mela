import { NextResponse } from "next/server";
import { db } from "@/db";
import { tableAssignments, hotelUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

// GET — List all table assignments for the hotel
export async function GET() {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo?.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assignments = await db
      .select({
        id: tableAssignments.id,
        userId: tableAssignments.userId,
        tableId: tableAssignments.tableId,
        createdAt: tableAssignments.createdAt,
      })
      .from(tableAssignments)
      .where(eq(tableAssignments.hotelId, roleInfo.hotelId));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Table assignments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Assign a waiter to a table (or reassign)
export async function POST(req: Request) {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo?.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (roleInfo.role !== "owner" && roleInfo.role !== "manager") {
      return NextResponse.json({ error: "Only managers can assign tables" }, { status: 403 });
    }

    const { tableId, userId } = await req.json();

    if (!tableId || !userId) {
      return NextResponse.json({ error: "tableId and userId required" }, { status: 400 });
    }

    // Remove existing assignment for this table
    await db
      .delete(tableAssignments)
      .where(and(eq(tableAssignments.hotelId, roleInfo.hotelId), eq(tableAssignments.tableId, tableId)));

    // Create new assignment
    const [assignment] = await db
      .insert(tableAssignments)
      .values({
        hotelId: roleInfo.hotelId,
        tableId,
        userId,
      })
      .returning();

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Table assignment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Remove assignment for a table
export async function DELETE(req: Request) {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo?.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) return NextResponse.json({ error: "tableId required" }, { status: 400 });

    await db
      .delete(tableAssignments)
      .where(and(eq(tableAssignments.hotelId, roleInfo.hotelId), eq(tableAssignments.tableId, tableId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Table assignment DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
