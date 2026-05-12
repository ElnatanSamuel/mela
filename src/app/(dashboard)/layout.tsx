import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth + role check
  const roleInfo = await getUserRole();

  if (!roleInfo) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <DashboardSidebar role={roleInfo.role} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          hotelName={roleInfo.hotelName}
          role={roleInfo.role}
        />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
