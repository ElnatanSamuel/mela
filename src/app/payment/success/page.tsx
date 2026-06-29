"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import GuestReceipt from "@/components/guest/GuestReceipt";

function PaymentContent() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const [status, setStatus] = useState<"polling" | "success" | "failed">("polling");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [hotelSlug, setHotelSlug] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
    if (pending.hotelSlug) setHotelSlug(pending.hotelSlug);
    if (pending.tableId) setTableId(pending.tableId);
    if (pending.orderId) setOrderId(pending.orderId);
  }, []);

  useEffect(() => {
    if (!txRef) {
      setErrorMsg("No transaction reference found");
      setStatus("failed");
      return;
    }

    const checkPayment = async () => {
      try {
        const verifyRes = await fetch(`/api/pay/chapa/verify?tx_ref=${txRef}`);
        const verifyData = await verifyRes.json();
        setPollCount(c => c + 1);
        console.log(`[PaymentSuccess] Poll #${pollCount + 1}:`, JSON.stringify(verifyData, null, 2));

        if (verifyData.verified && verifyData.status === "success") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
          const confirmRes = await fetch("/api/pay/chapa/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: pending.orderId, txRef }),
          });
          const confirmData = await confirmRes.json();
          console.log(`[PaymentSuccess] Confirm:`, JSON.stringify(confirmData, null, 2));
          if (confirmRes.ok) {
            setStatus("success");
            sessionStorage.removeItem("mela-pending-order");
          }
        }
      } catch (err) {
        console.error(`[PaymentSuccess] Poll error:`, err);
      }
    };

    // Poll every 5s
    checkPayment();
    intervalRef.current = setInterval(checkPayment, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [txRef]);

  const handleManualCheck = async () => {
    setErrorMsg("");
    if (!txRef) return;
    const verifyRes = await fetch(`/api/pay/chapa/verify?tx_ref=${txRef}`);
    const verifyData = await verifyRes.json();
    if (verifyData.verified && verifyData.status === "success") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
      const confirmRes = await fetch("/api/pay/chapa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pending.orderId, txRef }),
      });
      if (confirmRes.ok) {
        setStatus("success");
        sessionStorage.removeItem("mela-pending-order");
        return;
      }
    }
    setErrorMsg("Payment still not confirmed. Make sure you completed the payment on the Chapa page.");
  };

  const backUrl = hotelSlug && tableId ? `/guest/${hotelSlug}/${tableId}` : "/";

  if (status === "success") {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="pt-6 px-4 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900 mt-3">
            Payment Successful
          </h1>
          <p className="text-sm text-stone-400 mb-4">
            Your order has been placed and payment confirmed.
          </p>
        </div>
        {orderId && (
          <GuestReceipt orderId={orderId} onBack={() => window.location.href = backUrl} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto relative">
          <Loader2 className="w-8 h-8 text-stone-900 animate-spin" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
          Waiting for Payment
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Checking payment status every 5 seconds. Complete the payment on the
          Chapa page if it's still open.
        </p>
        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
          Polling... ({pollCount})
        </p>

        {errorMsg && (
          <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-lg">
            {errorMsg}
          </p>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleManualCheck}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Check Now
          </button>
          <a
            href={backUrl}
            className="block text-xs font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-colors"
          >
            Back to Menu
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Loader2 className="w-16 h-16 text-neutral-300 mx-auto animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
