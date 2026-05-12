"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ClipboardList, 
  BarChart3, 
  Settings,
  ShieldCheck,
  User,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  role: string;
}

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isAdmin = role === 'owner' || role === 'manager';

  const navigation = [
    { name: "Live Orders", href: "/dashboard/orders", icon: ClipboardList, show: true },
    { name: "Menu Manager", href: "/dashboard/menu", icon: UtensilsCrossed, show: true },
    { name: "Tables & QR", href: "/dashboard/tables", icon: QrCode, show: isAdmin },
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, show: isAdmin },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, show: isAdmin },
  ].filter(item => item.show);

  return (
    <aside className="w-64 border-r border-white/5 flex flex-col bg-[#0a0a0a] z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Mela</span>
        </div>

        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-600")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 bg-gradient-to-t from-white/[0.02] to-transparent">
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10">
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-blue-400" /> : <User className="w-4 h-4 text-green-400" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Role</span>
            <span className="text-xs font-bold text-white capitalize">{role}</span>
          </div>
        </div>
        
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
