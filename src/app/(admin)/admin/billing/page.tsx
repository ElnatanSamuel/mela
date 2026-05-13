import React from "react";
import { db } from "@/db";
import { orders, hotels } from "@/db/schema";
import { sum, count, eq, desc } from "drizzle-orm";
import { CreditCard, TrendingUp, Calendar, ArrowUpRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function BillingPage() {
  // 1. Fetch Real Financial Metrics
  const [totalRevenue] = await db.select({ value: sum(orders.totalAmount) }).from(orders);
  const [activeSubs] = await db.select({ value: count() }).from(hotels);
  
  // Calculate a mock MRR based on a flat rate per hotel (SaaS style)
  const estimatedMRR = activeSubs.value * 2500; // Assume ETB 2500 per hotel/month

  const recentInvoices = await db
    .select({
      id: orders.id,
      hotelName: hotels.name,
      amount: orders.totalAmount,
      date: orders.createdAt,
      status: orders.paymentStatus,
    })
    .from(orders)
    .leftJoin(hotels, eq(orders.hotelId, hotels.id))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tighter uppercase">
            Revenue & Billing
          </h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">
            Subscription Management & Platform Earnings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Estimated MRR", value: formatCurrency(String(estimatedMRR)), icon: TrendingUp, change: "+12%", desc: "Based on active tenancies" },
          { label: "Platform GTV", value: formatCurrency(totalRevenue.value || "0"), icon: DollarSign, change: "+8%", desc: "Gross transaction volume" },
          { label: "Enterprise Tenants", value: activeSubs.value, icon: CreditCard, change: "+2", desc: "Total billed hotels" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-neutral-200 p-6 rounded-[6px] shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-neutral-50 rounded-[4px] border border-neutral-100">
                <stat.icon className="w-4 h-4 text-neutral-900" />
              </div>
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                {stat.change}
              </span>
            </div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">{stat.value}</p>
            <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-tighter mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Transaction History (Acting as Invoices for now) */}
      <div className="bg-white border border-neutral-200 rounded-[6px] shadow-sm">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Recent Transaction Volume
            </h3>
            <button className="text-[10px] font-black text-neutral-400 hover:text-neutral-900 uppercase tracking-widest">Export History</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Tenant</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Type</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                    {recentInvoices.length > 0 ? (
                        recentInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-black text-neutral-900 uppercase tracking-tight">{inv.hotelName}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-neutral-900 text-white text-[8px] font-black uppercase tracking-widest rounded-[2px]">Standard</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                        inv.status === 'paid' ? 'text-green-500' : 'text-orange-500'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-black text-neutral-900">{formatCurrency(inv.amount)}</td>
                                <td className="px-6 py-4 text-[9px] font-bold text-neutral-300 text-right uppercase tracking-widest">{new Date(inv.date).toLocaleDateString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-[10px] font-black text-neutral-300 uppercase tracking-widest">No transactions recorded</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
