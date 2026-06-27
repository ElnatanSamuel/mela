"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  QrCode,
  Package,
  Users,
  Tag,
  AlertTriangle,
  Settings,
  LogOut,
  ChevronRight,
  User,
  ChefHat,
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
  const [badges, setBadges] = useState<Record<string, number>>({});

  const isAdmin = role === "owner" || role === "manager";

  useEffect(() => {
    fetch("/api/dashboard/badges")
      .then((r) => r.json())
      .then((d) => setBadges(d))
      .catch(() => {});
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: isAdmin },
    { name: "Orders", href: "/dashboard/orders", icon: ClipboardList, show: true, badge: "orders" },
    { name: "Kitchen", href: "/dashboard/kitchen", icon: ChefHat, show: true },
    { name: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed, show: true },
    { name: "Tables", href: "/dashboard/tables", icon: QrCode, show: isAdmin },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package, show: isAdmin },
    { name: "Staff", href: "/dashboard/staff", icon: Users, show: isAdmin },
    { name: "Promos", href: "/dashboard/promos", icon: Tag, show: isAdmin },
    { name: "Complaints", href: "/dashboard/complaints", icon: AlertTriangle, show: isAdmin, badge: "complaints" },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, show: isAdmin },
  ].filter((item) => item.show);

  return (
    <aside className="w-56 border-r border-border flex flex-col bg-card z-50">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-xl font-black tracking-tighter uppercase text-foreground">Mela</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5 rounded-[4px]">Hotel</span>
        </div>

        <nav className="space-y-1 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-bold transition-all duration-200",
                  isActive ? "bg-orange-500/10 text-orange-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-orange-500" : "text-muted-foreground")} />
                {item.name}
                {count > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="px-5 py-4 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-muted border border-border flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{email || role}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{role}</span>
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
          className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold uppercase tracking-widest text-destructive hover:text-white hover:bg-destructive transition-all group"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
          <ChevronRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
