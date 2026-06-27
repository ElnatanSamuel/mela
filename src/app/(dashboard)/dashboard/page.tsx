import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import OverviewStats from "@/components/dashboard/OverviewStats";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";
import ServiceRequestPanel from "@/components/dashboard/ServiceRequestPanel";
import QuickActions from "@/components/dashboard/QuickActions";

export default async function DashboardPage() {
  const roleInfo = await getUserRole();

  if (roleInfo?.role === "waiter") {
    redirect("/dashboard/orders");
  }

  if (!roleInfo) redirect("/auth/login");

  const hotelId = roleInfo.hotelId || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Quick Actions */}
      <QuickActions role={roleInfo.role} />

      {/* Stat Cards + Charts */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-black text-foreground tracking-tighter uppercase">Overview</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Today&apos;s numbers</p>
        </div>
        <OverviewStats />
      </section>

      {/* Service Requests + Live Orders Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-black text-foreground tracking-tighter uppercase">Live Orders</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Active right now</p>
          </div>
          <LiveOrderBoard initialOrders={[]} hotelId={hotelId || undefined} />
        </div>
        <ServiceRequestPanel hotelId={hotelId} role={roleInfo.role} />
      </section>
    </div>
  );
}
