"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Search, Phone, Star, Users, TrendingUp, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  phone: string;
  visitCount: number;
  totalSpent: string;
  lastVisit: string | null;
  loyaltyPoints: number;
  lastOrder: string | null;
}

export default function LoyaltyCustomers({ hotelId }: { hotelId: string }) {
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["loyalty-customers"],
    queryFn: () => fetch("/api/loyalty/customers").then((r) => r.json()),
  });

  const filtered = search
    ? customers.filter((c) => c.phone.includes(search))
    : customers;

  const totalCustomers = customers.length;
  const totalVisits = customers.reduce((s, c) => s + c.visitCount, 0);
  const totalRevenue = customers.reduce((s, c) => s + parseFloat(c.totalSpent || "0"), 0);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-[6px] p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-[6px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[4px] bg-muted border border-border">
              <Users className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Total Customers</p>
          <p className="text-2xl font-black text-foreground tracking-tighter mt-1">{totalCustomers}</p>
        </div>
        <div className="bg-card border border-border rounded-[6px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[4px] bg-muted border border-border">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Total Visits</p>
          <p className="text-2xl font-black text-foreground tracking-tighter mt-1">{totalVisits}</p>
        </div>
        <div className="bg-card border border-border rounded-[6px] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-[4px] bg-muted border border-border">
              <Star className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Revenue from Regulars</p>
          <p className="text-2xl font-black text-foreground tracking-tighter mt-1">{formatCurrency(totalRevenue.toFixed(2))}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-[6px] py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-[6px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Phone</th>
                <th className="text-left p-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Visits</th>
                <th className="text-left p-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Spent</th>
                <th className="text-left p-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Points</th>
                <th className="text-left p-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="font-bold text-foreground">{customer.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-black text-foreground">{customer.visitCount}x</span>
                  </td>
                  <td className="p-4">
                    <span className="font-black text-foreground">{formatCurrency(customer.totalSpent)}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-black text-foreground">{customer.loyaltyPoints}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-muted-foreground">
                      {customer.lastVisit
                        ? new Date(customer.lastVisit).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric"
                          })
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {search ? "No matches" : "No customers yet"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
