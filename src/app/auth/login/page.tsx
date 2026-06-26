"use client";

import React, { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error("No user found");

      // 2. Fetch role from our API to decide where to go
      let res = await fetch("/api/auth/me");
      
      // Auto-fix if no role found
      if (!res.ok) {
        const fixRes = await fetch("/api/auth/fix-admin", { method: "POST" });
        if (fixRes.ok) {
          res = await fetch("/api/auth/me");
        }
      }

      if (!res.ok) {
        window.location.href = "/dashboard";
        return;
      }

      const { role } = await res.json();

      // 3. Smart Redirect
      if (role === "platform_admin") {
        window.location.href = "/admin";
      } else if (role === "waiter") {
        window.location.href = "/dashboard/orders";
      } else {
        window.location.href = "/dashboard";
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-500">
        <div className="bg-white border border-neutral-300 rounded-[6px] p-10 shadow-sm relative overflow-hidden">
          <div className="flex flex-col items-center mb-10">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tighter uppercase">
                Mela
              </h1>
              <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                Sign in to your account
              </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            {reason === "session_expired" && !error && (
              <div className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-widest p-4 rounded-[4px] flex items-center gap-3 animate-in slide-in-from-top-2 border border-black shadow-lg">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                Session expired. Sign in again.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest p-4 rounded-[4px] flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                    placeholder="name@hotel.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/auth/onboard"
              className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              Register your hotel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-200" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
