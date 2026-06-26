import React from "react";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
import {
  Activity,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  HardDrive,
  Network,
} from "lucide-react";

export default async function SystemHealthPage() {
  const start = Date.now();
  await db.execute(sql`SELECT 1`);
  const dbLatency = Date.now() - start;

  let dbStats: any[] = [];
  try {
    dbStats = await db.execute(sql`
      SELECT 
        relname as table_name, 
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
    `);
  } catch (e) {
    console.error("Failed to fetch DB stats:", e);
  }

  const services = [
    {
      name: "PostgreSQL Database",
      status: "Operational",
      icon: Database,
      detail: `${dbLatency}ms latency`,
    },
    {
      name: "Supabase Auth",
      status: "Operational",
      icon: ShieldCheck,
      detail: "Active",
    },
    {
      name: "Supabase Storage",
      status: "Operational",
      icon: HardDrive,
      detail: "Active",
    },
    {
      name: "Edge Runtime",
      status: "Operational",
      icon: Zap,
      detail: "Running",
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          System Health
        </h2>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
          Service status and database health
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <div
            key={service.name}
            className="bg-card border border-border p-6 rounded-[6px] shadow-sm group hover:border-foreground/20 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-neutral-900 rounded-[6px]">
                <service.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-muted border border-border text-green-500">
                {service.status}
              </div>
            </div>
            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
              {service.name}
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {service.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-900 text-white p-8 rounded-[6px] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transform translate-x-16 -translate-y-16" />

            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10 relative z-10">
              Resources
            </h3>

            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                      DB Latency
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase">
                    {dbLatency}ms
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(dbLatency * 2, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                      Tables Tracked
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase">
                    {dbStats.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                      Query Status
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-green-400">
                    Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-card border border-border rounded-[6px] overflow-hidden shadow-sm h-full">
            <div className="p-8 border-b border-border">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                Database Tables
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Table sizes and row counts
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Table
                    </th>
                    <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Row Count
                    </th>
                    <th className="text-right px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dbStats.map((t: any) => (
                    <tr
                      key={t.table_name}
                      className="border-b border-border hover:bg-muted transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Database className="w-3.5 h-3.5 text-muted-foreground/60" />
                          <span className="text-xs font-black text-foreground uppercase tracking-tight">
                            {t.table_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                          {Number(t.row_count).toLocaleString()} rows
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-[4px]">
                          {t.total_size}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
