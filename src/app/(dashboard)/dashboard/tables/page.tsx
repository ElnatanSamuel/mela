import React from "react";
import TableManager from "@/components/dashboard/TableManager";
import BulkTableImport from "@/components/dashboard/BulkTableImport";
import FloorPlan from "@/components/dashboard/FloorPlan";
import InventoryManager from "@/components/dashboard/InventoryManager";
import ReservationManager from "@/components/dashboard/ReservationManager";
import { getUserRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function TablesPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo) redirect("/auth/login");

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tighter uppercase">
          Tables
        </h2>
        <p className="text-sm text-neutral-500 mt-1 font-medium">
          Add tables and generate QR codes.
        </p>
      </div>
      <TableManager hotelId={roleInfo.hotelId || ""} />
      <BulkTableImport />
      <div className="border-t border-neutral-200 pt-12">
        <FloorPlan />
      </div>
      <InventoryManager hotelId={roleInfo.hotelId || ""} />
      <ReservationManager hotelId={roleInfo.hotelId || ""} />
    </div>
  );
}
