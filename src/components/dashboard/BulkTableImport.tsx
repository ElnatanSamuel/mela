"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2, Upload, Plus, X } from "lucide-react";

interface Section {
  id: string;
  name: string;
}

export default function BulkTableImport() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [capacity, setCapacity] = useState(4);

  const { data: sections = [] } = useQuery<Section[]>({
    queryKey: ["table-sections"],
    queryFn: () => fetch("/api/table-sections").then((r) => r.json()),
  });

  const parsedNumbers = input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tables/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumbers: parsedNumbers,
          sectionId: sectionId || undefined,
          capacity,
        }),
      });
      if (!res.ok) throw new Error("Bulk import failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setInput("");
      setIsOpen(false);
    },
  });

  return (
    <div className="bg-card border border-border rounded-[6px] overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-widest text-foreground">
            Bulk Table Import
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="p-6 pt-0 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Table Numbers
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1, 2, 3, 4, 5&#10;or&#10;1&#10;2&#10;3&#10;4&#10;5"
              rows={5}
              className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground appearance-none"
              >
                <option value="">No section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Capacity (each)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                min={1}
                className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          {parsedNumbers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Preview ({parsedNumbers.length} tables)
              </p>
              <div className="flex flex-wrap gap-2">
                {parsedNumbers.map((num, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-muted border border-border rounded-[4px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => bulkMutation.mutate()}
            disabled={parsedNumbers.length === 0 || bulkMutation.isPending}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg"
          >
            {bulkMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Import {parsedNumbers.length > 0 ? `${parsedNumbers.length} Tables` : "Tables"}
          </button>

          {bulkMutation.isSuccess && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-[4px] text-[10px] font-black uppercase tracking-widest text-green-600 text-center">
              Successfully created {bulkMutation.data.count} tables
            </div>
          )}

          {bulkMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-[4px] text-[10px] font-black uppercase tracking-widest text-red-600 text-center">
              Import failed. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
