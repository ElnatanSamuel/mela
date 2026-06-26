import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceRequests, tables, hotels } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const { hotelId, tableId, type } = await req.json();

    if (!hotelId || !tableId || !type) {
      return NextResponse.json({ error: "hotelId, tableId, and type are required" }, { status: 400 });
    }

    if (!["call_waiter", "request_bill"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const [request] = await db.insert(serviceRequests).values({
      hotelId,
      tableId,
      type,
      status: "pending",
    }).returning();

    return NextResponse.json(request);
  } catch (err: any) {
    console.error("Service request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await db
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
    .where(and(
      eq(serviceRequests.hotelId, roleInfo.hotelId),
      eq(serviceRequests.status, "pending"),
    ))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(20);

  return NextResponse.json(requests);
}
