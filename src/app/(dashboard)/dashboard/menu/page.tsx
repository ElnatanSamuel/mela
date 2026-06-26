import React from "react";
import MenuManager from "@/components/dashboard/MenuManager";
import ComboManager from "@/components/dashboard/ComboManager";

export default function MenuPage() {
  return (
    <div className="space-y-12">
      <MenuManager />
      <div className="border-t border-neutral-200 pt-12">
        <ComboManager />
      </div>
    </div>
  );
}
