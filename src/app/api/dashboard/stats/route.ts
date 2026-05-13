import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, tables } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hotelId = roleInfo.hotelId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Today's Earnings
  const [earnings] = await db
    .select({
      total: sql<number>`sum(cast(${orders.totalAmount} as numeric))`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, today), eq(orders.status, 'served')));

  // 2. Total Tables Served Today
  const [tablesServed] = await db
    .select({
      count: sql<number>`count(distinct ${orders.tableId})`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, today), eq(orders.status, 'served')));

  // 3. Total Items Ordered Today
  const [itemsOrdered] = await db
    .select({
      count: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, today)));

  // 4. Best Selling Items (All time or today? Let's do all time top 5 for "Best Selling")
  const bestSellers = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      totalQuantity: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(cast(${orderItems.unitPrice} as numeric) * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(menuItems.hotelId, hotelId))
    .groupBy(menuItems.id, menuItems.name)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  return NextResponse.json({
    todayEarnings: earnings?.total || 0,
    orderCount: earnings?.count || 0,
    tablesServed: tablesServed?.count || 0,
    itemsOrderedToday: itemsOrdered?.count || 0,
    bestSellers,
  });
}
