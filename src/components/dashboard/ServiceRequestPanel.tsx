"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Bell, FileText, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceRequest {
  id: string;
  type: "call_waiter" | "request_bill";
  status: "pending" | "acknowledged" | "resolved";
  tableId: string;
  tableNumber: string | null;
  createdAt: string;
}

export default function ServiceRequestPanel({ hotelId }: { hotelId: string }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`service-requests-${hotelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new as ServiceRequest, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as ServiceRequest;
            if (updated.status === "resolved") {
              setRequests((prev) => prev.filter((r) => r.id !== updated.id));
            } else {
              setRequests((prev) =>
                prev.map((r) => (r.id === updated.id ? updated : r)),
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/service-requests");
      const data = await res.json();
      setRequests(data);
    } catch {}
  };

  const handleAction = async (id: string, status: "acknowledged" | "resolved") => {
    try {
      await fetch(`/api/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {}
  };

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center border-2 border-dashed border-neutral-100 rounded-[6px]">
        <Bell className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
        <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No Requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-neutral-900" />
        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
          Service Requests
        </h3>
        <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {requests.map((req) => (
          <motion.div
            key={req.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "border rounded-[6px] p-4 shadow-sm transition-all",
              req.type === "call_waiter"
                ? "bg-blue-50 border-blue-200"
                : "bg-blue-50 border-blue-200",
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    req.type === "call_waiter"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-blue-100 text-blue-700",
                  )}
                >
                  {req.type === "call_waiter" ? (
                    <Bell className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">
                    Table {req.tableNumber || "Unknown"}
                  </h4>
                  <span className="text-[9px] font-medium text-neutral-500 uppercase tracking-widest">
                    {req.type === "call_waiter" ? "Calling Waiter" : "Requesting Bill"}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-neutral-400 font-medium">
                {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(req.id, "acknowledged")}
                className="flex-1 bg-white border border-neutral-200 py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3 h-3" />
                Ack
              </button>
              <button
                onClick={() => handleAction(req.id, "resolved")}
                className="flex-1 bg-neutral-900 text-white py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-1.5"
              >
                <X className="w-3 h-3" />
                Resolve
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
