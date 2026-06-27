"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Star,
  DollarSign,
  BarChart3,
} from "lucide-react";
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
  Legend,
} from "recharts";

interface Stats {
  todayEarnings: number;
  orderCount: number;
  tablesServed: number;
  weeklyRevenue: { day: string; total: number }[];
  paymentChannels: { name: string; value: number }[];
  avgTransaction: number;
  bestSellers: {
    id: string;
    name: string;
    totalQuantity: number;
    revenue: number;
  }[];
  todayTopPerformer: {
    name: string;
    revenue: number;
  } | null;
  busiestTime: string;
}

const PIE_COLORS = ["var(--color-chart-primary)", "var(--color-chart-secondary)", "var(--color-chart-tertiary)", "var(--color-chart-quaternary)"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-[6px] shadow-lg px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-black text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-[6px] shadow-lg px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
      <p className="text-sm font-black text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function OverviewStats() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((res) => res.json()),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-[6px] border border-border shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-muted animate-pulse rounded-[6px] border border-border shadow-sm" />
          <div className="h-72 bg-muted animate-pulse rounded-[6px] border border-border shadow-sm" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Sales", value: formatCurrency(stats?.todayEarnings || 0), icon: TrendingUp },
    { label: "Guests Served", value: stats?.tablesServed || 0, icon: Users },
    { label: "Orders Taken", value: stats?.orderCount || 0, icon: ShoppingBag },
    { label: "Avg Ticket", value: formatCurrency(stats?.avgTransaction || 0), icon: DollarSign },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-[6px] p-5 shadow-sm dark:shadow-black/10 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 rounded-[4px] border border-border bg-muted">
                <stat.icon className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-[4px] border border-border">
                Today
              </span>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-foreground tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Revenue</p>
              <p className="text-lg font-black text-foreground tracking-tighter uppercase">This Week</p>
            </div>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyRevenue || []} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fontWeight: 900, fill: "var(--color-muted-foreground)", letterSpacing: "0.1em" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 900, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
                <Bar
                  dataKey="total"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Payments</p>
              <p className="text-lg font-black text-foreground tracking-tighter uppercase">Channels</p>
            </div>
          </div>
          <div className="h-52">
            {stats?.paymentChannels && stats.paymentChannels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paymentChannels}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {stats.paymentChannels.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{value}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-[6px]">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Items + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Sellers */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Top Items</p>
              <p className="text-lg font-black text-foreground tracking-tighter uppercase">Best Sellers</p>
            </div>
          </div>
          <div className="space-y-2">
            {stats?.bestSellers.map((item, idx) => {
              const maxQty = stats.bestSellers[0]?.totalQuantity || 1;
              const pct = Math.round((item.totalQuantity / maxQty) * 100);
              return (
                <div key={item.id} className="flex items-center gap-4 p-3 border border-border rounded-[4px] hover:bg-muted transition-colors">
                  <span className="text-[10px] font-black text-muted-foreground w-6">0{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-foreground uppercase tracking-tight truncate">{item.name}</p>
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-foreground">{formatCurrency(item.revenue)}</p>
                    <p className="text-[9px] font-bold text-muted-foreground">{item.totalQuantity} sold</p>
                  </div>
                </div>
              );
            })}
            {(!stats?.bestSellers || stats.bestSellers.length === 0) && (
              <div className="py-16 text-center border-2 border-dashed border-border rounded-[6px]">
                <ShoppingBag className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Sales Yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-muted border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-4 h-4 text-orange-500" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Insights</p>
          </div>
          <div className="flex-1 space-y-6">
            {stats?.todayTopPerformer ? (
              <div className="p-4 bg-card border border-border rounded-[4px]">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Top Seller</p>
                <p className="text-sm font-black text-foreground tracking-tight">{stats.todayTopPerformer.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {Math.round((Number(stats.todayTopPerformer.revenue) / (stats.todayEarnings || 1)) * 100)}% of today&apos;s revenue
                </p>
              </div>
            ) : (
              <div className="p-4 bg-card border border-border rounded-[4px]">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Top Seller</p>
                <p className="text-xs text-muted-foreground">Take orders to see insights.</p>
              </div>
            )}
            <div className="p-4 bg-card border border-border rounded-[4px]">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Busiest Hour</p>
              <p className="text-lg font-black text-foreground">{stats?.busiestTime || "N/A"}</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-[4px]">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Avg Transaction</p>
              <p className="text-lg font-black text-foreground">{formatCurrency(stats?.avgTransaction || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
