import React from "react";
import { getSession, getUserRole } from "@/lib/auth-utils";
import { signOut } from "@/lib/actions";
import { ShieldAlert } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <p>
          Session expired.{" "}
          <a
            href="/auth/login"
            className="underline text-neutral-900 font-bold"
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
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center p-8 space-y-6">
        <ShieldAlert className="w-16 h-16 text-neutral-900" />
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Restricted Area
        </h1>
        <p className="text-neutral-400 text-sm text-center max-w-md">
          This area is for platform administrators only.
        </p>
        <a
          href="/dashboard"
          className="bg-neutral-900 text-white px-6 py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-neutral-200 flex items-center justify-between px-8 bg-white">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[4px]">
              Superuser
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {user.email}
            </span>
            <form action={signOut}>
              <button className="text-[10px] font-bold text-neutral-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
