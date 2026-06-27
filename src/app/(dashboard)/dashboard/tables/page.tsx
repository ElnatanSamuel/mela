import React from "react";
import TableManager from "@/components/dashboard/TableManager";
import BulkTableImport from "@/components/dashboard/BulkTableImport";
import { getUserRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function TablesPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo) redirect("/auth/login");

  let settings = {};
  if (roleInfo.hotelId) {
    const [hotel] = await db
      .select({ settings: hotels.settings })
      .from(hotels)
      .where(eq(hotels.id, roleInfo.hotelId))
      .limit(1);
    settings = (hotel?.settings as any) || {};
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          Tables
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Manage tables and generate QR codes for guests.
        </p>
      </div>
      <TableManager hotelId={roleInfo.hotelId || ""} settings={settings} />
      <div className="border-t border-border pt-12">
        <BulkTableImport />
      </div>
    </div>
  );
}
