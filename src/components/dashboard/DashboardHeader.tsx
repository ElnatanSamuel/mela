"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DashboardHeaderProps {
  hotelName: string;
  role: string;
}

export default function DashboardHeader({
  hotelName,
  role,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    switch (path) {
      case "dashboard":
        return "Overview";
      case "orders":
        return "Live Orders";
      case "menu":
        return "Menu"; // Renamed from Menu Manager
      case "tables":
        return "Tables & QR";
      case "analytics":
        return "Performance";
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

      <div className="flex items-center gap-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-600 hover:text-white hover:bg-red-600 transition-all border border-red-100 hover:border-red-600 rounded-[6px] group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
