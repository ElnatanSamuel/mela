import React from "react";
import { db } from "@/db";
import { hotels, orders, hotelUsers, auditLogs, tables } from "@/db/schema";
import { count, sum, desc, eq, notInArray } from "drizzle-orm";
import {
  Building2,
  ShoppingBag,
  TrendingUp,
  Users as UsersIcon,
  Activity,
  Zap,
  Globe,
  PlusCircle,
  Clock,
  MonitorPlay,
  Grid,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function SystemAdminDashboard() {
  // 1. REAL DATA QUERIES
  const [hotelCount] = await db.select({ value: count() }).from(hotels);
  const [orderCount] = await db.select({ value: count() }).from(orders);
  const [totalRevenue] = await db
    .select({ value: sum(orders.totalAmount) })
    .from(orders);

  // Fetch Active Orders
  const [activeOrders] = await db
    .select({ value: count() })
    .from(orders)
    .where(notInArray(orders.status, ["completed", "cancelled"]));

  // Fetch Total Tables across platform
  const [tableCount] = await db.select({ value: count() }).from(tables);
  const [userCount] = await db.select({ value: count() }).from(hotelUsers);

  // 2. Top Hotels by Revenue
  const topHotels = await db
    .select({
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
    .limit(3);

  // 3. Fetch Real Audit Logs
  const recentLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      time: auditLogs.createdAt,
      hotelName: hotels.name,
      entityType: auditLogs.entityType,
    })
    .from(auditLogs)
    .leftJoin(hotels, eq(auditLogs.hotelId, hotels.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);

  const stats = [
    {
      label: "Active Tenants",
      value: hotelCount.value,
      icon: Building2,
      description: "Provisioned instances",
    },
    {
      label: "Total GTV",
      value: formatCurrency(totalRevenue.value || "0"),
      icon: TrendingUp,
      description: "Gross transaction volume",
    },
    {
      label: "Live Orders",
      value: activeOrders.value,
      icon: MonitorPlay,
      description: "Sessions in progress",
      highlight: true,
    },
    {
      label: "Total Assets",
      value: tableCount.value,
      icon: Grid,
      description: "QR-enabled tables",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tighter uppercase">
            Platform Command
          </h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">
            Dashboard stats Monitoring
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white border p-6 rounded-[6px] shadow-sm transition-all group ${
              stat.highlight
                ? "border-neutral-900 ring-1 ring-neutral-900/5"
                : "border-neutral-200 hover:border-neutral-900"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-2.5 rounded-[4px] border group-hover:bg-neutral-900 group-hover:text-white transition-all ${
                  stat.highlight
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-neutral-50 border-neutral-100"
                }`}
              >
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Live
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-neutral-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-tighter">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Event Feed */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-[6px] shadow-sm flex flex-col">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-[12px] font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-400" />
              Global Activity
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-[4px] bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-900 transition-colors">
                    <Globe className="w-4 h-4 text-neutral-300 group-hover:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-neutral-900 font-black uppercase tracking-tight truncate">
                        {log.hotelName || "SYSTEM"}
                      </p>
                      <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">
                        {new Date(log.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {log.action.replace("_", " ")} on{" "}
                      <span className="font-bold text-neutral-900 uppercase text-[10px]">
                        {log.entityType}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <Activity className="w-8 h-8 text-neutral-100 mx-auto" />
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                  Waiting for activity...
                </p>
              </div>
            )}
          </div>
          <Link
            href="/admin/logs"
            className="mt-auto p-4 text-[10px] font-black text-neutral-400 hover:text-neutral-900 border-t border-neutral-100 uppercase tracking-widest transition-all hover:bg-neutral-50 text-center"
          >
            Show all
          </Link>
        </div>

        {/* Top Performers & Health */}
        <div className="space-y-6">
          {/* Top Performing Hotels (REAL DATA) */}
          <div className="bg-white border border-neutral-200 rounded-[6px] p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-neutral-900 uppercase tracking-widest mb-6 flex items-center justify-between">
              Top Performers
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            </h3>
            <div className="space-y-4">
              {topHotels.length > 0 ? (
                topHotels.map((hotel, idx) => (
                  <div
                    key={hotel.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-neutral-300">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-neutral-900 uppercase tracking-tight truncate">
                          {hotel.name}
                        </p>
                        <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">
                          {hotel.orderCount} Orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-neutral-900">
                        {formatCurrency(hotel.revenue || "0")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest py-4 text-center">
                  No performance data
                </p>
              )}
            </div>
          </div>

          {/* SaaS Health Status */}
          <div className="bg-neutral-900 rounded-[6px] p-6 shadow-xl border border-black group">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center justify-between">
              Platform Status
              <Zap className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase">
                  Latency
                </span>
                <span className="text-[9px] font-black text-white uppercase">
                  42ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase">
                  Uptime
                </span>
                <span className="text-[9px] font-black text-white uppercase">
                  99.98%
                </span>
              </div>
            </div>
            <Link
              href="/admin/health"
              className="w-full bg-white text-black py-3 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-neutral-100 transition-all block text-center"
            >
              System Health
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
