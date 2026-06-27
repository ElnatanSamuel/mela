"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, Users, ShoppingBag, CreditCard, Activity, Target } from "lucide-react";

interface AnalyticsData {
  weeklyRevenue: { day: string; total: number }[];
  paymentChannels: { name: string; value: number }[];
  avgTransaction: number;
}

const COLORS = ["#171717", "#404040", "#737373", "#a3a3a3"];

export default function RevenueAnalytics() {
  const { data: stats, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((res) => res.json()),
  });

  if (isLoading) {
    return <div className="h-[400px] bg-muted animate-pulse rounded-[6px] border border-border" />;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 delay-200 pb-20">
      {/* Insights Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Avg. Sale", value: stats?.avgTransaction || 0, icon: Activity, trend: "Real", desc: "Average per guest order" },
          { label: "Payment Mix", value: stats?.paymentChannels.length || 0, icon: CreditCard, trend: "Live", desc: "Active payment methods" },
          { label: "Activity", value: stats?.weeklyRevenue.length || 0, icon: TrendingUp, trend: "7d", desc: "Days with sales" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-[4px] bg-muted border border-border">
                <stat.icon className="w-4 h-4 text-foreground" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground border border-border bg-card px-2 py-0.5 rounded-[4px]">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
            <p className="text-2xl font-black text-foreground tracking-tighter">
              {stat.label === "Avg. Sale" ? formatCurrency(stats?.avgTransaction || 0) : stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium italic mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[6px] p-8 shadow-sm dark:shadow-black/10 relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sales Flow</h3>
              <p className="text-xl font-black text-foreground tracking-tighter uppercase">Weekly Sales</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10, fontWeight: 900 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--color-muted)', radius: 4 }}
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'var(--color-foreground)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]} barSize={40}>
                  {stats?.weeklyRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.weeklyRevenue.length - 1 ? 'var(--color-foreground)' : 'var(--color-muted-foreground)'} className="opacity-100 hover:opacity-80 transition-opacity" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm dark:shadow-black/10 flex flex-col justify-between">
          <div>
            <div className="mb-10">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Payment Channels</h3>
              <p className="text-xl font-black text-foreground tracking-tighter uppercase">Sales by Method</p>
            </div>
            
            <div className="h-[200px] w-full relative mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.paymentChannels}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats?.paymentChannels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {stats?.paymentChannels.map((source, index) => (
                <div key={source.name} className="flex items-center justify-between p-3 rounded-[4px] border border-border hover:border-foreground transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{source.name}</span>
                  </div>
                  <span className="text-xs text-foreground font-black">{formatCurrency(source.value)}</span>
                </div>
              ))}
              {(!stats?.paymentChannels || stats.paymentChannels.length === 0) && (
                <div className="text-center py-6">
                  <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase">No Payment Data</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
               Payment data is derived from confirmed orders this week. Check settlements in the Orders tab.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
