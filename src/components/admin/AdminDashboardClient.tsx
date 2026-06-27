"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Building2,
  MonitorPlay,
  TrendingUp,
  Grid,
  Activity,
  Globe,
  PlusCircle,
  ShoppingBag,
  Zap,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface TopHotel {
  id: string;
  name: string;
  slug: string;
  revenue: string;
  orderCount: number;
}

interface LogEntry {
  id: string;
  action: string;
  time: string;
  hotelName: string | null;
  entityType: string;
}

interface ChartDataPoint {
  day: string;
  revenue: number;
}

interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface Props {
  hotelCount: number;
  totalRevenue: number;
  activeOrders: number;
  tableCount: number;
  newHotelsThisMonth: number;
  chartData: ChartDataPoint[];
  ordersByStatusData: StatusDataPoint[];
  recentLogs: LogEntry[];
  topHotels: TopHotel[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-[4px] px-4 py-3 shadow-lg text-xs">
      <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-foreground font-black text-sm">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

const BarGradient = () => (
  <defs>
    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={1} />
      <stop
        offset="100%"
        stopColor="var(--color-foreground)"
        stopOpacity={0.2}
      />
    </linearGradient>
  </defs>
);

function formatLogTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboardClient({
  hotelCount,
  totalRevenue,
  activeOrders,
  tableCount,
  newHotelsThisMonth,
  chartData,
  ordersByStatusData,
  recentLogs,
  topHotels,
}: Props) {
  const stats = [
    {
      label: "Hotels",
      value: hotelCount,
      suffix: `${newHotelsThisMonth} this month`,
      icon: Building2,
      highlight: false,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      highlight: false,
    },
    {
      label: "Active Orders",
      value: activeOrders,
      icon: MonitorPlay,
      highlight: true,
    },
    {
      label: "Tables",
      value: tableCount,
      icon: Grid,
      highlight: false,
    },
  ];

  const hasStatusData = ordersByStatusData.length > 0;
  const totalOrders = ordersByStatusData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
            Platform overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-card p-6 rounded-[6px] shadow-sm dark:shadow-black/10 transition-all group ${
              stat.highlight ? "ring-1 ring-foreground/10" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-2.5 rounded-[4px] border group-hover:bg-neutral-900 group-hover:text-white transition-all ${
                  stat.highlight
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-muted border-border"
                }`}
              >
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Live
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-foreground tracking-tight">
                {stat.value}
              </p>
              {stat.suffix && (
                <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">
                  +{stat.suffix}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/hotels"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white py-3 px-6 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add Hotel
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 bg-card border border-border text-foreground py-3 px-6 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          View Orders
        </Link>
        <Link
          href="/admin/health"
          className="inline-flex items-center gap-2 bg-card border border-border text-foreground py-3 px-6 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all"
        >
          <Zap className="w-4 h-4" />
          System Health
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">
              Revenue (Last 7 Days)
            </h3>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/60" />
          </div>
          <div className="h-64">
            {chartData.some((d) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="25%">
                  <BarGradient />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 10,
                      fontWeight: 700,
                      fill: "var(--color-muted-foreground)",
                    }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fontWeight: 700,
                      fill: "var(--color-muted-foreground)",
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "var(--color-muted)" }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-2">
                <TrendingUp className="w-8 h-8 text-muted" />
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  No revenue data yet
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
          <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-6">
            Orders by Status
          </h3>
          {hasStatusData ? (
            <div className="flex flex-col items-center">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {ordersByStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload ? (
                          <div className="bg-card border border-border rounded-[4px] px-4 py-3 shadow-lg text-xs">
                            <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mb-1">
                              {payload[0].name}
                            </p>
                            <p className="text-foreground font-black text-sm">
                              {payload[0].value}
                            </p>
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                {ordersByStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-4">
                {totalOrders} total orders
              </p>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center space-y-2">
              <Activity className="w-8 h-8 text-muted" />
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                No orders yet
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-[6px] shadow-sm dark:shadow-black/10 flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-[12px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Activity
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-[4px] bg-muted border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-900 transition-colors">
                    <Globe className="w-4 h-4 text-muted-foreground/60 group-hover:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-foreground font-black uppercase tracking-tight truncate">
                        {log.hotelName || "SYSTEM"}
                      </p>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {formatLogTime(log.time)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.action.replace("_", " ")} on{" "}
                      <span className="font-bold text-foreground uppercase text-[10px]">
                        {log.entityType}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2">
                <Activity className="w-8 h-8 text-muted mx-auto" />
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  Waiting for activity...
                </p>
              </div>
            )}
          </div>
          <Link
            href="/admin/logs"
            className="mt-auto p-4 text-[10px] font-black text-muted-foreground hover:text-foreground border-t border-border uppercase tracking-widest transition-all hover:bg-muted text-center"
          >
            Show all
          </Link>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-6 flex items-center justify-between">
              Top Hotels
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
                      <span className="text-[10px] font-black text-muted-foreground/60">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight truncate">
                          {hotel.name}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          {hotel.orderCount} Orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-foreground">
                        {formatCurrency(hotel.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center space-y-2">
                  <TrendingUp className="w-6 h-6 text-muted mx-auto" />
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    No revenue data yet
                  </p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/admin/hotels"
            className="flex items-center justify-between bg-neutral-900 rounded-[6px] p-5 shadow-lg border border-black/20 group hover:bg-neutral-800 transition-all"
          >
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              All Hotels
            </span>
            <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
