"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { X, Check, Plus } from "lucide-react";

interface Modifier {
  id: string;
  name: string;
  nameAm: string | null;
  priceModifier: string;
  type: string;
}

interface ItemModifierSheetProps {
  itemId: string;
  itemName: string;
  basePrice: string;
  onConfirm: (selected: Modifier[], totalAddon: number) => void;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  size_upgrade: "Size",
  milk_substitute: "Milk",
  add_shot: "Extras",
  extra_topping: "Toppings",
  side: "Add Side",
};

export function ItemModifierSheet({
  itemId,
  itemName,
  basePrice,
  onConfirm,
  onClose,
}: ItemModifierSheetProps) {
  const [selected, setSelected] = useState<Modifier[]>([]);

  const { data: modifiers = [] } = useQuery<Modifier[]>({
    queryKey: ["modifiers", itemId],
    queryFn: async () => {
      const res = await fetch(`/api/menu-modifiers?menuItemId=${itemId}`);
      return res.json();
    },
  });

  const types = [...new Set(modifiers.map((m) => m.type))];

  const toggleModifier = (mod: Modifier) => {
    setSelected((prev) => {
      const exists = prev.find((m) => m.id === mod.id);
      if (exists) return prev.filter((m) => m.id !== mod.id);
      return [...prev, mod];
    });
  };

  const totalAddon = selected.reduce(
    (sum, m) => sum + parseFloat(m.priceModifier || "0"),
    0,
  );

  const totalPrice = parseFloat(basePrice) + totalAddon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center">
      <div className="bg-white w-full max-w-2xl rounded-t-[24px] p-8 pb-10 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tighter">
              Customize
            </h3>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
              {itemName}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
          {types.map((type) => (
            <div key={type}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">
                {typeLabels[type] || type}
              </h4>
              <div className="space-y-2">
                {modifiers
                  .filter((m) => m.type === type)
                  .map((mod) => {
                    const isSelected = selected.some((m) => m.id === mod.id);
                    const price = parseFloat(mod.priceModifier || "0");
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModifier(mod)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-[6px] border text-left transition-all",
                          isSelected
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-white border-white"
                                : "border-neutral-300",
                            )}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-neutral-900" />
                            )}
                          </div>
                          <span className="text-xs font-bold">
                            {mod.name}
                          </span>
                        </div>
                        {price > 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-black",
                              isSelected ? "text-white" : "text-neutral-500",
                            )}
                          >
                            +{formatCurrency(price.toString())}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-100 pt-6 mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Subtotal
            </span>
            <span className="text-base font-black text-neutral-900 tracking-tighter">
              {formatCurrency(basePrice)}
            </span>
          </div>
          {totalAddon > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Add-ons
              </span>
              <span className="text-sm font-black text-green-600 tracking-tighter">
                +{formatCurrency(totalAddon.toString())}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-900">
              Total
            </span>
            <span className="text-xl font-black text-neutral-900 tracking-tighter">
              {formatCurrency(totalPrice.toString())}
            </span>
          </div>
          <button
            onClick={() => onConfirm(selected, totalAddon)}
            className="w-full bg-neutral-900 text-white py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
