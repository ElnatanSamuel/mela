"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Receipt, ToggleLeft, ToggleRight } from "lucide-react";

interface ReceiptSettingsData {
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showVat: boolean;
  showServiceCharge: boolean;
  showItemStatus: boolean;
}

const defaults: ReceiptSettingsData = {
  headerText: "Thank you!",
  footerText: "Visit again!",
  showLogo: true,
  showVat: true,
  showServiceCharge: true,
  showItemStatus: false,
};

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full p-4 bg-neutral-50 border border-neutral-200 rounded-[4px] hover:border-neutral-400 transition-all"
    >
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
        {label}
      </span>
      {value ? (
        <ToggleRight className="w-5 h-5 text-neutral-900" />
      ) : (
        <ToggleLeft className="w-5 h-5 text-neutral-300" />
      )}
    </button>
  );
}

export default function ReceiptSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ReceiptSettingsData>(defaults);

  const { data, isLoading } = useQuery<ReceiptSettingsData>({
    queryKey: ["receipt-settings"],
    queryFn: () => fetch("/api/receipt-settings").then((r) => r.json()),
  });

  useEffect(() => {
    if (data) setSettings(data);
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
    },
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm space-y-8">
      <div className="flex items-center gap-3">
        <Receipt className="w-4 h-4 text-neutral-900" />
        <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">
          Receipt Customization
        </h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Settings Form */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Header Text
              </label>
              <input
                value={settings.headerText}
                onChange={(e) =>
                  setSettings({ ...settings, headerText: e.target.value })
                }
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Footer Text
              </label>
              <input
                value={settings.footerText}
                onChange={(e) =>
                  setSettings({ ...settings, footerText: e.target.value })
                }
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Display Options
              </p>
              <Toggle
                label="Show Logo"
                value={settings.showLogo}
                onChange={(v) => setSettings({ ...settings, showLogo: v })}
              />
              <Toggle
                label="Show VAT"
                value={settings.showVat}
                onChange={(v) => setSettings({ ...settings, showVat: v })}
              />
              <Toggle
                label="Show Service Charge"
                value={settings.showServiceCharge}
                onChange={(v) =>
                  setSettings({ ...settings, showServiceCharge: v })
                }
              />
              <Toggle
                label="Show Item Status"
                value={settings.showItemStatus}
                onChange={(v) =>
                  setSettings({ ...settings, showItemStatus: v })
                }
              />
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-neutral-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-lg"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Receipt Settings
            </button>

            {saveMutation.isSuccess && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-[4px] text-[10px] font-black uppercase tracking-widest text-green-600 text-center">
                Receipt settings saved
              </div>
            )}

            {saveMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-[4px] text-[10px] font-black uppercase tracking-widest text-red-600 text-center">
                Failed to save settings
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Preview
            </p>
            <div className="bg-neutral-900 text-neutral-100 rounded-[8px] p-6 font-mono text-[10px] leading-relaxed space-y-1">
              <p className="text-center text-xs font-black uppercase tracking-wider text-white">
                {settings.headerText}
              </p>
              <p className="text-center text-[9px] text-neutral-400">
                {"=".repeat(28)}
              </p>
              <p className="text-neutral-400">Table: 5</p>
              <p className="text-neutral-400">Order: #1024</p>
              <p className="text-neutral-400 text-[9px]">
                {new Date().toLocaleDateString()}
              </p>
              <p className="text-center text-neutral-500 text-[9px]">
                {"-".repeat(28)}
              </p>
              <div className="flex justify-between text-neutral-300">
                <span>ITEM</span>
                <span>QTY TOTAL</span>
              </div>
              <div className="flex justify-between">
                <span>Pasta Carbonara</span>
                <span>1 350</span>
              </div>
              <div className="flex justify-between">
                <span>Espresso</span>
                <span>2 120</span>
              </div>
              <p className="text-center text-neutral-500 text-[9px]">
                {"-".repeat(28)}
              </p>
              {settings.showVat && (
                <div className="flex justify-between text-neutral-400">
                  <span>VAT (15%)</span>
                  <span>70.50</span>
                </div>
              )}
              {settings.showServiceCharge && (
                <div className="flex justify-between text-neutral-400">
                  <span>Service (10%)</span>
                  <span>47.00</span>
                </div>
              )}
              <p className="text-center text-sm font-black text-white">
                TOTAL: 540.50
              </p>
              <p className="text-center text-[9px] text-neutral-400">
                {"=".repeat(28)}
              </p>
              <p className="text-center text-[9px] text-neutral-400">
                {settings.footerText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
