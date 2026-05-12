import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";
import RevenueAnalytics from "@/components/dashboard/RevenueAnalytics";

export default async function DashboardPage() {
  const roleInfo = await getUserRole();

  // Role Protection: Waiters should only see the Orders board
  if (roleInfo?.role === 'waiter') {
    redirect("/dashboard/orders");
  }

  // In a real app, this would be fetched from the server using the hotelId
  const mockInitialOrders = [
    { id: "ORD-1234", table_id: "1", tableNumber: "1", status: "pending" as const, total_amount: "450.00", created_at: new Date().toISOString() },
    { id: "ORD-1235", table_id: "2", tableNumber: "4", status: "preparing" as const, total_amount: "1200.00", created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: "ORD-1236", table_id: "3", tableNumber: "VIP-1", status: "confirmed" as const, total_amount: "2100.00", created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Overview</h2>
            <p className="text-sm text-neutral-500 mt-1">Real-time status of your hotel operations.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Live System
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-[#111111]/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-6">Recent Orders</h3>
            <LiveOrderBoard initialOrders={mockInitialOrders} />
          </div>
        </div>
      </section>

      <section className="pt-12 border-t border-white/5">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Financials</h2>
          <p className="text-sm text-neutral-500 mt-1">Revenue split and digital payment adoption.</p>
        </div>
        <RevenueAnalytics />
      </section>
    </div>
  );
}
