"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { X, Clock, Flame, Leaf, Plus, Minus, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-lg rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Hero Image */}
        <div className="relative h-64 bg-neutral-100 shrink-0">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-neutral-300 text-sm font-bold uppercase tracking-widest">No Image</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tags */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {item.isDailySpecial && (
              <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Today's Special
              </span>
            )}
            {item.isVegetarian && (
              <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Veg
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                <Flame className="w-3 h-3" /> Spicy
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name & Price */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
                {item.name}
              </h2>
              {item.nameAm && (
                <p className="text-xs text-neutral-400 font-bold mt-1">{item.nameAm}</p>
              )}
            </div>
            <span className="text-2xl font-black text-neutral-900 tracking-tighter shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>

          {/* Prep Time */}
          {item.estimatedPrepTime && (
            <div className="flex items-center gap-2 text-neutral-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                ~{item.estimatedPrepTime} min prep time
              </span>
            </div>
          )}

          {/* Description */}
          {(item.description || item.descriptionAm) && (
            <div className="space-y-2">
              {item.description && (
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.descriptionAm && (
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {item.descriptionAm}
                </p>
              )}
            </div>
          )}

          {/* Unavailable overlay */}
          {!item.isAvailable && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-xs font-black text-red-500 uppercase tracking-widest">
                Currently Unavailable
              </p>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        {item.isAvailable && (
          <div className="border-t border-neutral-100 p-6 shrink-0">
            {cartQty > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-neutral-100 rounded-full p-1.5">
                  <button
                    onClick={onRemove}
                    className="w-11 h-11 rounded-full bg-white border border-neutral-200 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                  >
                    <Minus className="w-4 h-4 text-neutral-700" />
                  </button>
                  <span className="w-8 text-center text-lg font-black text-neutral-900">
                    {cartQty}
                  </span>
                  <button
                    onClick={onAdd}
                    className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="flex-1 bg-neutral-900 text-white py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
                >
                  <ShoppingCart className="w-4 h-4" />
                  In Cart — {formatCurrency((parseFloat(item.price) * cartQty).toString())}
                </button>
              </div>
            ) : (
              <button
                onClick={onAdd}
                className="w-full bg-neutral-900 text-white py-4 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add to Order — {formatCurrency(item.price)}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
