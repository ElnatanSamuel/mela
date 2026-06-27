"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Loader2,
  Percent,
  Image as ImageIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Combo {
  id: string;
  name: string;
  totalPrice: string;
  isAvailable: boolean;
  items: { menuItemId: string; quantity: number; name: string; price: string }[];
  savings: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: string;
}

export default function ComboManager() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: combos = [] } = useQuery<Combo[]>({
    queryKey: ["combos"],
    queryFn: () => fetch("/api/combos").then((r) => r.json()),
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: () => fetch("/api/menu").then((r) => r.json()),
  });

  const createComboMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, totalPrice, itemIds: selectedItems }),
      });
      if (!res.ok) throw new Error("Failed to create combo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos"] });
      setIsModalOpen(false);
      setName("");
      setTotalPrice("");
      setSelectedItems([]);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            Combo Deals
          </h3>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Save on meal bundles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          New Combo
        </button>
      </div>

      {combos.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-[6px]">
          <Percent className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No combos yet</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className="bg-card border border-border rounded-[6px] p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-black text-foreground uppercase tracking-tight">
                  {combo.name}
                </h4>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  {combo.items.length} items
                </span>
              </div>
              {combo.savings > 0 && (
                <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Save{" "}
                  {formatCurrency(combo.savings.toString())}
                </span>
              )}
            </div>

            <div className="space-y-1.5 mb-6">
              {combo.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-[10px] text-muted-foreground font-medium"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.price)}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-border flex justify-between">
                <span className="text-xs font-black text-foreground uppercase">
                  Bundle Price
                </span>
                <span className="text-sm font-black text-foreground">
                  {formatCurrency(combo.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Combo"
        description="Save on meal bundles"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createComboMutation.mutate();
          }}
          className="space-y-6"
        >
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
              Combo Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground uppercase"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
              Bundle Price (ETB)
            </label>
            <input
              required
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
              Items
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-border rounded-[6px] p-2">
              {menuItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded-[4px] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, item.id]);
                      } else {
                        setSelectedItems(
                          selectedItems.filter((id) => id !== item.id),
                        );
                      }
                    }}
                    className="accent-foreground"
                  />
                  <span className="text-xs font-bold">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground ml-auto">
                    {formatCurrency(item.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createComboMutation.isPending || selectedItems.length < 2}
            className="w-full bg-primary text-primary-foreground py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {createComboMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Create Combo"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
