"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronUp,
  X,
  Utensils,
  ChefHat,
  Send,
} from "lucide-react";

interface GuestMenuProps {
  hotelId: string;
  tableId: string;
}

interface MenuItem {
  id: string;
  name: string;
  nameAm: string | null;
  price: string;
  imageUrl?: string;
  isSpicy: boolean;
  isVegetarian: boolean;
  isDailySpecial: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
}

export default function GuestMenu({ hotelId, tableId }: GuestMenuProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 1. Fetch Categories & Menu
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["guest-categories", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/categories?hotelId=${hotelId}`);
      return res.json();
    },
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["guest-menu", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/menu?hotelId=${hotelId}`);
      return res.json();
    },
  });

  // 2. Order Realtime Tracking
  useEffect(() => {
    if (!activeOrderId) return;

    const channel = supabase
      .channel(`order-${activeOrderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${activeOrderId}`,
        },
        (payload) => {
          setOrderStatus(payload.new.status);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrderId]);

  // 3. Mutations
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, tableId, cartItems: cart }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      return res.json();
    },
    onSuccess: (data) => {
      setActiveOrderId(data.id);
      setOrderStatus(data.status);
      setCart({});
      setIsCheckoutOpen(false);
    },
  });

  const updateCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return total + parseFloat(item?.price || "0") * qty;
  }, 0);

  // Filter items
  const filteredItems = (menuItems || []).filter(
    (item) =>
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameAm && item.nameAm.includes(search))) &&
      (activeCategory === "all" || item.categoryId === activeCategory),
  );

  // Group by category
  const groupedItems = (categories || [])
    .map((cat) => ({
      ...cat,
      items: filteredItems.filter((item) => item.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0 || activeCategory === group.id);

  if (activeOrderId) {
    const steps = [
      {
        id: "pending",
        label: "Order Received",
        sub: "We've got your order",
      },
      {
        id: "preparing",
        label: "In Kitchen",
        sub: "Chef is working magic",
      },
      {
        id: "served",
        label: "Served",
        sub: "Enjoy your meal!",
      },
    ];

    const getCurrentStepIdx = () => {
      if (orderStatus === "pending") return 0;
      if (orderStatus === "preparing") return 1;
      if (orderStatus === "served") return 2;
      return 0;
    };

    const currentStepIdx = getCurrentStepIdx();

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-4">
          Order: {orderStatus}
        </h2>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 max-w-[200px] font-black mb-16">
          Your items are being prepared.
        </p>

        {/* Vertical Timeline Container */}
        <div className="relative w-full max-w-[240px]">
          {steps.map((step, idx) => {
            const isCompleted =
              idx < currentStepIdx || orderStatus === "served";
            const isActive = idx === currentStepIdx;
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex items-start gap-8 group",
                  !isLast && "pb-12", // Fixed padding to control line length
                )}
              >
                {/* Connecting Line Section */}
                {!isLast && (
                  <div className="absolute left-[7px] top-4 w-[2px] h-full">
                    {/* Background Line */}
                    <div className="absolute inset-0 bg-neutral-300" />
                    {/* Active Light-up Line */}
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 bg-neutral-900 transition-all duration-700 ease-in-out",
                        isCompleted ? "h-full" : "h-0",
                      )}
                    />
                  </div>
                )}

                {/* Timeline Node */}
                <div
                  className={cn(
                    "relative z-10 w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0",
                    isCompleted || isActive
                      ? "bg-neutral-900 border-neutral-900 shadow-xl"
                      : "bg-white border-neutral-400",
                  )}
                >
                  {/* Pulse for active step */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-neutral-900 animate-ping opacity-30" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col text-left pt-0">
                  <span
                    className={cn(
                      "text-xs font-black uppercase tracking-widest transition-colors duration-500",
                      isCompleted || isActive
                        ? "text-neutral-900"
                        : "text-neutral-300",
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-500",
                      isCompleted || isActive
                        ? "text-neutral-400"
                        : "text-neutral-200",
                    )}
                  >
                    {step.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setActiveOrderId(null)}
          className="mt-12 text-[10px] font-black uppercase border border-neutral-300 py-4 px-6 w-full max-w-[240px] tracking-widest text-neutral-700 hover:text-neutral-900 hover:border-neutral-900 transition-all active:scale-95 rounded-[4px]"
        >
          Place Another Order
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-neutral-100 rounded-[6px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      {/* Search & Categories */}
      <div className="sticky top-[80px] bg-neutral-50/90 backdrop-blur-md pt-2 pb-6 space-y-4 z-40">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-[6px] py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-neutral-900 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-5 py-2.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest transition-all border shrink-0",
              activeCategory === "all"
                ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                : "bg-white text-neutral-400 border-neutral-200",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest transition-all border shrink-0",
                activeCategory === cat.id
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                  : "bg-white text-neutral-400 border-neutral-200",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-12">
        {groupedItems.map((group) => (
          <section key={group.id} className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tighter shrink-0">
                {group.name}
              </h2>
              <div className="h-[1px] bg-neutral-200 flex-1" />
            </div>

            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-neutral-100 rounded-[6px] p-3 flex gap-4 transition-all shadow-sm active:bg-neutral-50"
                >
                  <div className="w-20 h-20 bg-neutral-100 rounded-[4px] overflow-hidden shrink-0 border border-neutral-200/50">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-200 text-[8px] font-black uppercase">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-neutral-900 uppercase tracking-tight text-sm leading-tight">
                        {item.name}
                      </h3>
                      <span className="font-black text-neutral-900 tracking-tighter text-sm whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <div className="flex justify-end items-center mt-3">
                      {cart[item.id] ? (
                        <div className="flex items-center gap-4 bg-neutral-900 text-white p-1 rounded-full border border-neutral-900 shadow-lg scale-90 origin-right">
                          <button
                            onClick={() => updateCart(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center">
                            {cart[item.id]}
                          </span>
                          <button
                            onClick={() => updateCart(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Plus className="w-3 h-3 text-neutral-900" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateCart(item.id, 1)}
                          className="bg-neutral-900 text-white px-5 py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Slim Cart */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 inset-x-6 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-neutral-900 text-white py-4 px-6 rounded-[6px] font-black text-[10px] uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <span>Review Order ({cartItemCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tracking-tighter">
                {formatCurrency(cartTotal.toString())}
              </span>
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Drawer */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-2xl rounded-t-[24px] p-8 pb-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">
                Your Selection
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-neutral-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5 mb-10 max-h-[45vh] overflow-y-auto pr-2 scrollbar-hide">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find((m) => m.id === id);
                return (
                  <div key={id} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-[4px] flex items-center justify-center text-[10px] font-black">
                        {qty}x
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900 text-sm block uppercase tracking-tight">
                          {item?.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-black tracking-tighter">
                          {formatCurrency(item?.price || "0")} each
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-neutral-900 text-sm tracking-tighter">
                      {formatCurrency(
                        (parseFloat(item?.price || "0") * qty).toString(),
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-100 pt-8 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-neutral-400 font-black uppercase tracking-widest text-[12px]">
                  Total Amount
                </span>
                <span className="text-2xl font-black text-neutral-900 tracking-tighter">
                  {formatCurrency(cartTotal.toString())}
                </span>
              </div>
              <button
                onClick={() => placeOrderMutation.mutate()}
                disabled={placeOrderMutation.isPending}
                className="w-full bg-neutral-900 text-white py-5 rounded-[6px] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {placeOrderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send to Kitchen
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
