"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, ArrowLeft } from "lucide-react";
import GuestReceipt from "@/components/guest/GuestReceipt";

function PaymentContent() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [hotelSlug, setHotelSlug] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);

  useEffect(() => {
    if (!txRef) {
      setStatus("failed");
      return;
    }

    const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
    if (pending.hotelSlug) setHotelSlug(pending.hotelSlug);
    if (pending.tableId) setTableId(pending.tableId);
    if (!pending.orderId) {
      setStatus("failed");
      return;
    }
    setOrderId(pending.orderId);

    const confirmPayment = async () => {
      try {
        const verifyRes = await fetch(`/api/pay/chapa/verify?tx_ref=${txRef}`);
        const verifyData = await verifyRes.json();

        if (verifyData.verified && verifyData.status === "success") {
          await fetch("/api/pay/chapa/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: pending.orderId, txRef }),
          });
          setStatus("success");
        } else {
          setStatus("failed");
        }

        sessionStorage.removeItem("mela-pending-order");
      } catch {
        setStatus("failed");
      }
    };

    confirmPayment();
  }, [txRef]);

  const backUrl = hotelSlug && tableId ? `/guest/${hotelSlug}/${tableId}` : "/";

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-6">
          <Loader2 className="w-16 h-16 text-neutral-300 mx-auto animate-spin" />
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            Verifying Payment
          </h1>
          <p className="text-sm text-neutral-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            Payment Failed
          </h1>
          <p className="text-sm text-neutral-400">
            Something went wrong. Please try again.
          </p>
          <a href={backUrl} className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest">
            Back to Menu
          </a>
        </div>
      </div>
    );
  }

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
