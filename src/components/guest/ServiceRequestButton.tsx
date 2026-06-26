"use client";

import React, { useState } from "react";
import { Bell, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface ServiceRequestButtonProps {
  hotelId: string;
  tableId: string;
}

export function ServiceRequestButton({ hotelId, tableId }: ServiceRequestButtonProps) {
  const [calling, setCalling] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [billSent, setBillSent] = useState(false);

  const sendRequest = async (type: "call_waiter" | "request_bill") => {
    if (type === "call_waiter") setCalling(true);
    try {
      await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, tableId, type }),
      });
      if (type === "call_waiter") {
        setCallSent(true);
        setTimeout(() => setCallSent(false), 30000);
      } else {
        setBillSent(true);
        setTimeout(() => setBillSent(false), 30000);
      }
    } catch {
      // silent
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
      {billSent ? (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-[6px] text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Bill Requested
        </div>
      ) : (
        <button
          onClick={() => sendRequest("request_bill")}
          className="bg-white border-2 border-neutral-900 text-neutral-900 w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:bg-neutral-50"
          title="Request Bill"
        >
          <FileText className="w-6 h-6" />
        </button>
      )}

      {callSent ? (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-[6px] text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Waiter Coming
        </div>
      ) : (
        <button
          onClick={() => sendRequest("call_waiter")}
          disabled={calling}
          className="bg-neutral-900 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
          title="Call Waiter"
        >
          {calling ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bell className="w-6 h-6" />}
        </button>
      )}
    </div>
  );
}
