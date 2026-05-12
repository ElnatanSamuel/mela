"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Power,
  Flame,
  Leaf,
  Star
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  nameAm: string | null;
  price: string;
  isAvailable: boolean;
  isSpicy: boolean;
  isVegetarian: boolean;
  isDailySpecial: boolean;
  categoryName?: string;
}

export default function MenuManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Fetch menu items
  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: async () => {
      // In a real app, this would be an API call
      // return fetch("/api/menu").then(res => res.json());
      return [
        {
          id: "1",
          name: "Special Beyaynetu",
          nameAm: "ልዩ በያይነቱ",
          price: "350.00",
          isAvailable: true,
          isSpicy: false,
          isVegetarian: true,
          isDailySpecial: true,
          categoryName: "Main Dishes"
        },
        {
          id: "2",
          name: "Doro Wat",
          nameAm: "ዶሮ ወጥ",
          price: "550.00",
          isAvailable: true,
          isSpicy: true,
          isVegetarian: false,
          isDailySpecial: false,
          categoryName: "Main Dishes"
        }
      ];
    },
  });

  // Toggle availability with optimistic update
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string, isAvailable: boolean }) => {
      // Simulated API call
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["menu-items"] });
      const previousItems = queryClient.getQueryData(["menu-items"]);
      queryClient.setQueryData(["menu-items"], (old: MenuItem[] | undefined) =>
        old?.map((item) =>
          item.id === variables.id ? { ...item, isAvailable: variables.isAvailable } : item
        )
      );
      return { previousItems };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["menu-items"], context?.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.nameAm && item.nameAm.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[#111111] p-4 rounded-xl border border-white/5">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Menu List */}
      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Item</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Attributes</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{item.name}</span>
                      <span className="text-xs text-neutral-500">{item.nameAm}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-neutral-400 bg-white/5 px-2 py-1 rounded">
                      {item.categoryName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium text-white">
                      {formatCurrency(item.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {item.isDailySpecial && <Star className="w-4 h-4 text-yellow-500" />}
                      {item.isSpicy && <Flame className="w-4 h-4 text-orange-500" />}
                      {item.isVegetarian && <Leaf className="w-4 h-4 text-green-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleMutation.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                      disabled={toggleMutation.isPending}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border transition-all duration-200",
                        item.isAvailable 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      <Power className="w-3 h-3" />
                      {item.isAvailable ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-neutral-400 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-neutral-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
