import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, tables, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      payment_status: orders.paymentStatus,
      order_type: orders.orderType,
      total_amount: orders.totalAmount,
      created_at: orders.createdAt,
      tableNumber: tables.tableNumber,
      transactionId: sql<string>`
        (SELECT ${transactions.id} FROM ${transactions}
         WHERE ${transactions.orderId} = ${orders.id}
           AND ${transactions.status} = 'success'
         LIMIT 1)
      `,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(eq(orders.hotelId, roleInfo.hotelId))
    .orderBy(desc(orders.createdAt));

  return NextResponse.json(activeOrders);
}
