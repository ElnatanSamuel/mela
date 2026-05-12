import React from "react";
import TableManager from "@/components/dashboard/TableManager";
import { getUserRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function TablesPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Table Management</h2>
        <p className="text-sm text-neutral-500 mt-1">Register your tables and generate scan-to-order QR codes.</p>
      </div>
      <TableManager hotelId={roleInfo.hotelId} />
    </div>
  );
}
