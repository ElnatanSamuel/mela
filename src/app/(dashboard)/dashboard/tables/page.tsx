import React from "react";
import TableManager from "@/components/dashboard/TableManager";
import { getUserRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function TablesPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo) redirect("/auth/login");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 tracking-tighter uppercase">
          Table Management
        </h2>
        <p className="text-sm text-neutral-500 mt-1 font-medium">
          Register your tables and generate scan-to-order QR codes.
        </p>
      </div>
      <TableManager hotelId={roleInfo.hotelId} />
    </div>
  );
}
