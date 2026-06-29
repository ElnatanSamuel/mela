"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import GuestReceipt from "@/components/guest/GuestReceipt";

function PaymentContent() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const orderIdParam = searchParams.get("order_id");
  const [errorMsg, setErrorMsg] = useState("");
  const [hotelSlug, setHotelSlug] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(orderIdParam);
  const [status, setStatus] = useState<"polling" | "success">("polling");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
    if (pending.hotelSlug) setHotelSlug(pending.hotelSlug);
    if (pending.tableId) setTableId(pending.tableId);
    if (!orderIdParam && pending.orderId) setOrderId(pending.orderId);
  }, [orderIdParam]);

  useEffect(() => {
    if (!txRef) {
      setErrorMsg("No transaction reference found");
      return;
    }

    const checkPayment = async () => {
      try {
        const verifyRes = await fetch(`/api/pay/chapa/verify?tx_ref=${txRef}`);
        const verifyData = await verifyRes.json();
        console.log(`[PaymentSuccess] Poll:`, JSON.stringify(verifyData, null, 2));

        if (verifyData.verified && verifyData.status === "success") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
          const confirmRes = await fetch("/api/pay/chapa/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: orderId || pending.orderId, txRef }),
          });
          const confirmData = await confirmRes.json();
          console.log(`[PaymentSuccess] Confirm:`, JSON.stringify(confirmData, null, 2));
          if (confirmRes.ok) {
            sessionStorage.removeItem("mela-pending-order");
            const slug = pending.hotelSlug || hotelSlug;
            const table = pending.tableId || tableId;
            const oid = orderId || pending.orderId;
            if (!oid && !slug) return;
            setOrderId(oid);
            if (slug) setHotelSlug(slug);
            if (table) setTableId(table);
            setStatus("success");
          }
        }
      } catch (err) {
        console.error(`[PaymentSuccess] Poll error:`, err);
      }
    };

    checkPayment();
    intervalRef.current = setInterval(checkPayment, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [txRef]);

  if (status === "success" && orderId) {
    const backUrl = hotelSlug && tableId ? `/guest/${hotelSlug}/${tableId}?orderId=${orderId}` : "/";
    return <GuestReceipt orderId={orderId} onBack={() => window.location.href = backUrl} />;
  }

  const backUrl = hotelSlug && tableId ? `/guest/${hotelSlug}/${tableId}` : "/";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-stone-900 animate-spin" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
          Verifying Payment
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          Please complete the payment in the Chapa window if it's still open.
          We'll confirm your order once the payment goes through.
        </p>

        {errorMsg && (
          <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-lg">
            {errorMsg}
          </p>
        )}

        <div className="space-y-3 pt-2">
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
