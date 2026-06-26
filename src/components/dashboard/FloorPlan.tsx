"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { LayoutGrid, List, Circle, Users } from "lucide-react";

interface Table {
  id: string;
  tableNumber: string;
  status: "free" | "occupied" | "cleaning";
  capacity: number;
  sectionId: string | null;
}

interface Section {
  id: string;
  name: string;
}

export default function FloorPlan() {
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => fetch("/api/tables").then((r) => r.json()),
  });

  const { data: sections = [] } = useQuery<Section[]>({
    queryKey: ["table-sections"],
    queryFn: () => fetch("/api/table-sections").then((r) => r.json()),
  });

  useEffect(() => {
    const channel = supabase
      .channel("tables-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tables" },
        () => {
          // Invalidate tables query on update
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "free": return "bg-green-100 border-green-300 text-green-700";
      case "occupied": return "bg-red-100 border-red-300 text-red-700";
      case "cleaning": return "bg-yellow-100 border-yellow-300 text-yellow-700";
      default: return "bg-neutral-100 border-neutral-300 text-neutral-500";
    }
  };

  const groupedBySection = sections.map((section) => ({
    ...section,
    tables: tables.filter((t) => t.sectionId === section.id),
  }));

  const unassignedTables = tables.filter((t) => !t.sectionId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
          Floor Plan
        </h3>
        <div className="flex gap-1 bg-neutral-100 rounded-[6px] p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-2 rounded-[4px] transition-all",
              view === "grid" ? "bg-white shadow-sm" : "text-neutral-400",
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-2 rounded-[4px] transition-all",
              view === "list" ? "bg-white shadow-sm" : "text-neutral-400",
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-neutral-100 rounded-[6px]">
          <LayoutGrid className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No tables yet</p>
        </div>
      ) : view === "grid" ? (
        <div className="space-y-8">
          {groupedBySection.map((section) => (
            <div key={section.id}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">
                {section.name}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {section.tables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "border-2 rounded-[8px] p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md",
                      statusColor(table.status),
                    )}
                  >
                    <span className="text-lg font-black">{table.tableNumber}</span>
                    <div className="flex items-center gap-1 text-[9px] font-medium">
                      <Circle className={cn(
                        "w-2 h-2 fill-current",
                        table.status === "free" ? "text-green-500" :
                        table.status === "occupied" ? "text-red-500" : "text-yellow-500",
                      )} />
                      {table.status}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-500">
                      <Users className="w-3 h-3" />
                      {table.capacity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {unassignedTables.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">
                Unassigned
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {unassignedTables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "border-2 border-dashed rounded-[8px] p-4 flex flex-col items-center justify-center gap-2 transition-all",
                      statusColor(table.status),
                    )}
                  >
                    <span className="text-lg font-black">{table.tableNumber}</span>
                    <span className="text-[9px] font-medium capitalize">{table.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-[6px] overflow-hidden">
          {tables.map((table, idx) => (
            <div
              key={table.id}
              className={cn(
                "flex items-center justify-between px-6 py-4",
                idx !== tables.length - 1 && "border-b border-neutral-100",
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-neutral-900">
                  {table.tableNumber}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  Cap. {table.capacity}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                  statusColor(table.status),
                )}>
                  {table.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
