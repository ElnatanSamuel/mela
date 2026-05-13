"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Users,
  Settings,
  LogOut,
  CreditCard,
  Activity,
  History,
  ShieldAlert,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  {
    group: "Platform",
    items: [
      { href: "/admin", label: "Global Stats", icon: BarChart3, exact: true },
      { href: "/admin/hotels", label: "Hotels", icon: Building2 },
      { href: "/admin/users", label: "Staff", icon: Users },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/admin/billing", label: "Billing", icon: CreditCard },
      { href: "/admin/health", label: "System Health", icon: Activity },
      { href: "/admin/logs", label: "Audit Logs", icon: History },
    ],
  },
  {
    group: "Configuration",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-neutral-200 flex flex-col bg-white overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-10 group">
          <span className="text-lg font-black tracking-tighter uppercase text-neutral-900">
            Mela Admin
          </span>
        </div>

        <nav className="space-y-8">
          {navItems.map((group) => (
            <div key={group.group}>
              <h4 className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 px-4">
                {group.group}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all ${
                        isActive
                          ? "bg-neutral-900 text-white shadow-xl shadow-neutral-200"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-neutral-200 bg-neutral-50/50">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/auth/login";
          }}
          className="flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors w-full border border-transparent hover:border-red-100 rounded-[4px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
