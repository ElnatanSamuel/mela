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
  const roleInfo = await getUserRole();

  console.log("🛠️ [DashboardLayout] Role Detected:", roleInfo?.role);

  // 1. If not logged in or no role, kick to login
  if (!roleInfo) {
    redirect("/auth/login");
  }

  // 2. CRITICAL: If platform admin, they MUST be in /admin, never here
  if (roleInfo.role === 'platform_admin') {
    console.log("🚀 [DashboardLayout] Platform Admin detected, redirecting to /admin");
    redirect("/admin");
  }

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 overflow-hidden">
      <DashboardSidebar role={roleInfo.role} email={roleInfo.email} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          hotelName={roleInfo.hotelName || "Mela"}
          role={roleInfo.role}
          email={roleInfo.email}
        />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
