"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Box, 
  ArrowRight, 
  Database, 
  Building2,
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react";
import ActionMenu from "@/components/ui/ActionMenu";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export function AuditLogList({ initialLogs, hotels }: { initialLogs: any[], hotels: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [filterHotel, setFilterHotel] = useState("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // 1. Real-time Subscription
  useEffect(() => {
    const channel = supabase
      .channel('audit_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        async (payload) => {
          // Fetch the hotel name for the new log
          const hotel = hotels.find(h => h.id === payload.new.hotel_id);
          const newLog = {
            ...payload.new,
            hotelName: hotel?.name || "Unknown",
            hotelSlug: hotel?.slug || "unknown",
            createdAt: new Date(payload.new.created_at).toISOString(),
          };
          
          setLogs((prev) => [newLog, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotels]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || 
                           log.entityType.toLowerCase().includes(search.toLowerCase());
      const matchesHotel = filterHotel === "all" || log.hotelId === filterHotel;
      return matchesSearch && matchesHotel;
    });
  }, [logs, search, filterHotel]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-card rounded-[6px] p-5 shadow-sm dark:shadow-black/10 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input 
            type="text" 
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted dark:bg-muted border border-border rounded-[4px] py-3 pl-11 pr-4 text-xs font-bold text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="bg-card border border-border rounded-[4px] py-3 px-4 text-xs font-bold text-foreground focus:outline-none focus:border-foreground cursor-pointer"
          >
            <option value="all">All</option>
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-[6px] shadow-sm dark:shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hotel</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr 
                    className="border-b border-border hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground uppercase">{log.hotelName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">/{log.hotelSlug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-muted border border-border rounded text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {log.action}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                          {log.entityType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        {expandedLog === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Diff View */}
                  {expandedLog === log.id && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 bg-muted border-y border-border">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Before</p>
                            <pre className="p-3 bg-card border border-border rounded text-[10px] font-mono text-muted-foreground overflow-x-auto">
                              {JSON.stringify(log.oldData, null, 2) || "NULL"}
                            </pre>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">After</p>
                            <pre className="p-3 bg-card border border-green-300 rounded text-[10px] font-mono text-foreground overflow-x-auto">
                              {JSON.stringify(log.newData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="p-16 text-center">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No logs found</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
