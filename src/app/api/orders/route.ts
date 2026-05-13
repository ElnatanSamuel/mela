import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, tables } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      total_amount: orders.totalAmount,
      created_at: orders.createdAt,
      tableNumber: tables.tableNumber,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(eq(orders.hotelId, roleInfo.hotelId))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json(activeOrders);
}
