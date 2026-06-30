"use client";

import React, { useState } from "react";
import {
  Bell,
  Loader2,
  CheckCircle2,
  Phone,
  X,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ServiceRequestButtonProps {
  hotelId: string;
  tableId: string;
  hasFloatingCart?: boolean;
}

export function ServiceRequestButton({ hotelId, tableId, hasFloatingCart }: ServiceRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [helpSent, setHelpSent] = useState(false);

  const sendRequest = async (type: "call_waiter" | "request_bill" | "need_help") => {
    if (type === "call_waiter") setCalling(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, tableId, type }),
      });
      if (res.ok) {
        if (type === "call_waiter") {
          setCallSent(true);
          setTimeout(() => setCallSent(false), 30000);
        } else {
          setHelpSent(true);
          setTimeout(() => setHelpSent(false), 30000);
        }
        setIsOpen(false);
      }
    } catch {
      // silent
    } finally {
      setCalling(false);
    }
  };

  const bottomOffset = hasFloatingCart ? "bottom-28" : "bottom-6";

  return (
    <div className={`fixed ${bottomOffset} inset-x-4 z-50 flex flex-col items-center gap-3 transition-all duration-300`}>
      <AnimatePresence>
        {callSent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Waiter is on the way
          </motion.div>
        )}
        {helpSent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-green-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Staff notified
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm space-y-2"
          >
            <button
              onClick={() => sendRequest("call_waiter")}
              disabled={calling || callSent}
              className="w-full bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <div className="w-11 h-11 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-stone-900 uppercase tracking-tight">
                  {callSent ? "Waiter Coming" : "Call Waiter"}
                </p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                  {callSent ? "They're on their way" : "Summon staff to your table"}
                </p>
              </div>
              {calling && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
              {callSent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </button>

            <button
              onClick={() => sendRequest("need_help")}
              disabled={helpSent}
              className="w-full bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <div className="w-11 h-11 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black text-stone-900 uppercase tracking-tight">
                  {helpSent ? "Staff Notified" : "Need Help?"}
                </p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                  {helpSent ? "Someone will assist you" : "Questions, allergies, special requests"}
                </p>
              </div>
              {helpSent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform hover:bg-stone-800"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="bell" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bell className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
