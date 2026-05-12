import React from "react";
import MenuManager from "@/components/dashboard/MenuManager";

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Menu Manager</h2>
        <p className="text-sm text-neutral-500">Manage your items, prices, and availability.</p>
      </div>
      <MenuManager />
    </div>
  );
}
