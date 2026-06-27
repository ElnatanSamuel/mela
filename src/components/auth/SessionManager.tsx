"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Clock, X } from "lucide-react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const WARNING_BEFORE_MS = 5 * 60 * 1000; // warn 5 min before
const HEARTBEAT_MS = 60 * 1000; // every 1 min
const REFRESH_CHECK_MS = 5 * 60 * 1000; // check every 5 min

export default function SessionManager() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const logoutTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const countdownRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const forceLogout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    window.location.href = "/auth/login?reason=session_expired";
  }, []);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setCountdown(0);

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Warn before timeout
    const warnAt = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS;
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      const remaining = WARNING_BEFORE_MS / 1000;
      setCountdown(remaining);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            forceLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warnAt);

    // Force logout at timeout
    logoutTimerRef.current = setTimeout(forceLogout, INACTIVITY_TIMEOUT_MS);
  }, [forceLogout]);

  // Track activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 60 * 1000) {
        resetTimers();
      } else {
        lastActivityRef.current = now;
      }
    };

    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimers]);

  // Auto-refresh Supabase token periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        forceLogout();
        return;
      }
      // Check if token expires in < 10 min, refresh proactively
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      if (expiresAt - now < 10 * 60 * 1000 && expiresAt > now) {
        await supabase.auth.refreshSession();
      }
    }, REFRESH_CHECK_MS);

    return () => clearInterval(interval);
  }, [forceLogout]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-[6px] w-full max-w-sm shadow-xl p-6 text-center">
        <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-2">Session Expiring</h3>
        <p className="text-xs text-muted-foreground mb-4">
          You&apos;ve been inactive. Signing out in{" "}
          <span className="font-black text-foreground">{countdown}s</span>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { resetTimers(); }}
            className="flex-1 py-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Clock className="w-3.5 h-3.5" /> Stay Signed In
          </button>
          <button
            onClick={forceLogout}
            className="flex-1 py-3 border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:text-foreground transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
