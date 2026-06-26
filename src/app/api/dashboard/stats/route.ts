import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, tables } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hotelId = roleInfo.hotelId;
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);

  // 1. Today's Summary
  const [earnings] = await db
    .select({
      total: sql<number>`sum(cast(${orders.totalAmount} as numeric))`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, today), eq(orders.status, 'completed')));

  const [tablesServed] = await db
    .select({
      count: sql<number>`count(distinct ${orders.tableId})`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, today), eq(orders.status, 'completed')));

  // 2. Weekly Revenue Flow
  const weeklyRevenue = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'Dy')`,
      total: sql<number>`sum(cast(${orders.totalAmount} as numeric))`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, startOfWeek), eq(orders.status, 'completed')))
    .groupBy(sql`to_char(${orders.createdAt}, 'Dy')`, sql`extract(dow from ${orders.createdAt})`)
    .orderBy(sql`extract(dow from ${orders.createdAt})`);

  // 3. Payment Channels
  const paymentChannels = await db
    .select({
      name: orders.paymentStatus, // Assuming payment_status might hold provider info or we use a separate field later. For now, let's group by status or dummy if schema is missing providers.
      value: sql<number>`sum(cast(${orders.totalAmount} as numeric))`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, startOfWeek), eq(orders.status, 'completed')))
    .groupBy(orders.paymentStatus);

  // 4. Insights
  const [avgTransaction] = await db
    .select({
      value: sql<number>`avg(cast(${orders.totalAmount} as numeric))`,
    })
    .from(orders)
    .where(and(eq(orders.hotelId, hotelId), eq(orders.status, 'completed')));

  // 5. Best Sellers (All Time)
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

  // 6. Today's Top Performer (for accurate percentage)
  const [todayTopPerformer] = await db
    .select({
      name: menuItems.name,
      revenue: sql<number>`sum(cast(${orderItems.unitPrice} as numeric) * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.hotelId, hotelId), gte(orders.createdAt, today)))
    .groupBy(menuItems.id, menuItems.name)
    .orderBy(desc(sql`sum(cast(${orderItems.unitPrice} as numeric) * ${orderItems.quantity})`))
    .limit(1);

  // 7. Busiest Hour
  const [busiestHour] = await db
    .select({
      hour: sql<number>`extract(hour from ${orders.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(eq(orders.hotelId, hotelId))
    .groupBy(sql`extract(hour from ${orders.createdAt})`)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const formatHour = (h: number) => {
    if (h === undefined || h === null) return "N/A";
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour} ${period}`;
  };

  return NextResponse.json({
    todayEarnings: earnings?.total || 0,
    orderCount: earnings?.count || 0,
    tablesServed: tablesServed?.count || 0,
    weeklyRevenue: weeklyRevenue.length > 0 ? weeklyRevenue : [
      { day: "Mon", total: 0 }, { day: "Tue", total: 0 }, { day: "Wed", total: 0 },
      { day: "Thu", total: 0 }, { day: "Fri", total: 0 }, { day: "Sat", total: 0 }, { day: "Sun", total: 0 }
    ],
    paymentChannels: paymentChannels.length > 0 ? paymentChannels : [
      { name: "Digital", value: 0 }, { name: "Cash", value: 0 }
    ],
    avgTransaction: Math.round(Number(avgTransaction?.value || 0)),
    bestSellers,
    todayTopPerformer: todayTopPerformer || null,
    busiestTime: formatHour(busiestHour?.hour),
  });
}
