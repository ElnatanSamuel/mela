"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Check, ToggleLeft, ToggleRight } from "lucide-react";

interface HotelSettings {
  enableTableAssignment?: boolean;
  requireWaiterAccept?: boolean;
  [key: string]: any;
}

function Toggle({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-3 px-4 bg-muted border border-border rounded-[4px] hover:border-muted-foreground/30 transition-all text-left"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      {value ? <ToggleRight className="w-5 h-5 text-orange-500 shrink-0" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground shrink-0" />}
    </button>
  );
}

export default function SettingsToggles({ hotelId, settings }: { hotelId: string; settings: HotelSettings }) {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<HotelSettings>({
    enableTableAssignment: settings.enableTableAssignment || false,
    requireWaiterAccept: settings.requireWaiterAccept || false,
  });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/hotel-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10 space-y-4">
      <div className="flex items-center gap-2">
        <ToggleLeft className="w-4 h-4 text-orange-500" />
        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Order Flow</h3>
      </div>

      <Toggle
        label="Table-Waiter Assignment"
        description="Assign waiters to specific tables. They only see orders from their tables."
        value={local.enableTableAssignment || false}
        onChange={(v) => setLocal({ ...local, enableTableAssignment: v })}
      />

      <Toggle
        label="Waiter Must Accept Orders"
        description="Orders wait for a waiter to accept before going to kitchen. Otherwise orders go straight through."
        value={local.requireWaiterAccept || false}
        onChange={(v) => setLocal({ ...local, requireWaiterAccept: v })}
      />

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full py-3 bg-primary text-primary-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Flow Settings"}
      </button>
    </div>
  );
}
