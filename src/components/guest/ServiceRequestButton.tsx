"use client";

import React, { useState } from "react";
import {
  Bell,
  FileText,
  Loader2,
  CheckCircle2,
  Phone,
  Receipt,
  X,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceRequestButtonProps {
  hotelId: string;
  tableId: string;
}

export function ServiceRequestButton({ hotelId, tableId }: ServiceRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [billSent, setBillSent] = useState(false);
  const [helpSent, setHelpSent] = useState(false);

  const sendRequest = async (type: "call_waiter" | "request_bill" | "need_help") => {
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
      } else if (type === "request_bill") {
        setBillSent(true);
        setTimeout(() => setBillSent(false), 30000);
      } else {
        setHelpSent(true);
        setTimeout(() => setHelpSent(false), 30000);
      }
      setIsOpen(false);
    } catch {
      // silent
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="fixed bottom-6 inset-x-6 z-50 flex flex-col items-center gap-3">
      {/* Status toasts */}
      <AnimatePresence>
        {callSent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Waiter is on the way
          </motion.div>
        )}
        {billSent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Bill requested
          </motion.div>
        )}
        {helpSent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Staff notified
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm space-y-2"
          >
            {/* Call Waiter */}
            <button
              onClick={() => sendRequest("call_waiter")}
              disabled={calling || callSent}
              className="w-full bg-white border-2 border-neutral-200 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                  {callSent ? "Waiter Coming" : "Call Waiter"}
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                  {callSent ? "They're on their way" : "Summon staff to your table"}
                </p>
              </div>
              {calling && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
              {callSent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </button>

            {/* Request Bill */}
            <button
              onClick={() => sendRequest("request_bill")}
              disabled={billSent}
              className="w-full bg-white border-2 border-neutral-200 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                  {billSent ? "Bill Requested" : "Get the Bill"}
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                  {billSent ? "Coming right up" : "Request your check / receipt"}
                </p>
              </div>
              {billSent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </button>

            {/* Need Help */}
            <button
              onClick={() => sendRequest("need_help")}
              disabled={helpSent}
              className="w-full bg-white border-2 border-neutral-200 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                  {helpSent ? "Staff Notified" : "Need Help?"}
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                  {helpSent ? "Someone will assist you" : "Questions, allergies, special requests"}
                </p>
              </div>
              {helpSent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-neutral-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="bell" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bell className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
