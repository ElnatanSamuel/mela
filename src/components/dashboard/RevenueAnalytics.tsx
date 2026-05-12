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
  Cell,
  PieChart,
  Pie
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, ShoppingBag, CreditCard } from "lucide-react";

const revenueData = [
  { day: "Mon", total: 4500 },
  { day: "Tue", total: 5200 },
  { day: "Wed", total: 4800 },
  { day: "Thu", total: 6100 },
  { day: "Fri", total: 8500 },
  { day: "Sat", total: 9800 },
  { day: "Sun", total: 7200 },
];

const sourceData = [
  { name: "Telebirr", value: 45000, color: "#005EB8" },
  { name: "CBE Birr", value: 32000, color: "#7D26CD" },
  { name: "Cash", value: 15000, color: "#22C55E" },
];

export default function RevenueAnalytics() {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "92,000", icon: TrendingUp, trend: "+12.5%", color: "text-green-500" },
          { label: "Daily Orders", value: "142", icon: ShoppingBag, trend: "+5.2%", color: "text-blue-500" },
          { label: "Avg. Ticket", value: "648", icon: Users, trend: "-2.1%", color: "text-orange-500" },
          { label: "Digital Pay", value: "84%", icon: CreditCard, trend: "+8.4%", color: "text-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111111] border border-white/5 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className={stat.color + " text-xs font-bold"}>{stat.trend}</span>
            </div>
            <h3 className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-white tracking-tight">
              {stat.label.includes("Revenue") || stat.label.includes("Ticket") ? "ETB " : ""}{stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Revenue</h3>
            <select className="bg-white/5 border border-white/5 rounded-lg text-xs py-1 px-3 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickFormatter={(value) => `${value/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#fff' : '#333'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Source Split */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-8">Payment Sources</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-2xl font-bold text-white">84%</span>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Digital</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {sourceData.map((source) => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }}></div>
                  <span className="text-xs text-neutral-400 font-medium">{source.name}</span>
                </div>
                <span className="text-xs text-white font-bold">{formatCurrency(source.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
