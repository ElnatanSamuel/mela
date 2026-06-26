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
    return <div className="h-[400px] bg-neutral-50 animate-pulse rounded-[6px] border border-neutral-300" />;
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
          <div key={stat.label} className="bg-white border border-neutral-300 rounded-[6px] p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-[4px] bg-neutral-50 border border-neutral-100">
                <stat.icon className="w-4 h-4 text-neutral-900" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 border border-neutral-900 bg-white px-2 py-0.5 rounded-[4px]">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-neutral-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
            <p className="text-2xl font-black text-neutral-900 tracking-tighter">
              {stat.label === "Avg. Sale" ? formatCurrency(stats?.avgTransaction || 0) : stat.value}
            </p>
            <p className="text-[10px] text-neutral-400 font-medium italic mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Sales Flow</h3>
              <p className="text-xl font-black text-neutral-900 tracking-tighter uppercase">Weekly Sales</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#171717', fontSize: 10, fontWeight: 900 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#171717', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8', radius: 4 }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#171717', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]} barSize={40}>
                  {stats?.weeklyRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.weeklyRevenue.length - 1 ? '#171717' : '#d4d4d4'} className="hover:fill-neutral-900 transition-colors" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-10">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Payment Channels</h3>
              <p className="text-xl font-black text-neutral-900 tracking-tighter uppercase">Sales by Method</p>
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
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {stats?.paymentChannels.map((source, index) => (
                <div key={source.name} className="flex items-center justify-between p-3 rounded-[4px] border border-neutral-100 hover:border-neutral-900 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[10px] text-neutral-600 font-black uppercase tracking-tight">{source.name}</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-black">{formatCurrency(source.value)}</span>
                </div>
              ))}
              {(!stats?.paymentChannels || stats.paymentChannels.length === 0) && (
                <div className="text-center py-6">
                  <CreditCard className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-[10px] font-black text-neutral-300 uppercase">No Payment Data</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-100">
             <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed">
               Payment data is derived from confirmed orders this week. Check settlements in the Orders tab.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
