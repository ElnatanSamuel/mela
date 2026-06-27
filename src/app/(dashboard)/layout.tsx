import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const roleInfo = await getUserRole();

  if (!roleInfo) {
    redirect("/auth/login");
  }

  if (roleInfo.role === 'platform_admin') {
    redirect("/admin");
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <DashboardSidebar role={roleInfo.role} email={roleInfo.email} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-black uppercase tracking-widest rounded-[4px]">
              {roleInfo.role === "owner" ? "Owner" : "Manager"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {roleInfo.email}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
