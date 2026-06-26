import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { hotels, orders, auditLogs, tables } from "@/db/schema";
import { count, sum, desc, eq, gte, sql } from "drizzle-orm";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

async function getDashboardData() {
  const [
    [hotelCount],
    [totalRevenue],
    [activeOrders],
    [tableCount],
    [newHotels],
    dailyRevenue,
    ordersByStatus,
    topHotels,
    recentLogs,
  ] = await Promise.all([
    db.select({ value: count() }).from(hotels),
    db.select({ value: sum(orders.totalAmount) }).from(orders),
    db.select({ value: count() }).from(orders).where(sql`${orders.status} NOT IN ('completed', 'cancelled')`),
    db.select({ value: count() }).from(tables),
    db.select({ value: count() }).from(hotels).where(gte(hotels.createdAt, thirtyDaysAgo)),
    db.select({
      date: sql<string>`DATE(${orders.createdAt})`.as('date'),
      revenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as('revenue'),
    })
      .from(orders)
      .where(gte(orders.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`),
    db.select({
      status: orders.status,
      count: count(),
    })
      .from(orders)
      .groupBy(orders.status),
    db.select({
      id: hotels.id,
      name: hotels.name,
      slug: hotels.slug,
      revenue: sum(orders.totalAmount),
      orderCount: count(orders.id),
    })
      .from(hotels)
      .leftJoin(orders, eq(hotels.id, orders.hotelId))
      .groupBy(hotels.id)
      .orderBy(desc(sum(orders.totalAmount)))
      .limit(3),
    db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      time: auditLogs.createdAt,
      hotelName: hotels.name,
      entityType: auditLogs.entityType,
    })
      .from(auditLogs)
      .leftJoin(hotels, eq(auditLogs.hotelId, hotels.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5),
  ]);

  return { hotelCount, totalRevenue, activeOrders, tableCount, newHotels, dailyRevenue, ordersByStatus, topHotels, recentLogs };
}

export default async function SystemAdminDashboard() {
  const data = await getDashboardData();
  const { hotelCount, totalRevenue, activeOrders, tableCount, newHotels, dailyRevenue, ordersByStatus, topHotels, recentLogs } = data;

  const revenueMap = new Map(dailyRevenue.map(r => [r.date, r.revenue ?? 0]));
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    chartData.push({ day, revenue: revenueMap.get(dateStr) ?? 0 });
  }

  const statusColorMap: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    preparing: "#f97316",
    served: "#3b82f6",
    completed: "#22c55e",
    cancelled: "#ef4444",
  };

  const ordersByStatusData = ordersByStatus.map(o => ({
    name: o.status.charAt(0).toUpperCase() + o.status.slice(1),
    value: Number(o.count),
    color: statusColorMap[o.status] || "#6b7280",
  }));

  const serializedLogs = recentLogs.map(log => ({
    ...log,
    time: (log.time instanceof Date ? log.time : new Date(log.time)).toISOString(),
  }));

  return (
    <AdminDashboardClient
      hotelCount={Number(hotelCount.value)}
      totalRevenue={Number(totalRevenue.value ?? 0)}
      activeOrders={Number(activeOrders.value)}
      tableCount={Number(tableCount.value)}
      newHotelsThisMonth={Number(newHotels.value)}
      chartData={chartData}
      ordersByStatusData={ordersByStatusData}
      recentLogs={serializedLogs}
      topHotels={topHotels.map(h => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        revenue: h.revenue ?? "0",
        orderCount: Number(h.orderCount),
      }))}
    />
  );
}
