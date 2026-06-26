"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  Utensils,
  Bell,
} from "lucide-react";

interface MenuItemEntry {
  id: string;
  name: string;
}

interface OrderItemData {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  notes: string | null;
  startTime: string | null;
  completedAt: string | null;
}

interface OrderData {
  id: string;
  tableNumber: string | null;
  status: string;
  createdAt: string;
  items: OrderItemData[];
}

interface KitchenOrderBoardProps {
  hotelId: string;
  initialOrders: OrderData[];
  initialMenuItems: MenuItemEntry[];
}

function useTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
}

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function getPrepDuration(startTime: string | null): string | null {
  if (!startTime) return null;
  const diff = Date.now() - new Date(startTime).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "<1m";
  return `${mins}m`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "square";
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
  }
}

const COLUMNS = ["pending", "preparing", "ready", "served"] as const;

const COLUMN_CONFIG: Record<string, { label: string; border: string; bg: string; dot: string }> = {
  pending: {
    label: "Pending",
    border: "border-amber-700",
    bg: "bg-amber-950/30",
    dot: "bg-amber-500",
  },
  preparing: {
    label: "Preparing",
    border: "border-blue-700",
    bg: "bg-blue-950/30",
    dot: "bg-blue-500",
  },
  ready: {
    label: "Ready",
    border: "border-emerald-700",
    bg: "bg-emerald-950/30",
    dot: "bg-emerald-500",
  },
  served: {
    label: "Served",
    border: "border-neutral-700",
    bg: "bg-neutral-900/30",
    dot: "bg-neutral-500",
  },
};

const ITEM_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-amber-400" },
  preparing: { label: "Preparing", color: "text-blue-400" },
  ready: { label: "Ready", color: "text-emerald-400" },
  served: { label: "Served", color: "text-neutral-500" },
  cancelled: { label: "Cancelled", color: "text-red-400" },
};

const NEXT_STATUS: Record<string, string | null> = {
  pending: "preparing",
  preparing: "ready",
  ready: "served",
  served: null,
  cancelled: null,
};

function getOrderColumn(order: OrderData): string {
  const statuses = order.items.map((i) => i.status);
  if (statuses.some((s) => s === "pending")) return "pending";
  if (statuses.some((s) => s === "preparing")) return "preparing";
  if (statuses.some((s) => s === "ready")) return "ready";
  return "served";
}

