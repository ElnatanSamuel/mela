import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, tables } from "@/db/schema";
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
      id: reservations.id,
      hotelId: reservations.hotelId,
      tableId: reservations.tableId,
      customerName: reservations.customerName,
      customerPhone: reservations.customerPhone,
      guestCount: reservations.guestCount,
      reservationDate: reservations.reservationDate,
      startTime: reservations.startTime,
      endTime: reservations.endTime,
      status: reservations.status,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
      tableNumber: tables.tableNumber,
    })
    .from(reservations)
    .leftJoin(tables, eq(reservations.tableId, tables.id))
    .where(and(
      eq(reservations.hotelId, hotelId),
      gte(reservations.reservationDate, startDate),
      lte(reservations.reservationDate, endDate),
    ))
    .orderBy(reservations.startTime);

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tableId, customerName, customerPhone, guestCount, reservationDate, startTime, endTime, notes } = await req.json();

  if (!customerName || !customerPhone || !guestCount || !reservationDate || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [reservation] = await db.insert(reservations).values({
    hotelId: roleInfo.hotelId,
    tableId: tableId || null,
    customerName,
    customerPhone,
    guestCount,
    reservationDate: new Date(reservationDate),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    notes: notes || null,
  }).returning();

  return NextResponse.json(reservation);
}
