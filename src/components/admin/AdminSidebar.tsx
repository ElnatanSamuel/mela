"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  Settings,
  LogOut,
  CreditCard,
  Activity,
  History,
  ShoppingBag,
  Bell,
  Download,
  User,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    group: "Platform",
    items: [
      { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
      { href: "/admin/hotels", label: "Hotels", icon: Building2 },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: User },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/health", label: "Health", icon: Activity },
      { href: "/admin/logs", label: "Logs", icon: History },
    ],
  },
  {
    group: "Configuration",
    items: [
      { href: "/admin/export", label: "Export", icon: Download },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  email?: string;
}

export default function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 border-r border-border flex flex-col bg-card overflow-hidden">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-lg font-black tracking-tighter uppercase text-foreground">
            Mela Admin
          </span>
        </div>

        <nav className="space-y-8 flex-1">
          {navItems.map((group) => (
            <div key={group.group}>
              <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-4">
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
                          ? "bg-neutral-900 text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
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

      <div className="border-t border-border">
        <div className="px-5 py-4 bg-muted border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-muted-foreground/20 flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              {email || "Admin"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/auth/login");
            router.refresh();
          }}
          className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold uppercase tracking-widest text-destructive hover:text-destructive-foreground hover:bg-destructive transition-all group"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
          <ChevronRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
