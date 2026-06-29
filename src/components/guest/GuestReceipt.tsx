"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: string;
  modifiers: { name: string; priceDelta: number }[];
}

interface GuestReceiptProps {
  orderId: string;
  onBack: () => void;
}

export default function GuestReceipt({ orderId, onBack }: GuestReceiptProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["guest-receipt", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/guest/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to load receipt");
      return res.json();
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 text-stone-300 mx-auto animate-spin" />
        <p className="text-xs text-stone-400 mt-4 uppercase tracking-widest font-bold">Loading receipt...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-sm text-stone-400">Could not load receipt</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold text-stone-900 uppercase tracking-widest">
          Back to Menu
        </button>
      </div>
    );
  }

  const { order, hotel, items, receiptSettings: settings } = data;
  const subtotal = items.reduce((sum: number, item: ReceiptItem) => {
    const itemTotal = parseFloat(item.unitPrice) * item.quantity;
    const modTotal = item.modifiers.reduce((s: number, m: any) => s + m.priceDelta, 0) * item.quantity;
    return sum + itemTotal + modTotal;
  }, 0);

  const vat = settings.showVat ? parseFloat(order.vatAmount || "0") : 0;
  const service = settings.showServiceCharge ? parseFloat(order.serviceCharge || "0") : 0;
  const total = parseFloat(order.totalAmount || "0");
  const discount = parseFloat(order.discountAmount || "0");
  const tip = parseFloat(order.tipAmount || "0");

  return (
    <div className="px-4 py-6">
      <div className="max-w-sm mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="text-stone-400 mb-6 text-xs font-bold uppercase tracking-widest hover:text-stone-900 transition-colors"
        >
          Back to Menu
        </button>

        {/* Receipt Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-stone-200">
          {/* Header */}
          <div className="bg-stone-900 text-white p-6 text-center">
            {settings.showLogo && hotel?.logoUrl && (
              <img src={hotel.logoUrl} alt="" className="h-12 mx-auto mb-3 object-contain" />
            )}
            <h2 className="text-lg font-black uppercase tracking-wider">
              {hotel?.name || "Hotel"}
            </h2>
            {hotel?.location && <p className="text-[10px] text-stone-400 mt-1">{hotel.location}</p>}
            {hotel?.phone && <p className="text-[10px] text-stone-400">{hotel.phone}</p>}
            <p className="text-xs font-bold text-stone-300 mt-3">{settings.headerText}</p>
          </div>

          {/* Order Info */}
          <div className="px-6 pt-4 pb-2 flex justify-between text-[10px] text-stone-400">
            <span>Order #{order.id.slice(0, 8)}</span>
            <span>{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="px-6 pb-2 text-[10px] text-stone-400">
            {new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>

          <div className="border-t border-dashed border-stone-200 mx-6" />

          {/* Items */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between text-[9px] text-stone-400 font-bold uppercase">
              <span>Item</span>
              <span className="flex gap-4">
                <span className="w-8 text-center">Qty</span>
                <span className="w-16 text-right">Total</span>
              </span>
            </div>

            {items.map((item: ReceiptItem, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-900 font-bold flex-1 mr-2 truncate">{item.name}</span>
                  <span className="text-stone-400 w-8 text-center">{item.quantity}</span>
                  <span className="text-stone-900 font-bold w-16 text-right">
                    {(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}
                  </span>
                </div>
                {item.modifiers?.map((mod: any, j: number) => (
                  <div key={j} className="flex justify-between text-[10px] text-stone-400 pl-2">
                    <span>+ {mod.name}</span>
                    <span>{mod.priceDelta > 0 ? `+${mod.priceDelta}` : ""}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-stone-200 mx-6" />

          {/* Totals */}
          <div className="px-6 py-4 space-y-2">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString()}</span>
            </div>
            {settings.showVat && vat > 0 && (
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>VAT</span>
                <span>{vat.toLocaleString()}</span>
              </div>
            )}
            {settings.showServiceCharge && service > 0 && (
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Service</span>
                <span>{service.toLocaleString()}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-[10px] text-green-600">
                <span>Discount</span>
                <span>-{discount.toLocaleString()}</span>
              </div>
            )}
            {tip > 0 && (
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Tip</span>
                <span>{tip.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t-2 border-stone-900 mx-6" />
          <div className="px-6 py-3 flex justify-between">
            <span className="text-sm font-black text-stone-900 uppercase">Total</span>
            <span className="text-sm font-black text-stone-900">{total.toLocaleString()} ETB</span>
          </div>
          <div className="border-t-2 border-stone-900 mx-6" />

          {/* Payment Status */}
          <div className="px-6 py-2 text-center">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              order.paymentStatus === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-stone-100 text-stone-500"
            }`}>
              {order.paymentStatus === "paid" ? "Paid" : order.orderType === "cash" ? "Cash" : "Pending Payment"}
            </span>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 text-center">
            <p className="text-[10px] text-stone-400 font-bold">{settings.footerText}</p>
            <p className="text-[8px] text-stone-300 mt-2">Powered by Mela</p>
          </div>
        </div>

        {/* Done button */}
        <button
          onClick={onBack}
          className="w-full mt-6 bg-stone-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform"
        >
          Done
        </button>
      </div>
    </div>
  );
}
