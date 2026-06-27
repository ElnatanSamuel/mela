"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    if (!txRef) {
      setStatus("failed");
      return;
    }

    const confirmPayment = async () => {
      try {
        // Get pending order from sessionStorage
        const pending = JSON.parse(sessionStorage.getItem("mela-pending-order") || "{}");
        if (!pending.orderId) {
          setStatus("failed");
          return;
        }

        // Verify with Chapa
        const verifyRes = await fetch(`/api/pay/chapa/verify?tx_ref=${txRef}`);
        const verifyData = await verifyRes.json();

        if (verifyData.verified && verifyData.status === "success") {
          // Confirm payment in our system
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-neutral-300 mx-auto animate-spin" />
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Verifying Payment
            </h1>
            <p className="text-sm text-neutral-400">Please wait...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Payment Successful
            </h1>
            <p className="text-sm text-neutral-400">
              Your order has been placed and payment confirmed.
            </p>
            <Link
              href="/"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest"
            >
              Done
            </Link>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Payment Failed
            </h1>
            <p className="text-sm text-neutral-400">
              Something went wrong. Please try again.
            </p>
            <Link
              href="/"
              className="inline-block bg-neutral-900 text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest"
            >
              Go Back
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
