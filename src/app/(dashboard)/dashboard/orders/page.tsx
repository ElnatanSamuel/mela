import React from "react";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";

export default function OrdersPage() {
  const mockInitialOrders = [
    { id: "ORD-1234", table_id: "1", tableNumber: "1", status: "pending" as const, total_amount: "450.00", created_at: new Date().toISOString() },
    { id: "ORD-1235", table_id: "2", tableNumber: "4", status: "preparing" as const, total_amount: "1200.00", created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: "ORD-1236", table_id: "3", tableNumber: "VIP-1", status: "confirmed" as const, total_amount: "2100.00", created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: "ORD-1237", table_id: "4", tableNumber: "2", status: "served" as const, total_amount: "350.00", created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Orders History</h2>
          <p className="text-sm text-neutral-500">Track and manage all active and past orders.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Filter
          </button>
          <button className="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-colors">
            Export
          </button>
        </div>
      </div>
      <LiveOrderBoard initialOrders={mockInitialOrders} />
    </div>
  );
}
