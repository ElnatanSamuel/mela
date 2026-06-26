"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SessionMonitor() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[SessionMonitor] Auth Event: ${event}`);
      
      if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
        // If we are on an authenticated route, redirect to login
        const isAuthRoute = window.location.pathname.startsWith("/admin") || 
                           window.location.pathname.startsWith("/dashboard");
        
        if (isAuthRoute) {
          console.log("Session ended. Redirecting to login...");
          // We use window.location.href for a hard refresh to clear any server-side state/cookies
          window.location.href = "/auth/login?reason=session_expired";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
