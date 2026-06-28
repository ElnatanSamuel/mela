import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceRequests, tables, hotels, tableAssignments } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { hotelId, tableId, type } = await req.json();

    if (!hotelId || !tableId || !type) {
      return NextResponse.json({ error: "hotelId, tableId, and type are required" }, { status: 400 });
    }

    if (!["call_waiter", "request_bill", "need_help"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Look up assigned waiter for this table
    const [assignment] = await db
      .select({ userId: tableAssignments.userId })
      .from(tableAssignments)
      .where(and(eq(tableAssignments.hotelId, hotelId), eq(tableAssignments.tableId, tableId)))
      .limit(1);

    const [request] = await db.insert(serviceRequests).values({
      hotelId,
      tableId,
      type,
      status: "pending",
    }).returning();

    return NextResponse.json({ ...request, assignedWaiterId: assignment?.userId || null });
  } catch (err: any) {
    console.error("Service request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo || !roleInfo.hotelId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isWaiter = roleInfo.role === "waiter";

    // Check hotel settings
    const [hotel] = await db
      .select({ settings: hotels.settings })
      .from(hotels)
      .where(eq(hotels.id, roleInfo.hotelId))
      .limit(1);

    const settings = (hotel?.settings as any) || {};
    const assignmentEnabled = settings.enableTableAssignment === true;

    let assignedTableIds: string[] | null = null;

    // If waiter and assignment enabled, get their assigned tables
    if (isWaiter && assignmentEnabled) {
      const assignments = await db
        .select({ tableId: tableAssignments.tableId })
        .from(tableAssignments)
        .where(eq(tableAssignments.userId, roleInfo.userId));

      assignedTableIds = assignments.map((a) => a.tableId);

      if (assignedTableIds.length === 0) {
        return NextResponse.json([]);
      }
    }

    const baseQuery = db
      .select({
        id: serviceRequests.id,
        type: serviceRequests.type,
        status: serviceRequests.status,
        tableId: serviceRequests.tableId,
        tableNumber: tables.tableNumber,
        createdAt: serviceRequests.createdAt,
      })
      .from(serviceRequests)
      .leftJoin(tables, eq(serviceRequests.tableId, tables.id))
      .where(
        assignedTableIds
          ? and(
              eq(serviceRequests.hotelId, roleInfo.hotelId),
              eq(serviceRequests.status, "pending"),
              sql`${serviceRequests.tableId} IN ${assignedTableIds}`
            )
          : and(
              eq(serviceRequests.hotelId, roleInfo.hotelId),
              eq(serviceRequests.status, "pending")
            )
      )
      .orderBy(desc(serviceRequests.createdAt))
      .limit(20);

    const requests = await baseQuery;

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Service requests GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
