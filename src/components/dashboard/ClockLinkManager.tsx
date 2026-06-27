"use client";

import React, { useState } from "react";
import { Link2, Copy, Check, QrCode } from "lucide-react";

interface ClockLinkManagerProps {
  hotelSlug: string;
  hotelName: string;
}

export function ClockLinkManager({ hotelSlug, hotelName }: ClockLinkManagerProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const clockUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/clock/${hotelSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clockUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = clockUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-orange-500" />
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-100">Clock In Link</h3>
      </div>
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
        Share this link with staff for quick clock in/out. No login needed.
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-[4px] px-4 py-3">
          <p className="text-xs font-mono text-orange-400 truncate">{clockUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all ${
            copied
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
