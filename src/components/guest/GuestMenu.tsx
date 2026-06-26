"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getFastingState } from "@/lib/fasting-calendar";
import { ItemModifierSheet } from "./ItemModifierSheet";
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
} from "lucide-react";
import { ServiceRequestButton } from "./ServiceRequestButton";

interface PromoCodeResult {
  valid: boolean;
  discount?: number;
  promoCode?: { id: string; code: string; discountType: string; discountValue: string };
  error?: string;
}

interface GuestMenuProps {
  hotelId: string;
  tableId: string;
  hotelName: string;
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
  isAvailable: boolean;
  hasModifiers: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
}

interface ModifierSelection {
  id: string;
  name: string;
  priceDelta: number;
}

interface CartEntry {
  qty: number;
  modifiers: ModifierSelection[];
}

interface ComboItem {
  menuItemId: string;
  quantity: number;
  name: string;
  price: string;
}

interface Combo {
  id: string;
  name: string;
  totalPrice: string;
  items: ComboItem[];
  savings: number;
}

export default function GuestMenu({ hotelId, tableId, hotelName }: GuestMenuProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isPromoValidating, setIsPromoValidating] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const fasting = useMemo(() => getFastingState(), []);

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

  const { data: combos = [] } = useQuery<Combo[]>({
    queryKey: ["guest-combos", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/combos?hotelId=${hotelId}`);
      return res.json();
    },
  });

  const handleAddCombo = (combo: Combo) => {
    for (const item of combo.items) {
      setCart((prev) => {
        const current = prev[item.menuItemId]?.qty || 0;
        return { ...prev, [item.menuItemId]: { qty: current + item.quantity, modifiers: [] } };
      });
    }
  };

  const [liveItems, setLiveItems] = useState<MenuItem[]>(menuItems);

  useEffect(() => {
    setLiveItems(menuItems);
  }, [menuItems]);

  useEffect(() => {
    const channel = supabase
      .channel(`menu-items-${hotelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as MenuItem;
            setLiveItems((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

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

  const placeOrderMutation = useMutation({
    mutationFn: async (paymentMethod: "digital" | "cash") => {
      const res = await fetch("/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          tableId,
          cartItems: cart,
          orderType: paymentMethod,
          promoCodeId: appliedPromo?.promoCode?.id || null,
          discountAmount: appliedPromo?.discount?.toFixed(2) || "0",
          tipAmount: (selectedTip > 0 ? selectedTip : 0).toFixed(2),
          customerPhone: customerPhone || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      return res.json();
    },
    onSuccess: (data) => {
      setActiveOrderId(data.id);
      setOrderStatus(data.status);
      setCart({});
      setAppliedPromo(null);
      setPromoCodeInput("");
      setSelectedTip(0);
      setCustomTipAmount("");
      setCustomerPhone("");
      setIsCheckoutOpen(false);
    },
  });

  const handleAddItem = (item: MenuItem) => {
    if (!item.isAvailable) return;
    if (item.hasModifiers) {
      setModifierItem(item);
    } else {
      setCart((prev) => {
        const current = prev[item.id]?.qty || 0;
        return { ...prev, [item.id]: { qty: current + 1, modifiers: [] } };
      });
    }
  };

  const handleModifierConfirm = (selected: any[], addon: number) => {
    if (!modifierItem) return;
    const mapped = selected.map((m: any) => ({
      id: m.id,
      name: m.name,
      priceDelta: parseFloat(m.priceModifier || "0"),
    }));
    setCart((prev) => {
      const current = prev[modifierItem.id]?.qty || 0;
      return {
        ...prev,
        [modifierItem.id]: { qty: current + 1, modifiers: mapped },
      };
    });
    setModifierItem(null);
  };

  const updateCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id]?.qty || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...prev[id], qty: next } };
    });
  };

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b.qty, 0);

  const cartSubtotal = Object.entries(cart).reduce((total, [id, entry]) => {
    const item = liveItems.find((m) => m.id === id);
    const base = parseFloat(item?.price || "0") * entry.qty;
    const modifiers = entry.modifiers.reduce((s, m) => s + m.priceDelta, 0) * entry.qty;
    return total + base + modifiers;
  }, 0);

  const discountAmount = appliedPromo?.discount || 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + selectedTip);

  const sortedItems = useMemo(() => {
    if (!fasting.isFastingDay) return liveItems;
    return [...liveItems].sort((a, b) => {
      if (a.isVegetarian && !b.isVegetarian) return -1;
      if (!a.isVegetarian && b.isVegetarian) return 1;
      return 0;
    });
  }, [liveItems, fasting.isFastingDay]);

  const filteredItems = sortedItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameAm && item.nameAm.toLowerCase().includes(search.toLowerCase())),
  ).filter(
    (item) => activeCategory === "all" || item.categoryId === activeCategory,
  );

  const groupedItems = categories
    .map((cat) => ({
      ...cat,
      items: filteredItems.filter((item) => item.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0 || activeCategory === group.id);

  if (activeOrderId) {
    const steps = [
      { id: "pending", label: "Order Received", sub: "We got it" },
      { id: "preparing", label: "In Kitchen", sub: "Being prepared" },
      { id: "served", label: "Served", sub: "Enjoy" },
    ];

    const getCurrentStepIdx = () => {
      if (orderStatus === "pending") return 0;
      if (orderStatus === "preparing") return 1;
      if (orderStatus === "served") return 2;
      return 0;
    };

    const currentStepIdx = getCurrentStepIdx();

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500 text-neutral-900 dark:text-neutral-900">
        <h2 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter mb-4">
          Order: {orderStatus}
        </h2>
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 max-w-[200px] font-black mb-16">
          Your items are being prepared.
        </p>

        <div className="relative w-full max-w-[240px]">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx || orderStatus === "served";
            const isActive = idx === currentStepIdx;
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex items-start gap-8 group",
                  !isLast && "pb-12",
                )}
              >
                {!isLast && (
                  <div className="absolute left-[7px] top-4 w-[2px] h-full">
                    <div className="absolute inset-0 bg-neutral-300" />
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 bg-neutral-900 transition-all duration-700 ease-in-out",
                        isCompleted ? "h-full" : "h-0",
                      )}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    "relative z-10 w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0",
                    isCompleted || isActive
                      ? "bg-neutral-900 border-neutral-900 shadow-xl"
                      : "bg-white border-neutral-400",
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-neutral-900 animate-ping opacity-30" />
                  )}
                </div>

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
          Order Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-[6px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 text-neutral-900 dark:text-neutral-900">
      {/* Combos Section */}
      {combos.length > 0 && !search && activeCategory === "all" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tighter shrink-0">
              Combos
            </h2>
            <div className="h-[1px] bg-neutral-200 flex-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {combos.map((combo) => {
              const inCart = combo.items.every((item) => cart[item.menuItemId]);
              return (
                <div
                  key={combo.id}
                  className="bg-white border-2 border-neutral-900 rounded-[6px] p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                      {combo.name}
                    </h3>
                    {combo.savings > 0 && (
                      <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                        Save {formatCurrency(combo.savings.toString())}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-medium space-y-0.5 mb-4">
                    {combo.items.map((item, idx) => (
                      <div key={idx}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-neutral-900">
                      {formatCurrency(combo.totalPrice)}
                    </span>
                    <button
                      onClick={() => handleAddCombo(combo)}
                      disabled={inCart}
                      className="bg-neutral-900 text-white px-4 py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {inCart ? "Added" : "Add Combo"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fasting Day Banner */}
      {fasting.isFastingDay && (
        <div className="bg-orange-50 border border-orange-200 rounded-[6px] p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">
              Fasting day (የጾም ቀን) — {fasting.seasonName}
            </p>
        </div>
      )}

      {/* Search & Categories */}
      <div className="bg-neutral-50/90 pb-6 space-y-4">
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
              {group.items.map((item) => {
                const isUnavailable = !item.isAvailable;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white border rounded-[6px] p-3 flex gap-4 transition-all shadow-sm",
                      isUnavailable
                        ? "border-neutral-100 opacity-50"
                        : "border-neutral-100 active:bg-neutral-50",
                    )}
                  >
                    <div className="w-20 h-20 bg-neutral-100 rounded-[4px] overflow-hidden shrink-0 border border-neutral-200/50 relative">
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
                      {isUnavailable && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-[8px] font-black uppercase text-red-500 bg-white px-2 py-1 rounded border border-red-200">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-neutral-900 uppercase tracking-tight text-sm leading-tight">
                            {item.name}
                          </h3>
                          {item.isVegetarian && fasting.isFastingDay && (
                            <span className="text-[7px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                              ጾም
                            </span>
                          )}
                          {item.hasModifiers && (
                            <span className="text-[7px] font-black uppercase tracking-widest text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                              Customize
                            </span>
                          )}
                        </div>
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
                              {cart[item.id].qty}
                            </span>
                            <button
                              onClick={() => handleAddItem(item)}
                              disabled={isUnavailable}
                              className="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3 text-neutral-900" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddItem(item)}
                            disabled={isUnavailable}
                            className="bg-neutral-900 text-white px-5 py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUnavailable ? "Sold Out" : "Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {groupedItems.length === 0 && !isLoading && (
        <div className="py-16 text-center">
          <Utensils className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
          <p className="text-sm font-bold text-neutral-400">No items found</p>
          <p className="text-[10px] text-neutral-500 mt-2">Try a different search or category</p>
        </div>
      )}

      {/* Floating Slim Cart */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 inset-x-6 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-neutral-900 dark:bg-neutral-900 text-white py-4 px-6 rounded-[6px] font-black text-[10px] uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between group active:scale-[0.98] transition-transform border border-neutral-800 dark:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <span>Review Order ({cartItemCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tracking-tighter">
                {formatCurrency(cartSubtotal.toString())}
              </span>
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Drawer */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white dark:bg-white w-full max-w-2xl rounded-t-[24px] p-8 pb-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">
                Your Selection
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-neutral-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5 mb-10 max-h-[45vh] overflow-y-auto pr-2 scrollbar-hide">
              {Object.entries(cart).map(([id, entry]) => {
                const item = liveItems.find((m) => m.id === id);
                const modifierNames = entry.modifiers.map((m) => m.name).join(", ");
                const itemTotal =
                  parseFloat(item?.price || "0") * entry.qty +
                  entry.modifiers.reduce((s, m) => s + m.priceDelta, 0) * entry.qty;

                return (
                  <div key={id} className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-[4px] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {entry.qty}x
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900 text-sm block uppercase tracking-tight">
                          {item?.name}
                        </span>
                        {modifierNames && (
                          <span className="text-[9px] text-neutral-500 font-medium block mt-0.5">
                            + {modifierNames}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 font-black tracking-tighter">
                          {formatCurrency(item?.price || "0")} each
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-neutral-900 text-sm tracking-tighter shrink-0">
                      {formatCurrency(itemTotal.toString())}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Phone Number */}
            <div className="border-t border-neutral-100 pt-6 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                Phone (loyalty)
              </span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+251 9XX XXX XXX"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-black"
              />
            </div>

            {/* Promo Code */}
            <div className="border-t border-neutral-100 pt-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.target.value.toUpperCase());
                    setAppliedPromo(null);
                    setPromoError("");
                  }}
                  placeholder="Promo Code"
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-[4px] px-4 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-black"
                />
                <button
                  onClick={async () => {
                    if (!promoCodeInput.trim()) return;
                    setIsPromoValidating(true);
                    setPromoError("");
                    setAppliedPromo(null);
                    try {
                      const res = await fetch("/api/promo-codes/validate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: promoCodeInput.trim(), orderAmount: cartSubtotal.toString() }),
                      });
                      const data = await res.json();
                      if (data.valid) {
                        setAppliedPromo(data);
                      } else {
                        setPromoError(data.error || "Invalid code");
                      }
                    } catch {
                      setPromoError("Failed to validate code");
                    }
                    setIsPromoValidating(false);
                  }}
                  disabled={isPromoValidating || !promoCodeInput.trim()}
                  className="bg-neutral-900 text-white px-5 py-3 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shrink-0"
                >
                  {isPromoValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {promoError && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">
                  {promoError}
                </p>
              )}
              {appliedPromo && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[4px] px-4 py-2">
                  <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">
                    Code Applied: {appliedPromo.promoCode?.code}
                  </span>
                  <span className="text-xs font-black text-green-700">
                    -{formatCurrency(appliedPromo.discount!.toString())}
                  </span>
                </div>
              )}
            </div>

            {/* Tip Selection */}
            <div className="border-t border-neutral-100 pt-6 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                Tip
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "No Tip", value: 0 },
                  { label: "10 ETB", value: 10 },
                  { label: "20 ETB", value: 20 },
                  { label: "50 ETB", value: 50 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedTip(opt.value);
                      setCustomTipAmount("");
                    }}
                    className={`px-4 py-2.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest border transition-all ${
                      selectedTip === opt.value && !customTipAmount
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={customTipAmount}
                    onChange={(e) => {
                      setCustomTipAmount(e.target.value);
                      setSelectedTip(e.target.value ? parseFloat(e.target.value) : 0);
                    }}
                    placeholder="Custom"
                    className="w-24 bg-neutral-50 border border-neutral-200 rounded-[4px] px-3 py-2.5 text-[9px] font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-8 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Subtotal
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {formatCurrency(cartSubtotal.toString())}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                    Discount
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    -{formatCurrency(discountAmount.toString())}
                  </span>
                </div>
              )}
              {selectedTip > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Tip
                  </span>
                  <span className="text-sm font-bold text-neutral-900">
                    {formatCurrency(selectedTip.toString())}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2 border-t border-neutral-200">
                <span className="text-neutral-900 font-black uppercase tracking-widest text-[12px]">
                  Total Amount
                </span>
                <span className="text-2xl font-black text-neutral-900 tracking-tighter">
                  {formatCurrency(cartTotal.toString())}
                </span>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => placeOrderMutation.mutate("digital")}
                  disabled={placeOrderMutation.isPending}
                  className="w-full bg-neutral-900 text-white py-5 rounded-[6px] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-black transition-all"
                >
                  {placeOrderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Pay Now — {formatCurrency(cartTotal.toString())}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => placeOrderMutation.mutate("cash")}
                  disabled={placeOrderMutation.isPending}
                  className="w-full border-2 border-neutral-900 text-neutral-900 py-5 rounded-[6px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-neutral-50 transition-all"
                >
                  Pay at Counter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Buttons */}
      {!activeOrderId && (
        <ServiceRequestButton hotelId={hotelId} tableId={tableId} />
      )}

      {/* Modifier Sheet */}
      {modifierItem && (
        <ItemModifierSheet
          itemId={modifierItem.id}
          itemName={modifierItem.name}
          basePrice={modifierItem.price}
          onConfirm={handleModifierConfirm}
          onClose={() => setModifierItem(null)}
        />
      )}
    </div>
  );
}
