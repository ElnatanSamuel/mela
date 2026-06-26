"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Search, ChevronDown, ChevronUp, Phone, User, Star, Eye } from "lucide-react";
import ActionMenu from "@/components/ui/ActionMenu";

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  visitCount: number;
  totalSpent: string;
  lastVisit: string | null;
  loyaltyPoints: number;
}

interface LoyaltyTxn {
  id: string;
  points: number;
  type: "earn" | "redeem";
  reference: string | null;
  createdAt: string;
}

interface CustomerListProps {
  hotelId: string;
}

export default function CustomerList({ hotelId }: CustomerListProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/customers?hotelId=${hotelId}`);
      return res.json();
    },
  });

  const { data: loyaltyData } = useQuery<{ loyaltyTransactions: LoyaltyTxn[] }>({
    queryKey: ["customer-loyalty", expandedId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${expandedId}`);
      return res.json();
    },
    enabled: !!expandedId,
  });

  const filtered = customers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-[4px] py-3 pl-12 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-800 rounded-[4px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <User className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
            No customers found
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer) => (
            <React.Fragment key={customer.id}>
              <button
                onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-[4px] p-4 text-left hover:border-neutral-600 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-[4px] bg-neutral-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white uppercase tracking-tight truncate">
                        {customer.name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-500" />
                        <span className="text-[9px] font-bold text-neutral-400">
                          {customer.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                        Visits
                      </p>
                      <p className="text-xs font-black text-white">
                        {customer.visitCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                        Spent
                      </p>
                      <p className="text-xs font-black text-white">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Points
                      </p>
                      <p className="text-xs font-black text-amber-400">
                        {customer.loyaltyPoints}
                      </p>
                    </div>
                    <ActionMenu
                      actions={[
                        { label: "View Details", icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setExpandedId(expandedId === customer.id ? null : customer.id) },
                      ]}
                    />
                  </div>
                </div>
              </button>

              {expandedId === customer.id && (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-[4px] p-4 space-y-3">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                    Loyalty History
                  </p>
                  {loyaltyData?.loyaltyTransactions?.length ? (
                    <div className="space-y-2">
                      {loyaltyData.loyaltyTransactions.map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between bg-neutral-800 rounded-[4px] px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest ${
                                txn.type === "earn"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {txn.type === "earn" ? "+" : "-"}{txn.points}
                            </span>
                            <span className="text-[9px] text-neutral-400 font-medium">
                              {txn.type === "earn" ? "Earned" : "Redeemed"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {txn.reference && (
                              <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">
                                {txn.reference}
                              </span>
                            )}
                            <span className="text-[8px] text-neutral-600">
                              {new Date(txn.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Star className="w-5 h-5 text-neutral-700 mx-auto mb-2" />
                      <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                        No loyalty activity
                      </p>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
