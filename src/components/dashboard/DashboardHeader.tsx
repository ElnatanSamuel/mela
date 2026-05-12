"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { signOut } from "@/lib/actions";

interface DashboardHeaderProps {
  hotelName: string;
  role: string;
}

export default function DashboardHeader({ hotelName, role }: DashboardHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes("/orders")) return "Order Management";
    if (pathname.includes("/menu")) return "Menu Items";
    if (pathname.includes("/analytics")) return "Financial Insights";
    if (pathname === "/dashboard") return "Overview";
    return "Dashboard";
  };

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-xl z-40 sticky top-0">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-white tracking-tight">
            {getPageTitle()}
          </h1>
          <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">
            {hotelName}
          </span>
        </div>

        <div className="hidden md:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 group-focus-within:text-white transition-colors" />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className="bg-white/5 border border-white/5 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-neutral-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-[#0a0a0a] animate-pulse"></span>
        </button>

        <div className="h-8 w-px bg-white/10 mx-2"></div>

        <button 
          onClick={() => signOut()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