export default function KitchenOrderBoard({
  hotelId,
  initialOrders,
  initialMenuItems,
}: KitchenOrderBoardProps) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const menuItemNamesRef = useRef<Record<string, string>>({});
  useTick();

  useEffect(() => {
    for (const item of initialMenuItems) {
      menuItemNamesRef.current[item.id] = item.name;
    }
  }, [initialMenuItems]);

  useEffect(() => {
    const ordersChannel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `hotel_id=eq.${hotelId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const record = payload.new as Record<string, string | null>;
            const orderData: OrderData = {
              id: record.id!,
              tableNumber: record.table_id?.slice(0, 4) || null,
              status: record.status || "pending",
              createdAt: record.created_at || new Date().toISOString(),
              items: [],
            };
            setOrders((prev) => [orderData, ...prev]);
            playBeep();
          } else if (payload.eventType === "UPDATE") {
            const record = payload.new as Record<string, string | null>;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === record.id
                  ? { ...o, status: record.status || o.status }
                  : o
              )
            );
          } else if (payload.eventType === "DELETE") {
            const record = payload.old as Record<string, string | null>;
            setOrders((prev) => prev.filter((o) => o.id !== record.id));
          }
        }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel("kitchen-order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          const record = payload.new as Record<string, string | null>;

          if (payload.eventType === "INSERT") {
            const name =
              menuItemNamesRef.current[record.menu_item_id || ""] || "Item";
            const newItemData: OrderItemData = {
              id: record.id!,
              orderId: record.order_id!,
              menuItemId: record.menu_item_id || "",
              menuItemName: name,
              quantity: Number(record.quantity) || 1,
              status: (record.status as OrderItemData["status"]) || "pending",
              notes: record.notes || null,
              startTime: record.start_time || null,
              completedAt: record.completed_at || null,
            };
            setOrders((prev) =>
              prev.map((o) =>
                o.id === record.order_id
                  ? { ...o, items: [...o.items, newItemData] }
                  : o
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === record.order_id
                  ? {
                      ...o,
                      items: o.items.map((i) =>
                        i.id === record.id
                          ? {
                              ...i,
                              status: (record.status as OrderItemData["status"]) || i.status,
                              startTime: record.start_time ?? i.startTime,
                              completedAt: record.completed_at ?? i.completedAt,
                              notes: record.notes ?? i.notes,
                            }
                          : i
                      ),
                    }
                  : o
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldRecord = payload.old as Record<string, string | null>;
            const deletedId = oldRecord.id || record.id;
            const deletedOrderId = oldRecord.order_id || record.order_id;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === deletedOrderId
                  ? { ...o, items: o.items.filter((i) => i.id !== deletedId) }
                  : o
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [hotelId]);

  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      status,
    }: {
      itemId: string;
      status: string;
    }) => {
      const res = await fetch(`/api/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update item status");
      }
      return res.json();
    },
  });

  const grouped = COLUMNS.map((col) => {
    const colOrders = orders.filter((o) => getOrderColumn(o) === col);
    const totalItems = colOrders.reduce(
      (sum, o) =>
        sum + o.items.filter((i) => i.status !== "cancelled").length,
      0
    );
    return { key: col, orders: colOrders, totalItems };
  });

  const activeOrdersCount = orders.filter(
    (o) => getOrderColumn(o) !== "served"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-neutral-500" />
          <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
            {activeOrdersCount} active order{activeOrdersCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Clock className="w-3.5 h-3.5" />
          <span>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {grouped.map(({ key, orders: colOrders, totalItems }) => {
          const cfg = COLUMN_CONFIG[key];
          return (
            <div key={key} className="flex flex-col gap-3">
              <div
                className={`flex items-center justify-between px-4 py-2.5 border-l-4 ${cfg.border} ${cfg.bg} rounded-r`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    {cfg.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  {totalItems}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      isUpdating={updateItemMutation.isPending}
                      updatingId={updateItemMutation.variables?.itemId}
                      onUpdate={(itemId, status) =>
                        updateItemMutation.mutate({ itemId, status })
                      }
                    />
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="border border-dashed border-neutral-800 rounded p-6 text-center">
                    <p className="text-xs text-neutral-600 uppercase tracking-wider font-bold">
                      No {cfg.label.toLowerCase()} orders
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  isUpdating,
  updatingId,
  onUpdate,
}: {
  order: OrderData;
  isUpdating: boolean;
  updatingId?: string;
  onUpdate: (itemId: string, status: string) => void;
}) {
  const elapsed = formatElapsed(order.createdAt);
  const activeItems = order.items.filter((i) => i.status !== "cancelled");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-100">
              Table {order.tableNumber || "---"}
            </p>
            <p className="text-[10px] font-mono text-neutral-500">
              #{order.id.slice(0, 6)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock className="w-3 h-3" />
          <span className="font-mono">{elapsed}</span>
        </div>
      </div>

      <div className="divide-y divide-neutral-800">
        {activeItems.map((item) => {
          const next = NEXT_STATUS[item.status];
          const loading =
            isUpdating && updatingId === item.id;
          const prepTime = getPrepDuration(item.startTime);
          const statusCfg = ITEM_STATUS_CONFIG[item.status];

          return (
            <div
              key={item.id}
              className="px-4 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-200 truncate">
                    {item.quantity}x {item.menuItemName}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    Note: {item.notes}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${statusCfg.color}`}
                  >
                    {statusCfg.label}
                  </span>
                  {prepTime && (
                    <span className="text-[10px] font-mono text-neutral-600">
                      Prep: {prepTime}
                    </span>
                  )}
                </div>
              </div>

              {next && (
                <button
                  onClick={() => onUpdate(item.id, next)}
                  disabled={loading}
                  className="shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : next === "preparing" ? (
                    "Start Prep"
                  ) : next === "ready" ? (
                    "Mark Ready"
                  ) : next === "served" ? (
                    "Mark Served"
                  ) : (
                    next
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
