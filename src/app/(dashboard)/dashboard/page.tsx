import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import OverviewStats from "@/components/dashboard/OverviewStats";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";
import RevenueAnalytics from "@/components/dashboard/RevenueAnalytics";
import ServiceRequestPanel from "@/components/dashboard/ServiceRequestPanel";
import ShiftManager from "@/components/dashboard/ShiftManager";
import StaffClockPanel from "@/components/dashboard/StaffClockPanel";

export default async function DashboardPage() {
  const roleInfo = await getUserRole();

  if (roleInfo?.role === "waiter") {
    redirect("/dashboard/orders");
  }

  if (!roleInfo) redirect("/auth/login");

  // Initial mock for SSR, real data comes from client-side TanStack query in children
  const mockInitialOrders: [] = [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 1. Summary */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">
              Summary
            </h2>
            <p className="text-sm text-neutral-500 mt-1 font-medium">
              Today's numbers at a glance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <OverviewStats />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <ShiftManager />
            <StaffClockPanel hotelId={roleInfo.hotelId || ""} />
          </div>
        </div>
      </section>

      {/* 2. Current Orders */}
      <section className="pt-12 border-t border-neutral-200">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">
              Current Orders
            </h2>
            <p className="text-sm text-neutral-500 mt-1 font-medium italic">
              Live orders and updates.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 bg-white border border-neutral-300 rounded-[6px] p-8 shadow-sm">
            <LiveOrderBoard initialOrders={mockInitialOrders} hotelId={roleInfo.hotelId || undefined} />
          </div>
          <div className="lg:col-span-1">
            <ServiceRequestPanel hotelId={roleInfo.hotelId || ""} />
          </div>
        </div>
      </section>

      {/* 3. Insights */}
      <section className="pt-12 border-t border-neutral-200">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">
            Insights
          </h2>
          <p className="text-sm text-neutral-500 mt-1 font-medium italic">
            Revenue trends and payments.
          </p>
        </div>
        <RevenueAnalytics />
      </section>
    </div>
  );
}
