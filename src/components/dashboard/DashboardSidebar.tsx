"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  ShieldCheck,
  User,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  role: string;
}

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isAdmin = role === "owner" || role === "manager";

  const navigation = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: isAdmin,
    },
    {
      name: "Live Orders",
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
      name: "Tables & QR",
      href: "/dashboard/tables",
      icon: QrCode,
      show: isAdmin,
    },
  ].filter((item) => item.show);

  return (
    <aside className="w-64 border-r border-neutral-200 flex flex-col bg-white z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-xl font-black tracking-tighter uppercase text-neutral-900">
            Mela
          </span>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-neutral-900 border border-neutral-300 text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50",
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-white" : "text-neutral-400",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-3 px-3 py-2 bg-white border border-neutral-200 rounded-[6px] shadow-sm">
          <div className="w-8 h-8 rounded-[4px] bg-neutral-100 flex items-center justify-center border border-neutral-200">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-neutral-900" />
            ) : (
              <User className="w-4 h-4 text-neutral-900" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 leading-tight">
              Identity
            </span>
            <span className="text-xs font-bold text-neutral-900 capitalize">
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
