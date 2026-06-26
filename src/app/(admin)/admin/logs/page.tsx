import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { auditLogs, hotels } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AuditLogList } from "@/components/admin/AuditLogList";

export default async function AuditLogsPage() {
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      oldData: auditLogs.oldData,
      newData: auditLogs.newData,
      createdAt: auditLogs.createdAt,
      hotelName: hotels.name,
      hotelSlug: hotels.slug,
    })
    .from(auditLogs)
    .leftJoin(hotels, eq(auditLogs.hotelId, hotels.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  const allHotels = await db.select().from(hotels);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live</span>
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Audit Logs
          </h2>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Track all system changes
          </p>
        </div>
      </div>

      <AuditLogList initialLogs={logs} hotels={allHotels} />
    </div>
  );
}
