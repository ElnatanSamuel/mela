"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  ChefHat,
  Star
} from "lucide-react";

interface Stats {
  todayEarnings: number;
  orderCount: number;
  tablesServed: number;
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

export default function OverviewStats() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((res) => res.json()),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-neutral-50 animate-pulse rounded-[6px] border border-neutral-300 shadow-sm" />
        ))}
      </div>
    );
  }

  const statCards = [
    { label: "Today's Sales", value: formatCurrency(stats?.todayEarnings || 0), icon: TrendingUp, color: "text-neutral-900", bg: "bg-neutral-50" },
    { label: "Guests Served", value: stats?.tablesServed || 0, icon: Users, color: "text-neutral-900", bg: "bg-neutral-50" },
    { label: "Orders Taken", value: stats?.orderCount || 0, icon: ShoppingBag, color: "text-neutral-900", bg: "bg-neutral-50" },
    { label: "Peak Time", value: stats?.busiestTime || "N/A", icon: Star, color: "text-neutral-900", bg: "bg-neutral-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-300 rounded-[6px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className={cn("p-2 rounded-[4px] border border-neutral-200", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <h3 className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
              <p className="text-3xl font-black text-neutral-900 tracking-tighter truncate">
                {stat.value}
              </p>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] scale-150 rotate-12">
               <stat.icon className="w-24 h-24 text-neutral-900" />
            </div>
          </div>
        ))}
      </div>

      {/* Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Overview</h3>
              <p className="text-xl font-black text-neutral-900 tracking-tighter uppercase">Popular Items</p>
            </div>
            <ChefHat className="w-5 h-5 text-neutral-900" />
          </div>

          <div className="space-y-2">
            {stats?.bestSellers.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-[4px] hover:bg-neutral-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-neutral-300 group-hover:text-neutral-900 transition-colors">0{idx + 1}</span>
                  <div>
                    <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{item.totalQuantity} Sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-neutral-900 tracking-tighter">{formatCurrency(item.revenue)}</p>
                  <p className="text-[8px] text-neutral-400 font-black uppercase tracking-widest">Revenue</p>
                </div>
              </div>
            ))}
            {(!stats?.bestSellers || stats.bestSellers.length === 0) && (
              <div className="py-20 text-center border-2 border-dashed border-neutral-100 rounded-[6px]">
                <ChefHat className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No Sales Yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-900 rounded-[6px] p-8 shadow-xl text-white flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Quick Insights</h3>
            {stats?.todayTopPerformer ? (
              <p className="text-lg font-black tracking-tight leading-tight uppercase italic">
                "{stats.todayTopPerformer.name}" is driving {Math.round((Number(stats.todayTopPerformer.revenue) / (stats.todayEarnings || 1)) * 100)}% of today's sales.
              </p>
            ) : (
              <p className="text-lg font-black tracking-tight leading-tight uppercase italic">
                Start taking orders to see real-time insights.
              </p>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-800">
             <div className="flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Busiest Hour</p>
                 <p className="text-sm font-black uppercase">{stats?.busiestTime || "N/A"}</p>
               </div>
               <div className="text-right">
                  <p className="text-[24px] font-black tracking-tighter leading-none text-orange-500">PEAK</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
