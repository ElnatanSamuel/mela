"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  User,
  QrCode,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface DashboardSidebarProps {
  role: string;
  email?: string;
}

export default function DashboardSidebar({ role, email }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = role === "owner" || role === "manager";

  const navigation = [
    {
      name: "Summary",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: isAdmin,
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: ClipboardList,
      show: true,
    },
    {
      name: "Menu",
      href: "/dashboard/menu",
      icon: UtensilsCrossed,
      show: true,
    },
    {
      name: "Tables",
      href: "/dashboard/tables",
      icon: QrCode,
      show: isAdmin,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      show: isAdmin,
    },
  ].filter((item) => item.show);

  return (
    <aside className="w-64 border-r border-neutral-200 flex flex-col bg-white z-50">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-xl font-black tracking-tighter uppercase text-neutral-900">
            Mela
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50",
                )}
              >
                <item.icon
                  className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-400")}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-neutral-200">
        <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-neutral-200 flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 truncate">
                {email || role}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-300">
                {role}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/auth/login");
            router.refresh();
          }}
          className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-500 transition-all group"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
          <ChevronRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
