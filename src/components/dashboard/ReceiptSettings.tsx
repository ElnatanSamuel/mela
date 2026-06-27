"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Receipt, ToggleLeft, ToggleRight, Check } from "lucide-react";

interface ReceiptSettingsResponse {
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showVat: boolean;
  showServiceCharge: boolean;
  showItemStatus: boolean;
  hotel: {
    name: string;
    logoUrl: string | null;
    location: string | null;
    phone: string | null;
  } | null;
}

interface ReceiptSettingsData {
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showVat: boolean;
  showServiceCharge: boolean;
  showItemStatus: boolean;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-3 px-4 bg-muted border border-border rounded-[4px] hover:border-muted-foreground/30 transition-all"
    >
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</span>
      {value ? <ToggleRight className="w-5 h-5 text-orange-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
}

export default function ReceiptSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ReceiptSettingsData>({
    headerText: "Thank you!",
    footerText: "Visit again!",
    showLogo: true,
    showVat: true,
    showServiceCharge: true,
    showItemStatus: false,
  });
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<ReceiptSettingsResponse>({
    queryKey: ["receipt-settings"],
    queryFn: () => fetch("/api/receipt-settings").then((r) => r.json()),
  });

  const hotel = data?.hotel;

  useEffect(() => {
    if (data) {
      setSettings({
        headerText: data.headerText,
        footerText: data.footerText,
        showLogo: data.showLogo,
        showVat: data.showVat,
        showServiceCharge: data.showServiceCharge,
        showItemStatus: data.showItemStatus,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/receipt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipt-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const previewItems = [
    { name: "Pasta Carbonara", qty: 1, price: 350 },
    { name: "Espresso", qty: 2, price: 120 },
    { name: "Caesar Salad", qty: 1, price: 280 },
  ];
  const subtotal = previewItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const vat = settings.showVat ? Math.round(subtotal * 0.15) : 0;
  const service = settings.showServiceCharge ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + vat + service;

  return (
    <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10 space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="w-4 h-4 text-orange-500" />
        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Receipt Customization</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Header Text</label>
              <input
                value={settings.headerText}
                onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                className="w-full p-3 bg-muted border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground text-foreground"
                placeholder="Thank you!"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Footer Text</label>
              <input
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full p-3 bg-muted border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground text-foreground"
                placeholder="Visit again!"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display</label>
              <div className="space-y-1.5">
                <Toggle label="Show Logo" value={settings.showLogo} onChange={(v) => setSettings({ ...settings, showLogo: v })} />
                <Toggle label="Show VAT" value={settings.showVat} onChange={(v) => setSettings({ ...settings, showVat: v })} />
                <Toggle label="Show Service Charge" value={settings.showServiceCharge} onChange={(v) => setSettings({ ...settings, showServiceCharge: v })} />
                <Toggle label="Show Item Status" value={settings.showItemStatus} onChange={(v) => setSettings({ ...settings, showItemStatus: v })} />
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save Settings"}
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview</p>
            <div className="bg-white rounded-[6px] border border-neutral-200 shadow-md overflow-hidden max-w-[320px] mx-auto">
              {/* Receipt Paper */}
              <div className="p-6 font-mono text-[11px] text-neutral-900 leading-relaxed">
                {/* Logo */}
                {settings.showLogo && hotel?.logoUrl && (
                  <div className="flex justify-center mb-3">
                    <img src={hotel.logoUrl} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-1">
                  <p className="text-sm font-black uppercase tracking-wider">{hotel?.name || "Hotel Name"}</p>
                  {hotel?.location && <p className="text-[9px] text-neutral-500 mt-0.5">{hotel.location}</p>}
                  {hotel?.phone && <p className="text-[9px] text-neutral-500">{hotel.phone}</p>}
                </div>

                <p className="text-center text-[10px] font-bold text-neutral-700 mt-3 mb-2">{settings.headerText}</p>

                {/* Divider */}
                <div className="border-t border-dashed border-neutral-300 my-3" />

                {/* Order Info */}
                <div className="flex justify-between text-[9px] text-neutral-500 mb-3">
                  <span>Table 5</span>
                  <span>#1024</span>
                </div>
                <p className="text-[9px] text-neutral-500 mb-3">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>

                {/* Divider */}
                <div className="border-t border-dashed border-neutral-300 my-3" />

                {/* Column Headers */}
                <div className="flex justify-between text-[9px] text-neutral-500 font-bold mb-2">
                  <span>ITEM</span>
                  <span>QTY</span>
                  <span>TOTAL</span>
                </div>

                {/* Items */}
                {previewItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-[10px] mb-1.5">
                    <span className="truncate flex-1 mr-2">{item.name}</span>
                    <span className="text-neutral-500 w-6 text-center">{item.qty}</span>
                    <span className="w-12 text-right">{item.price}</span>
                  </div>
                ))}

                {/* Divider */}
                <div className="border-t border-dashed border-neutral-300 my-3" />

                {/* Totals */}
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Subtotal</span>
                    <span>{subtotal}</span>
                  </div>
                  {settings.showVat && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">VAT 15%</span>
                      <span>{vat}</span>
                    </div>
                  )}
                  {settings.showServiceCharge && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Service 10%</span>
                      <span>{service}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t-2 border-neutral-900 my-3" />

                {/* Total */}
                <div className="flex justify-between text-sm font-black">
                  <span>TOTAL</span>
                  <span>{total}</span>
                </div>

                {/* Divider */}
                <div className="border-t-2 border-neutral-900 my-3" />

                {/* Footer */}
                <p className="text-center text-[9px] text-neutral-500 mt-4">{settings.footerText}</p>
                <p className="text-center text-[8px] text-neutral-400 mt-2">Powered by Mela</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
