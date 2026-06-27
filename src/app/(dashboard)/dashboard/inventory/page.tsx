import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import InventoryManager from "@/components/dashboard/InventoryManager";

export default async function InventoryPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) redirect("/auth/login");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          Inventory
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Track stock levels and manage supplies.
        </p>
      </div>
      <InventoryManager hotelId={roleInfo.hotelId} />
    </div>
  );
}
