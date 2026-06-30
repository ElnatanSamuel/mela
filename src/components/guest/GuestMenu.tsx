"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getFastingState } from "@/lib/fasting-calendar";
import { ItemModifierSheet } from "./ItemModifierSheet";
import { ItemDetailSheet } from "./ItemDetailSheet";
import { useToastStore } from "@/lib/toast-store";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Utensils,
  Flame,
  Leaf,
  Sparkles,
  Receipt,
  ArrowLeft,
  Star,
} from "lucide-react";
import { ServiceRequestButton } from "./ServiceRequestButton";
import GuestReceipt from "./GuestReceipt";
import { motion, AnimatePresence } from "framer-motion";

interface PromoCodeResult {
  valid: boolean;
  discount?: number;
  promoCode?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: string;
  };
  error?: string;
}

interface GuestMenuProps {
  hotelId: string;
  tableId: string;
  hotelName: string;
  hotelSlug: string;
  vatRate?: number;
  serviceChargeRate?: number;
}

interface MenuItem {
  id: string;
  name: string;
  nameAm: string | null;
  description: string | null;
  descriptionAm: string | null;
  price: string;
  imageUrl?: string;
  isSpicy: boolean;
  isVegetarian: boolean;
  isDailySpecial: boolean;
  isAvailable: boolean;
  hasModifiers: boolean;
  categoryId: string;
  estimatedPrepTime: number | null;
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

export default function GuestMenu({
  hotelId,
  tableId,
  hotelName,
  hotelSlug,
  vatRate = 0.15,
  serviceChargeRate = 0.1,
}: GuestMenuProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeResult | null>(
    null,
  );
  const [promoError, setPromoError] = useState("");
  const [isPromoValidating, setIsPromoValidating] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const { addToast } = useToastStore();
  const [complaintMessage, setComplaintMessage] = useState("");
  const [currentOrderTotal, setCurrentOrderTotal] = useState<string | null>(
    null,
  );
  const [currentOrderPaymentType, setCurrentOrderPaymentType] = useState<
    string | null
  >(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<
    string | null
  >(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

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
        return {
          ...prev,
          [item.menuItemId]: { qty: current + item.quantity, modifiers: [] },
        };
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
              prev.map((item) =>
                item.id === updated.id ? { ...item, ...updated } : item,
              ),
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
    fetch(`/api/guest/orders/${activeOrderId}`)
      .then((r) => r.json())
      .then((d) => {
        setOrderStatus(d.order?.status || "pending");
        setCurrentPaymentStatus(d.order?.paymentStatus || null);
        setCurrentOrderTotal(d.order?.totalAmount || null);
        setCurrentOrderPaymentType(d.order?.orderType || null);
      })
      .catch(() => {});
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
          const newStatus = payload.new.status;
          const newPaymentStatus = payload.new.paymentStatus;
          setOrderStatus(newStatus);
          if (newPaymentStatus) setCurrentPaymentStatus(newPaymentStatus);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrderId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oid = params.get("orderId");
    if (oid && !activeOrderId) {
      setActiveOrderId(oid);
      setShowReceipt(false);
    }
  }, []);

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
      if (!res.ok) {
        const errData = await res
          .json()
          .catch(() => ({ error: "Failed to place order" }));
        throw new Error(errData.error || "Failed to place order");
      }
      return res.json();
    },
    onSuccess: async (data, paymentMethod) => {
      setCurrentOrderTotal(data.totalAmount);
      setCurrentOrderPaymentType(paymentMethod);
      if (paymentMethod === "digital") {
        try {
          const shortId = data.id.slice(0, 8);
          const shortTs = Date.now().toString().slice(-8);
          const txRef = `mel-${shortId}-${shortTs}`;
          const chapaRes = await fetch("/api/pay/chapa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: parseFloat(data.totalAmount),
              txRef,
              firstName: "Guest",
              hotelName,
              orderId: data.id,
            }),
          });
          const chapaData = await chapaRes.json();
          if (chapaData.checkoutUrl) {
            sessionStorage.setItem(
              "mela-pending-order",
              JSON.stringify({
                orderId: data.id,
                txRef,
                hotelId,
                tableId,
                hotelSlug,
              }),
            );
            window.location.href = chapaData.checkoutUrl;
            return;
          }
          addToast(
            chapaData.error || "Payment gateway error. You can pay with cash.",
            "error",
          );
        } catch (err: any) {
          console.error("Chapa init failed:", err);
          addToast(
            "Payment gateway unavailable. You can pay with cash.",
            "error",
          );
        }
      }
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
    onError: (error) => {
      console.error("Place order failed:", error);
      addToast(
        error.message || "Failed to place order. Please try again.",
        "error",
      );
    },
  });

  const complaintMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          tableId,
          orderId: activeOrderId,
          hotelId,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit complaint");
      return res.json();
    },
    onSuccess: () => {
      setShowComplaintModal(false);
      setComplaintMessage("");
    },
  });

  const payNowMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrderId || !currentOrderTotal)
        throw new Error("No order to pay");
      const shortId = activeOrderId.slice(0, 8);
      const shortTs = Date.now().toString().slice(-8);
      const txRef = `mel-${shortId}-${shortTs}`;
      const chapaRes = await fetch("/api/pay/chapa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(currentOrderTotal),
          txRef,
          firstName: "Guest",
          hotelName,
          orderId: activeOrderId,
        }),
      });
      const chapaData = await chapaRes.json();
      if (!chapaData.checkoutUrl)
        throw new Error(chapaData.error || "Chapa init failed");
      sessionStorage.setItem(
        "mela-pending-order",
        JSON.stringify({
          orderId: activeOrderId,
          txRef,
          hotelId,
          tableId,
          hotelSlug,
        }),
      );
      window.location.href = chapaData.checkoutUrl;
    },
    onError: (error) => {
      console.error("Pay now failed:", error);
      addToast(
        error.message || "Payment failed. Try again or pay at counter.",
        "error",
      );
    },
  });

  const handleAddItem = (item: MenuItem) => {
    if (!item.isAvailable) return;
    if (item.hasModifiers) {
      setModifierItem(item);
      return;
    }
    setCart((prev) => {
      const current = prev[item.id]?.qty || 0;
      return { ...prev, [item.id]: { qty: current + 1, modifiers: [] } };
    });
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
    const modifiers =
      entry.modifiers.reduce((s, m) => s + m.priceDelta, 0) * entry.qty;
    return total + base + modifiers;
  }, 0);

  const discountAmount = appliedPromo?.discount || 0;
  const vatAmount = cartSubtotal * vatRate;
  const serviceAmount = cartSubtotal * serviceChargeRate;
  const cartTotal = Math.max(
    0,
    cartSubtotal + vatAmount + serviceAmount - discountAmount + selectedTip,
  );

  const sortedItems = useMemo(() => {
    if (!fasting.isFastingDay) return liveItems;
    return [...liveItems].sort((a, b) => {
      if (a.isVegetarian && !b.isVegetarian) return -1;
      if (!a.isVegetarian && b.isVegetarian) return 1;
      return 0;
    });
  }, [liveItems, fasting.isFastingDay]);

  const filteredItems = sortedItems
    .filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameAm &&
          item.nameAm.toLowerCase().includes(search.toLowerCase())),
    )
    .filter(
      (item) => activeCategory === "all" || item.categoryId === activeCategory,
    );

  const groupedItems = categories
    .map((cat) => ({
      ...cat,
      items: filteredItems.filter((item) => item.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0 || activeCategory === group.id);

  if (activeOrderId && showReceipt) {
    return (
      <GuestReceipt
        orderId={activeOrderId}
        onBack={() => setShowReceipt(false)}
      />
    );
  }

  if (activeOrderId) {
    const steps = [
      { id: "pending", label: "Order Placed", sub: "We received your order" },
      {
        id: "confirmed",
        label: "Accepted",
        sub: "Kitchen confirmed your order",
      },
      {
        id: "preparing",
        label: "Being Prepared",
        sub: "The kitchen is cooking",
      },
      { id: "served", label: "Ready", sub: "Enjoy your meal" },
    ];
    const statusOrder = ["pending", "confirmed", "preparing", "served"];
    const currentStepIdx = statusOrder.indexOf(orderStatus);
    const normalizedIdx = currentStepIdx === -1 ? 0 : currentStepIdx;

    return (
      <div className="px-4 py-6">
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => {
              setActiveOrderId(null);
              setShowReceipt(false);
            }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight mb-2">
              {orderStatus === "served"
                ? "Order Ready!"
                : orderStatus === "cancelled"
                  ? "Order Cancelled"
                  : "Order Placed"}
            </h2>
            <p className="text-sm text-stone-400">
              {orderStatus === "served"
                ? "Your food is ready"
                : orderStatus === "cancelled"
                  ? "This order has been cancelled"
                  : "Sit tight, we're working on it"}
            </p>
          </div>

          {orderStatus !== "cancelled" && (
            <div className="space-y-0 mb-10">
              {steps.map((step, idx) => {
                const isCompleted =
                  idx < normalizedIdx || orderStatus === "served";
                const isActive = idx === normalizedIdx;
                return (
                  <div key={step.id} className="flex items-start gap-4 relative">
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[15px] top-8 w-[2px] h-8">
                        <div
                          className={cn(
                            "w-full h-full transition-colors duration-500",
                            isCompleted ? "bg-stone-900" : "bg-stone-200",
                          )}
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 z-10",
                        isCompleted
                          ? "bg-stone-900"
                          : isActive
                            ? "bg-stone-900 ring-4 ring-stone-100"
                            : "bg-stone-200",
                      )}
                    >
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                      {isActive && !isCompleted && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="pb-8 pt-1">
                      <p
                        className={cn(
                          "text-sm font-bold transition-colors",
                          isCompleted || isActive
                            ? "text-stone-900"
                            : "text-stone-300",
                        )}
                      >
                        {step.label}
                      </p>
                      <p
                        className={cn(
                          "text-xs transition-colors",
                          isCompleted || isActive
                            ? "text-stone-400"
                            : "text-stone-200",
                        )}
                      >
                        {step.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            {orderStatus === "served" && currentPaymentStatus !== "paid" && (
              <button
                onClick={() => setShowPaymentSheet(true)}
                className="w-full bg-stone-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg hover:bg-stone-800"
              >
                <Receipt className="w-4 h-4" />
                Pay Now
              </button>
            )}

            <button
              onClick={() => {
                setActiveOrderId(null);
                setShowReceipt(false);
              }}
              className="w-full bg-stone-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform hover:bg-stone-800"
            >
              {orderStatus === "served" ? "Order Again" : "Back to Menu"}
            </button>

            <button
              onClick={() => setShowComplaintModal(true)}
              className="w-full text-stone-400 py-3 text-xs font-bold uppercase tracking-widest hover:text-stone-600 transition-colors"
            >
              Report an Issue
            </button>
          </div>

          {showComplaintModal && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowComplaintModal(false)}
            >
              <div
                className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-black uppercase tracking-tight text-stone-900 mb-4">
                  What went wrong?
                </h3>
                <textarea
                  value={complaintMessage}
                  onChange={(e) => setComplaintMessage(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400 resize-none h-28"
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      if (complaintMessage.trim())
                        complaintMutation.mutate(complaintMessage);
                    }}
                    disabled={
                      !complaintMessage.trim() || complaintMutation.isPending
                    }
                    className="flex-1 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {complaintMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Submit"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowComplaintModal(false);
                      setComplaintMessage("");
                    }}
                    className="flex-1 py-3 border border-stone-200 text-stone-400 text-xs font-bold uppercase tracking-widest rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {showPaymentSheet && (
              <div className="fixed inset-0 z-[100]" onClick={() => setShowPaymentSheet(false)}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"
                >
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-stone-200 rounded-full" />
                  </div>
                  <div className="px-6 pb-8 space-y-3">
                    <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight text-center mb-6">
                      Choose Payment
                    </h3>
                    <button
                      onClick={() => { setShowPaymentSheet(false); payNowMutation.mutate(); }}
                      disabled={payNowMutation.isPending}
                      className="w-full bg-stone-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg hover:bg-stone-800"
                    >
                      {payNowMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Pay with Chapa — {currentOrderTotal ? formatCurrency(currentOrderTotal) : ""}</>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowPaymentSheet(false); setShowReceipt(true); }}
                      className="w-full border-2 border-stone-200 text-stone-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-transform hover:border-stone-300"
                    >
                      Pay at Counter
                    </button>
                    <button
                      onClick={() => setShowPaymentSheet(false)}
                      className="w-full text-stone-400 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-stone-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-xl animate-pulse shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Search */}
      <div className="relative mb-5 mt-5">
        {showSearchInput ? (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-white border border-stone-200 rounded-xl py-3.5 pl-11 pr-11 text-sm focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5 transition-all shadow-sm"
            />
            <button
              onClick={() => { setShowSearchInput(false); setSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearchInput(true)}
            className="w-full bg-white border border-stone-200 rounded-xl py-3.5 px-4 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-all text-left"
          >
            <Search className="w-4 h-4 text-stone-300 shrink-0" />
            <span className="text-sm text-stone-400">Search menu...</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 mb-5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider",
              activeCategory === "all"
                ? "bg-stone-900 text-white shadow-md shadow-stone-900/20"
                : "bg-stone-100 text-stone-400 hover:bg-stone-200 active:bg-stone-300",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider",
                activeCategory === cat.id
                  ? "bg-stone-900 text-white shadow-md shadow-stone-900/20"
                  : "bg-stone-100 text-stone-400 hover:bg-stone-200 active:bg-stone-300",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Fasting Banner */}
      {fasting.isFastingDay && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <p className="text-xs font-bold text-amber-700">
            {fasting.seasonName}. Vegetarian options shown first.
          </p>
        </div>
      )}

      {/* Combos */}
      {combos.length > 0 && !search && activeCategory === "all" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">
              Meal Deals
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {combos.map((combo) => (
              <div
                key={combo.id}
                className="min-w-[240px] bg-stone-900 text-white rounded-xl p-5 flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    {combo.name}
                  </h3>
                  {combo.savings > 0 && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                      Save {formatCurrency(combo.savings.toString())}
                    </span>
                  )}
                </div>
                <div className="space-y-1 mb-4 text-white/60 text-xs">
                  {combo.items.map((item, idx) => (
                    <div key={idx}>
                      {item.quantity}x {item.name}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black">
                    {formatCurrency(combo.totalPrice)}
                  </span>
                  <button
                    onClick={() => handleAddCombo(combo)}
                    className="bg-white text-stone-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform hover:bg-stone-100"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped Menu */}
      <div className="space-y-8">
        {groupedItems.map((group) => (
          <section key={group.id}>
            <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4 px-0.5">
              {group.name}
            </h2>

            <div className="space-y-3">
              {group.items.map((item, i) => {
                const isUnavailable = !item.isAvailable;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => !isUnavailable && setDetailItem(item)}
                    className={cn(
                      "bg-white rounded-xl p-3 flex gap-3 shadow-sm transition-all",
                      isUnavailable
                        ? "opacity-40"
                        : "cursor-pointer active:scale-[0.99] hover:shadow-md",
                    )}
                  >
                    {/* Image */}
                    <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0 relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-stone-200" />
                        </div>
                      )}
                      {item.isDailySpecial && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase shadow-sm">
                          Special
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-stone-900 text-sm leading-tight">
                            {item.name}
                          </h3>
                          <span className="font-black text-stone-900 text-sm whitespace-nowrap tabular-nums">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        {item.nameAm && (
                          <p className="text-[10px] text-stone-300 leading-tight">
                            {item.nameAm}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-stone-400 line-clamp-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-0.5">
                          {item.isVegetarian && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                              <Leaf className="w-2.5 h-2.5" /> Veg
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                              <Flame className="w-2.5 h-2.5" /> Spicy
                            </span>
                          )}
                          {item.estimatedPrepTime && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold text-stone-400">
                              <Clock className="w-2.5 h-2.5" />{" "}
                              {item.estimatedPrepTime}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to cart */}
                      <div className="flex justify-end mt-1.5">
                        {cart[item.id] ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-stone-900 text-white rounded-lg p-1"
                          >
                            <button
                              onClick={() => updateCart(item.id, -1)}
                              className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black w-6 text-center tabular-nums">
                              {cart[item.id].qty}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddItem(item);
                              }}
                              className="w-7 h-7 rounded-md bg-white flex items-center justify-center active:scale-95 transition-transform"
                            >
                              <Plus className="w-3 h-3 text-stone-900" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItem(item);
                            }}
                            disabled={isUnavailable}
                            className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-30 hover:bg-stone-800"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Empty State */}
      {groupedItems.length === 0 && !isLoading && (
        <div className="py-20 text-center">
          <Utensils className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-stone-300 uppercase tracking-wider">No items found</p>
          <p className="text-xs text-stone-300 mt-1">
            Try a different search or category
          </p>
        </div>
      )}

      {/* Floating Cart */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 inset-x-4 z-60"
          >
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-stone-900 text-white py-4 px-5 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-between active:scale-[0.98] transition-transform hover:bg-stone-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center relative">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-orange-500 rounded-full text-[8px] font-black flex items-center justify-center shadow-sm">
                    {cartItemCount}
                  </span>
                </div>
                <span>View Order</span>
              </div>
              <span className="text-sm tabular-nums tracking-tight">
                {formatCurrency(cartSubtotal.toString())}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Drawer */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsCheckoutOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-stone-200 rounded-full" />
              </div>

              <div className="px-6 pb-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">
                    Your Order
                  </h3>
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {Object.entries(cart).map(([id, entry]) => {
                    const item = liveItems.find((m) => m.id === id);
                    const modifierNames = entry.modifiers
                      .map((m) => m.name)
                      .join(", ");
                    const itemTotal =
                      parseFloat(item?.price || "0") * entry.qty +
                      entry.modifiers.reduce((s, m) => s + m.priceDelta, 0) *
                        entry.qty;
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center text-xs font-black text-stone-500 shrink-0 tabular-nums">
                          {entry.qty}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-900 truncate">
                            {item?.name}
                          </p>
                          {modifierNames && (
                            <p className="text-[10px] text-stone-400 truncate">
                              {modifierNames}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-black text-stone-900 tabular-nums">
                          {formatCurrency(itemTotal.toString())}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">
                    Phone (for loyalty)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+251 9XX XXX XXX"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-400"
                  />
                </div>

                {/* Promo */}
                <div className="mb-4">
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
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-stone-400"
                    />
                    <button
                      onClick={async () => {
                        if (!promoCodeInput.trim()) return;
                        setIsPromoValidating(true);
                        try {
                          const res = await fetch("/api/promo-codes/validate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              code: promoCodeInput.trim(),
                              orderAmount: cartSubtotal.toString(),
                            }),
                          });
                          const data = await res.json();
                          if (data.valid) setAppliedPromo(data);
                          else setPromoError(data.error || "Invalid code");
                        } catch {
                          setPromoError("Failed");
                        }
                        setIsPromoValidating(false);
                      }}
                      disabled={isPromoValidating || !promoCodeInput.trim()}
                      className="bg-stone-900 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-stone-800 transition-colors"
                    >
                      {isPromoValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">
                      {promoError}
                    </p>
                  )}
                  {appliedPromo && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2 mt-2">
                      <span className="text-[10px] font-black text-green-700 uppercase">
                        Applied: {appliedPromo.promoCode?.code}
                      </span>
                      <span className="text-xs font-black text-green-700 tabular-nums">
                        -{formatCurrency(appliedPromo.discount!.toString())}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tip */}
                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">
                    Add a Tip
                  </label>
                  <div className="flex gap-2">
                    {[0, 10, 20, 50].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setSelectedTip(v);
                          setCustomTipAmount("");
                        }}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                          selectedTip === v && !customTipAmount
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-400 border-stone-200 hover:border-stone-300",
                        )}
                      >
                        {v === 0 ? "None" : `ETB ${v}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Subtotal</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(cartSubtotal.toString())}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>VAT ({(vatRate * 100).toFixed(0)}%)</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(vatAmount.toFixed(2))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>
                      Service ({(serviceChargeRate * 100).toFixed(0)}%)
                    </span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(serviceAmount.toFixed(2))}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Discount</span>
                      <span className="font-bold tabular-nums">
                        -{formatCurrency(discountAmount.toString())}
                      </span>
                    </div>
                  )}
                  {selectedTip > 0 && (
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Tip</span>
                      <span className="font-bold tabular-nums">
                        {formatCurrency(selectedTip.toString())}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-stone-100">
                    <span className="text-sm font-black text-stone-900 uppercase tracking-widest">
                      Total
                    </span>
                    <span className="text-xl font-black text-stone-900 tabular-nums tracking-tighter">
                      {formatCurrency(cartTotal.toString())}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <div className="space-y-3">
                  <button
                    onClick={() => placeOrderMutation.mutate("cash")}
                    disabled={placeOrderMutation.isPending}
                    className="w-full bg-stone-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform hover:bg-stone-800"
                  >
                    {placeOrderMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Place Order"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!activeOrderId && (
        <ServiceRequestButton
          hotelId={hotelId}
          tableId={tableId}
          hasFloatingCart={cartItemCount > 0}
        />
      )}

      {modifierItem && (
        <ItemModifierSheet
          itemId={modifierItem.id}
          itemName={modifierItem.name}
          basePrice={modifierItem.price}
          onConfirm={handleModifierConfirm}
          onClose={() => setModifierItem(null)}
        />
      )}

      {detailItem && (
        <ItemDetailSheet
          item={{
            ...detailItem,
            imageUrl: detailItem.imageUrl || null,
            description: detailItem.description || null,
            descriptionAm: detailItem.descriptionAm || null,
            estimatedPrepTime: detailItem.estimatedPrepTime ?? null,
          }}
          cartQty={cart[detailItem.id]?.qty || 0}
          onAdd={() => handleAddItem(detailItem)}
          onRemove={() => updateCart(detailItem.id, -1)}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
