import React from "react";
import { getSession, getUserRole } from "@/lib/auth-utils";
import { signOut } from "@/lib/actions";
import { ShieldAlert } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default async function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await getSession();

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>
          Session expired.{" "}
          <a
            href="/auth/login"
            className="underline text-foreground font-bold"
          >
            Click here to log in.
          </a>
        </p>
      </div>
    );
  }

  const roleInfo = await getUserRole();

  if (!roleInfo || roleInfo.role !== "platform_admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 space-y-6">
        <ShieldAlert className="w-16 h-16 text-foreground" />
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Restricted Area
        </h1>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          This area is for platform administrators only.
        </p>
        <a
          href="/dashboard"
          className="bg-primary text-primary-foreground px-6 py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AdminSidebar email={roleInfo?.email || user.email} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[4px]">
              Admin
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {user.email}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
