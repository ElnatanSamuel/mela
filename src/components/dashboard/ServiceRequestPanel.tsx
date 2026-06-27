"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, FileText, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface ServiceRequest {
  id: string;
  type: "call_waiter" | "request_bill";
  status: "pending" | "acknowledged" | "resolved";
  tableId: string;
  tableNumber: string | null;
  createdAt: string;
}

export default function ServiceRequestPanel({ hotelId, role }: { hotelId: string; role?: string }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!hotelId) return;
    const channel = supabase
      .channel(`sr-${hotelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests", filter: `hotel_id=eq.${hotelId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new as ServiceRequest, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as ServiceRequest;
            if (updated.status === "resolved") {
              setRequests((prev) => prev.filter((r) => r.id !== updated.id));
            } else {
              setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/service-requests");
      if (res.ok) setRequests(await res.json());
    } catch {}
  };

  const handleAction = async (id: string, status: "acknowledged" | "resolved") => {
    setLoading(id);
    try {
      await fetch(`/api/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (status === "resolved") {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } catch {}
    setLoading(null);
  };

  if (requests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
            {role === "waiter" ? "My Table Requests" : "Service Requests"}
          </h3>
        </div>
        <div className="py-8 text-center border border-dashed border-border rounded-[4px]">
          <Bell className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">All clear</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-foreground" />
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
            {role === "waiter" ? "My Table Requests" : "Service Requests"}
          </h3>
        </div>
        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {requests.map((req) => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border border-border rounded-[4px] p-3 bg-muted"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-card border border-border rounded-[4px] flex items-center justify-center">
                    {req.type === "call_waiter" ? <Bell className="w-3.5 h-3.5 text-foreground" /> : <FileText className="w-3.5 h-3.5 text-foreground" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Table {req.tableNumber || "?"}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                      {req.type === "call_waiter" ? "Call Waiter" : "Request Bill"}
                    </p>
                  </div>
                </div>
                <span className="text-[8px] text-muted-foreground font-bold">
                  {new Date(req.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => handleAction(req.id, "acknowledged")}
                  disabled={loading === req.id}
                  className="flex-1 bg-card border border-border py-1.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> Ack
                </button>
                <button
                  onClick={() => handleAction(req.id, "resolved")}
                  disabled={loading === req.id}
                  className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {loading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Done
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
