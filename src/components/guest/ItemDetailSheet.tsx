"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { X, Clock, Flame, Leaf, Plus, Minus, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface MenuItemDetail {
  id: string;
  name: string;
  nameAm: string | null;
  description: string | null;
  descriptionAm: string | null;
  price: string;
  imageUrl: string | null;
  isSpicy: boolean;
  isVegetarian: boolean;
  isDailySpecial: boolean;
  isAvailable: boolean;
  hasModifiers: boolean;
  estimatedPrepTime: number | null;
}

interface ItemDetailSheetProps {
  item: MenuItemDetail;
  cartQty: number;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function ItemDetailSheet({ item, cartQty, onAdd, onRemove, onClose }: ItemDetailSheetProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-lg rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Hero Image */}
        <div className="relative h-72 bg-stone-100 shrink-0">
          {item.imageUrl ? (
            <>
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
              <span className="text-stone-300 text-sm font-bold uppercase tracking-widest">No Image</span>
            </div>
          )}

          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-md rounded-lg flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* Tags */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {item.isDailySpecial && (
              <span className="bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                Special
              </span>
            )}
            {item.isVegetarian && (
              <span className="bg-green-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Veg
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3" /> Spicy
              </span>
            )}
          </div>

          {/* Price badge */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-stone-900 px-3 py-1.5 rounded-lg text-sm font-black shadow-md">
            {formatCurrency(item.price)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">{item.name}</h2>
              {item.nameAm && <p className="text-sm text-stone-300 mt-1">{item.nameAm}</p>}
            </div>
          </div>

          {item.estimatedPrepTime && (
            <div className="flex items-center gap-2 text-stone-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">~{item.estimatedPrepTime} min prep</span>
            </div>
          )}

          {(item.description || item.descriptionAm) && (
            <div className="space-y-2">
              {item.description && <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>}
              {item.descriptionAm && <p className="text-sm text-stone-400 leading-relaxed">{item.descriptionAm}</p>}
            </div>
          )}

          {!item.isAvailable && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-xs font-black text-red-500 uppercase tracking-widest">Currently Unavailable</p>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        {item.isAvailable && (
          <div className="border-t border-stone-100 p-6 shrink-0">
            {cartQty > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1.5">
                  <button onClick={onRemove} className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center active:scale-95 transition-transform shadow-sm hover:bg-stone-50">
                    <Minus className="w-4 h-4 text-stone-700" />
                  </button>
                  <span className="w-8 text-center text-lg font-black text-stone-900 tabular-nums">{cartQty}</span>
                  <button onClick={onAdd} className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center active:scale-95 transition-transform shadow-md hover:bg-stone-800">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={onClose} className="flex-1 bg-stone-900 text-white py-3.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md hover:bg-stone-800">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="tabular-nums">{formatCurrency((parseFloat(item.price) * cartQty).toString())}</span>
                </button>
              </div>
            ) : (
              <button onClick={onAdd} className="w-full bg-stone-900 text-white py-3.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md hover:bg-stone-800">
                <Plus className="w-4 h-4" />
                Add to Order — <span className="tabular-nums">{formatCurrency(item.price)}</span>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
