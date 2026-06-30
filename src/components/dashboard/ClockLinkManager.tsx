"use client";

import React, { useState } from "react";
import { Copy, Check, Shield, Clock, ChefHat, Utensils } from "lucide-react";

interface ClockLinkManagerProps {
  hotelSlug: string;
  hotelName: string;
  clockToken: string;
  kitchenToken: string;
  waiterToken?: string;
}

export function ClockLinkManager({ hotelSlug, hotelName, clockToken, kitchenToken, waiterToken }: ClockLinkManagerProps) {
  const [copiedClock, setCopiedClock] = useState(false);
  const [copiedKitchen, setCopiedKitchen] = useState(false);
  const [copiedWaiter, setCopiedWaiter] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const clockUrl = `${origin}/auth/clock/${clockToken}`;
  const kitchenUrl = `${origin}/kitchen/${kitchenToken}`;
  const waiterUrl = `${origin}/waiter/${waiterToken || kitchenToken}`;

  const handleCopy = async (url: string, which: "clock" | "kitchen" | "waiter") => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    const setter = which === "clock" ? setCopiedClock : which === "kitchen" ? setCopiedKitchen : setCopiedWaiter;
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Clock Link */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Clock In Link</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span className="uppercase tracking-widest">Secure token — cannot be guessed</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Share with staff for clock in/out. Requires clock PIN.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted border border-border rounded px-4 py-3">
            <p className="text-xs font-mono text-orange-500 truncate">{clockUrl}</p>
          </div>
          <button onClick={() => handleCopy(clockUrl, "clock")}
            className={`flex items-center gap-2 px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-all ${copiedClock ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
            {copiedClock ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedClock ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Kitchen Link */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Kitchen Display Link</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span className="uppercase tracking-widest">Secure token — cannot be guessed</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Share with kitchen staff. Requires kitchen PIN.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted border border-border rounded px-4 py-3">
            <p className="text-xs font-mono text-orange-500 truncate">{kitchenUrl}</p>
          </div>
          <button onClick={() => handleCopy(kitchenUrl, "kitchen")}
            className={`flex items-center gap-2 px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-all ${copiedKitchen ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
            {copiedKitchen ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedKitchen ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Waiter Link */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Waiter Link</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span className="uppercase tracking-widest">Secure token — cannot be guessed</span>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Share with waiters. Requires kitchen PIN + name.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted border border-border rounded px-4 py-3">
            <p className="text-xs font-mono text-orange-500 truncate">{waiterUrl}</p>
          </div>
          <button onClick={() => handleCopy(waiterUrl, "waiter")}
            className={`flex items-center gap-2 px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-all ${copiedWaiter ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
            {copiedWaiter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedWaiter ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
