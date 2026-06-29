"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: string;
  modifiers: { name: string; priceDelta: number }[];
  status?: string;
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

  const showVat = settings.showVat && vat > 0;
  const showService = settings.showServiceCharge && service > 0;

  return (
    <div className="px-4 py-6">
      <div className="max-w-sm mx-auto">
        <button
          onClick={onBack}
          className="text-stone-400 mb-6 text-xs font-bold uppercase tracking-widest hover:text-stone-900 transition-colors"
        >
          Back to Menu
        </button>

        <div className="bg-white rounded-[6px] border border-neutral-200 shadow-md overflow-hidden max-w-[320px] mx-auto">
          <div className="p-6 font-mono text-[11px] text-neutral-900 leading-relaxed">
            {/* Logo */}
            {settings.showLogo && hotel?.logoUrl && (
              <div className="flex justify-center mb-3">
                <img src={hotel.logoUrl} alt="Logo" className="h-12 object-contain" />
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-1">
              <p className="text-sm font-black uppercase tracking-wider">{hotel?.name || "Hotel"}</p>
              {hotel?.location && <p className="text-[9px] text-neutral-500 mt-0.5">{hotel.location}</p>}
              {hotel?.phone && <p className="text-[9px] text-neutral-500">{hotel.phone}</p>}
            </div>

            <p className="text-center text-[10px] font-bold text-neutral-700 mt-3 mb-2">{settings.headerText}</p>

            {/* Divider */}
            <div className="border-t border-dashed border-neutral-300 my-3" />

            {/* Order Info */}
            <div className="flex justify-between text-[9px] text-neutral-500 mb-3">
              <span>Table {order.tableId?.slice(0, 4) || "—"}</span>
              <span>#{order.id?.slice(0, 8) || ""}</span>
            </div>
            <p className="text-[9px] text-neutral-500 mb-3">
              {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              {" "}
              {new Date(order.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>

            {/* Divider */}
            <div className="border-t border-dashed border-neutral-300 my-3" />

            {/* Column Headers */}
            <div className="flex justify-between text-[9px] text-neutral-500 font-bold mb-2">
              <span>ITEM</span>
              <span className="flex gap-4">
                <span>QTY</span>
                <span className="w-12 text-right">TOTAL</span>
              </span>
            </div>

            {/* Items */}
            {items.map((item: ReceiptItem, i: number) => (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="truncate flex-1 mr-2 flex items-center gap-1">
                    {settings.showItemStatus && item.status === "completed" && (
                      <CheckCircle2 className="w-2.5 h-2.5 text-green-500 shrink-0" />
                    )}
                    {item.name}
                  </span>
                  <span className="text-neutral-500 w-6 text-center">{item.quantity}</span>
                  <span className="w-12 text-right">{(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}</span>
                </div>
                {item.modifiers?.map((mod: any, j: number) => (
                  <div key={j} className="flex justify-between text-[9px] text-neutral-400 pl-3">
                    <span>+ {mod.name}</span>
                    <span>{mod.priceDelta > 0 ? `+${mod.priceDelta}` : ""}</span>
                  </div>
                ))}
              </div>
            ))}

            {/* Divider */}
            <div className="border-t border-dashed border-neutral-300 my-3" />

            {/* Totals */}
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{subtotal.toLocaleString()}</span>
              </div>
              {showVat && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">VAT 15%</span>
                  <span>{vat.toLocaleString()}</span>
                </div>
              )}
              {showService && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Service 10%</span>
                  <span>{service.toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{discount.toLocaleString()}</span>
                </div>
              )}
              {tip > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tip</span>
                  <span>{tip.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t-2 border-neutral-900 my-3" />

            {/* Total */}
            <div className="flex justify-between text-sm font-black">
              <span>TOTAL</span>
              <span>{total.toLocaleString()} ETB</span>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-neutral-900 my-3" />

            {/* Payment Status */}
            <div className="text-center text-[9px] font-bold mb-1">
              <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-neutral-500"}>
                {order.paymentStatus === "paid" ? "PAID" : order.orderType === "cash" ? "CASH" : "PENDING"}
              </span>
            </div>

            {/* Footer */}
            <p className="text-center text-[9px] text-neutral-500 mt-4">{settings.footerText}</p>
            <p className="text-center text-[8px] text-neutral-400 mt-2">Powered by Mela</p>
          </div>
        </div>

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
