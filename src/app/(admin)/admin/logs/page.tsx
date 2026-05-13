import React from "react";
import { db } from "@/db";
import { auditLogs, hotels } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { History, Search, Filter, Terminal, Activity } from "lucide-react";

export default async function AuditLogsPage() {
  // Fetch real audit logs
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      time: auditLogs.createdAt,
      hotelName: hotels.name,
      // userId is there but we might not have a users table join yet
    })
    .from(auditLogs)
    .leftJoin(hotels, eq(auditLogs.hotelId, hotels.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tighter uppercase">
            Audit Logs
          </h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">
            Immutable Platform-wide Event Traceability
          </p>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300" />
                <input 
                    type="text" 
                    placeholder="SEARCH EVENTS..." 
                    className="pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-[4px] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-neutral-900 transition-all w-64 placeholder:text-neutral-200"
                />
            </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-[6px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Event Type</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Tenant</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest">Action</th>
                        <th className="px-6 py-4 text-[9px] font-black text-neutral-400 uppercase tracking-widest text-right">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                    {logs.length > 0 ? (
                        logs.map((log) => (
                            <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-neutral-100 rounded-[2px] group-hover:bg-neutral-900 transition-colors">
                                            <Terminal className="w-3 h-3 text-neutral-400 group-hover:text-white" />
                                        </div>
                                        <span className="text-[9px] font-black text-neutral-900 uppercase tracking-widest">{log.entityType}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[10px] font-black text-neutral-900 uppercase tracking-tight">{log.hotelName || "SYSTEM"}</p>
                                </td>
                                <td className="px-6 py-4 text-xs text-neutral-500 font-medium">
                                    {log.action.replace('_', ' ')}
                                </td>
                                <td className="px-6 py-4 text-[9px] text-neutral-400 text-right uppercase tracking-widest font-bold">
                                    {new Date(log.time).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-24 text-center">
                                <Activity className="w-8 h-8 text-neutral-100 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No audit events recorded yet</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
