"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Monitor, Smartphone, Trash2, Loader2, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string | null;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
}

export default function ActiveSessions() {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/auth/sessions");
      return res.json();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const getDeviceIcon = (device: string) => {
    if (device?.includes("Mobile") || device?.includes("Android")) return Smartphone;
    return Monitor;
  };

  return (
    <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-foreground" />
        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Active Sessions</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-[4px] border border-border" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border rounded-[4px]">
          <Shield className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No active sessions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.deviceInfo);
            return (
              <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-[4px] bg-muted">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-card border border-border rounded-[4px] flex items-center justify-center">
                    <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{session.deviceInfo}</p>
                    <p className="text-[8px] font-bold text-muted-foreground">
                      {session.ipAddress || "Unknown IP"} · Last active {formatDistanceToNow(new Date(session.lastActiveAt))} ago
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeMutation.mutate(session.id)}
                  disabled={revokeMutation.isPending}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Revoke session"
                >
                  {revokeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
