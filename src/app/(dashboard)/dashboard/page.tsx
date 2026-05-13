import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import OverviewStats from "@/components/dashboard/OverviewStats";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";
import RevenueAnalytics from "@/components/dashboard/RevenueAnalytics";

export default async function DashboardPage() {
  const roleInfo = await getUserRole();

  if (roleInfo?.role === 'waiter') {
    redirect("/dashboard/orders");
  }

  // Initial mock for SSR, real data comes from client-side TanStack query in children
  const mockInitialOrders = [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 1. High Level Overview */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase">Overview</h2>
            <p className="text-sm text-neutral-500 mt-1 font-medium italic">Today's operational performance at a glance.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-[4px] text-[9px] font-black uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Real-time Feed
          </div>
        </div>
        
        <OverviewStats />
      </section>

      {/* 2. Live Activity */}
      <section className="pt-12 border-t border-neutral-200">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase">Recent Activity</h2>
          <p className="text-sm text-neutral-500 mt-1 font-medium italic">Incoming orders and recent status changes.</p>
        </div>
        <div className="bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm">
          <LiveOrderBoard initialOrders={mockInitialOrders} />
        </div>
      </section>

      {/* 3. Deep Analytics */}
      <section className="pt-12 border-t border-neutral-200">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase">Deep Analytics</h2>
          <p className="text-sm text-neutral-500 mt-1 font-medium italic">Revenue trends, payment channels, and financial health.</p>
        </div>
        <RevenueAnalytics />
      </section>
    </div>
  );
}
