"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SessionMonitor() {
  const router = useRouter();
  const registeredRef = useRef(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    const isGuestPage = pathname.startsWith("/guest/") || pathname.startsWith("/auth/clock") || pathname.startsWith("/kitchen") || pathname.startsWith("/payment/");
    if (isGuestPage) return;

    // Register session in DB on first load
    if (!registeredRef.current) {
      registeredRef.current = true;
      fetch("/api/auth/sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).catch(() => {});
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
        const isAuthRoute = window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/dashboard");
        if (isAuthRoute) {
          window.location.href = "/auth/login?reason=session_expired";
        }
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [router]);

  return null;
}
