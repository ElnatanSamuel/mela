"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  UtensilsCrossed,
  Users,
  Package,
  Tag,
  AlertTriangle,
  QrCode,
  BarChart3,
} from "lucide-react";

interface QuickActionsProps {
  role: string;
}

const actions = [
  { label: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { label: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
  { label: "Tables", href: "/dashboard/tables", icon: QrCode },
  { label: "Inventory", href: "/dashboard/inventory", icon: Package },
  { label: "Staff", href: "/dashboard/staff", icon: Users },
  { label: "Promos", href: "/dashboard/promos", icon: Tag },
  { label: "Complaints", href: "/dashboard/complaints", icon: AlertTriangle },
  { label: "Reports", href: "/dashboard/revenue", icon: BarChart3 },
];

const adminOnly = ["Tables", "Inventory", "Staff", "Promos", "Complaints", "Reports"];

export default function QuickActions({ role }: QuickActionsProps) {
  const isAdmin = role === "owner" || role === "manager";
  const visible = actions.filter((a) => isAdmin || !adminOnly.includes(a.label));

  return (
    <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
      <div className="mb-4">
        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Quick Access</h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {visible.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 p-3 rounded-[6px] border border-border hover:bg-muted transition-all group"
          >
            <action.icon className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-foreground uppercase tracking-widest">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
