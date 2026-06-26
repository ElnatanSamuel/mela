"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";

interface DashboardHeaderProps {
  hotelName: string;
  role: string;
  email?: string;
}

export default function DashboardHeader({
  hotelName,
  role,
  email,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    switch (path) {
      case "dashboard":
        return "Overview";
      case "orders":
        return "Orders";
      case "menu":
        return "Menu";
      case "tables":
        return "Tables";
      case "analytics":
        return "Analytics";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="h-20 border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter leading-none mb-1">
            {getPageTitle()}
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            {hotelName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-[6px]">
        <Mail className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-xs font-bold text-neutral-600">{email || role}</span>
      </div>
    </header>
  );
}
