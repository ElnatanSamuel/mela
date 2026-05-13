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
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, Users, ShoppingBag, CreditCard, Activity, Target } from "lucide-react";

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
  { name: "Telebirr", value: 45000, color: "#171717" },
  { name: "CBE Birr", value: 32000, color: "#404040" },
  { name: "Cash", value: 15000, color: "#737373" },
];

export default function RevenueAnalytics() {
  return (
    <div className="space-y-10 animate-in fade-in duration-700 delay-200 pb-20">
      {/* Analytics Insights Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Avg. Transaction", value: "648", icon: Activity, trend: "+12.5%", desc: "Value per guest order" },
          { label: "Guest Turnover", value: "42m", icon: Target, trend: "-5.2%", desc: "Avg. time per table" },
          { label: "Digital Ratio", value: "84%", icon: CreditCard, trend: "+8.4%", desc: "Non-cash payments" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-300 rounded-[6px] p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-[4px] bg-neutral-50 border border-neutral-100">
                <stat.icon className="w-4 h-4 text-neutral-900" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-600 border border-green-100 bg-green-50 px-2 py-0.5 rounded-[4px]">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-neutral-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
            <p className="text-2xl font-black text-neutral-900 tracking-tighter">
              {stat.label.includes("Transaction") ? "ETB " : ""}{stat.value}
            </p>
            <p className="text-[10px] text-neutral-400 font-medium italic mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Revenue Flow</h3>
              <p className="text-xl font-black text-neutral-900 tracking-tighter uppercase">Weekly Performance</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-[4px] text-[9px] font-black uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-neutral-900" />
                Current Week
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
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
                  tickFormatter={(value) => `${value/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8', radius: 4 }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#171717', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]} barSize={40}>
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#171717' : '#d4d4d4'} className="hover:fill-neutral-900 transition-colors" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Source Split */}
        <div className="bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-10">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Settlement</h3>
              <p className="text-xl font-black text-neutral-900 tracking-tighter uppercase">Channels</p>
            </div>
            
            <div className="h-[200px] w-full relative mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '6px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-2xl font-black text-neutral-900 tracking-tighter">84%</span>
                <span className="text-[8px] text-neutral-400 uppercase font-black tracking-widest">Digital</span>
              </div>
            </div>

            <div className="space-y-3">
              {sourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between p-3 rounded-[4px] border border-neutral-100 hover:border-neutral-900 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: source.color }}></div>
                    <span className="text-[10px] text-neutral-600 font-black uppercase tracking-tight">{source.name}</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-black">{formatCurrency(source.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-100">
             <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed">
               Digital payment adoption has increased by <span className="text-neutral-900">14%</span> since last month. Recommend incentivizing Telebirr for faster checkout.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
