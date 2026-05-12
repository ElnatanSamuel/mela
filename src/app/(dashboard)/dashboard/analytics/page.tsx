import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import RevenueAnalytics from "@/components/dashboard/RevenueAnalytics";

export default async function AnalyticsPage() {
  const roleInfo = await getUserRole();

  // Financial data is strictly for Admins/Owners
  if (roleInfo?.role === 'waiter') {
    redirect("/dashboard/orders");
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Financial Intelligence</h2>
        <p className="text-sm text-neutral-500 mt-1">Deep dive into revenue streams and payment performance.</p>
      </div>
      
      <div className="bg-[#111111]/50 border border-white/5 rounded-2xl p-8">
        <RevenueAnalytics />
      </div>
    </div>
  );
}
