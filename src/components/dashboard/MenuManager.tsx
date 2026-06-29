"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  Power,
  Loader2,
  Settings2,
  Image as ImageIcon,
  Save,
  Clock,
  Archive,
  FileText,
  Edit2,
  Trash2,
} from "lucide-react";
import MenuManagerSkeleton from "./MenuManagerSkeleton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import ActionMenu from "@/components/ui/ActionMenu";
import { useToastStore } from "@/lib/toast-store";

interface MenuVersion {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  publishedAt: string | null;
}

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
  categoryId: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
}

export default function MenuManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState("");

  // Fetch items, categories, and current user role
  const { data: menuItems = [], isLoading: itemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu");
      return res.json();
    },
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: authInfo, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/debug");
      return res.json();
    },
  });

  const userRole = authInfo?.role?.role || "waiter";
  const isManager = ["owner", "manager", "platform_admin"].includes(userRole);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    nameAm: "",
    price: "",
    categoryId: "",
    description: "",
    descriptionAm: "",
    estimatedPrepTime: "",
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    isDailySpecial: false,
    imageUrl: "",
  });

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { data, error } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file);
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("menu-images").getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, imageUrl: publicUrl }));
    } catch (err) {
      console.error("Upload error:", err);
      addToast("Upload failed. Make sure 'menu-images' bucket exists and is public.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setIsDeleteModalOpen(false);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingItem ? `/api/menu/${editingItem.id}` : "/api/menu";
      const method = editingItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      closeModal();
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const { data: versions = [] } = useQuery<MenuVersion[]>({
    queryKey: ["menu-versions"],
    queryFn: () => fetch("/api/menu/versions").then((r) => r.json()),
  });

  const saveVersionMutation = useMutation({
    mutationFn: async ({
      name,
      status,
    }: {
      name: string;
      status: "draft" | "published";
    }) => {
      const res = await fetch("/api/menu/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status }),
      });
      if (!res.ok) throw new Error("Failed to save version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-versions"] });
    },
  });

  const openModal = (item?: MenuItem) => {
    if (!isManager) return;
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        nameAm: item.nameAm || "",
        price: item.price,
        categoryId: item.categoryId,
        description: (item as any).description || "",
        descriptionAm: (item as any).descriptionAm || "",
        estimatedPrepTime: (item as any).estimatedPrepTime?.toString() || "",
        isAvailable: item.isAvailable,
        isSpicy: item.isSpicy,
        isVegetarian: item.isVegetarian,
        isDailySpecial: item.isDailySpecial,
        imageUrl: item.imageUrl || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        nameAm: "",
        price: "",
        categoryId: categories[0]?.id || "",
        description: "",
        descriptionAm: "",
        estimatedPrepTime: "",
        isAvailable: true,
        isSpicy: false,
        isVegetarian: false,
        isDailySpecial: false,
        imageUrl: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  if (itemsLoading || catsLoading || authLoading) return <MenuManagerSkeleton />;

  const filteredItems = menuItems.filter(
    (item) =>
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameAm && item.nameAm.includes(search))) &&
      (activeCategory === "all" || item.categoryId === activeCategory),
  );

  const groupedItems = categories
    .map((cat) => ({
      ...cat,
      items: filteredItems.filter((item) => item.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0 || activeCategory === group.id);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Search Header */}
      <div className="bg-card p-4 rounded-[6px] border border-border shadow-sm dark:shadow-black/10 sticky top-[5px] z-20 flex items-center justify-between gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded-[6px] py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-foreground transition-all text-foreground"
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="bg-card border border-border rounded-[6px] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-foreground appearance-none min-w-[140px] text-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          
          {isManager && (
            <>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-2.5 bg-card border border-border rounded-[6px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                title="Edit Categories"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => openModal()}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Dish
              </button>
              <div className="w-px h-8 bg-border" />
              <button
                onClick={() => saveVersionMutation.mutate({ name: `Draft ${new Date().toLocaleDateString()}`, status: "draft" })}
                disabled={saveVersionMutation.isPending}
                className="px-4 py-2.5 bg-card border border-border rounded-[6px] text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all flex items-center gap-2"
              >
                {saveVersionMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Draft
              </button>
              <button
                onClick={() => saveVersionMutation.mutate({ name: `v${versions.length + 1}`, status: "published" })}
                disabled={saveVersionMutation.isPending}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg"
              >
                {saveVersionMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                Publish
              </button>
              <button
                onClick={() => setIsVersionModalOpen(true)}
                className="p-2.5 bg-card border border-border rounded-[6px] text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all"
                title="Version History"
              >
                <Clock className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Categorized Content */}
      <div className="space-y-16">
        {groupedItems.map((group) => (
          <section key={group.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter shrink-0">
                {group.name}
              </h2>
              <div className="h-[2px] bg-border flex-1" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                {group.items.length} Items
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-[6px] p-4 flex items-center justify-between hover:border-muted-foreground/30 transition-all group shadow-sm dark:shadow-black/10"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-16 h-16 bg-muted rounded-[6px] overflow-hidden shrink-0 border border-border">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h3 className="text-base text-foreground tracking-tighter uppercase font-bold truncate leading-none mb-1.5">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-foreground tracking-tighter">
                          {formatCurrency(item.price)}
                        </span>
                        {!item.isAvailable && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <button
                      disabled={!isManager}
                      onClick={() => toggleMutation.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                        !isManager && "cursor-default opacity-80",
                        item.isAvailable ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100" : "bg-muted text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      <Power className="w-3 h-3" />
                      {item.isAvailable ? "Visible" : "Hidden"}
                    </button>

                    {isManager && (
                      <div className="flex items-center gap-1 border-l border-border pl-4">
                        <ActionMenu
                          actions={[
                            { label: "Edit", icon: <Edit2 className="w-3.5 h-3.5" />, onClick: () => openModal(item) },
                            { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => { setItemToDelete(item); setIsDeleteModalOpen(true); }, danger: true },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Category Management Modal */}
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)}
        title="Categories"
        description="Organize categories"
      >
        <div className="space-y-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 bg-muted border border-border rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:border-foreground text-foreground"
            />
            <button
              onClick={() => addCategoryMutation.mutate(newCategoryName)}
              disabled={!newCategoryName || addCategoryMutation.isPending}
              className="bg-primary text-primary-foreground px-4 py-3 rounded-[6px] font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50"
            >
              {addCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex justify-between items-center p-4 bg-muted rounded-[6px] border border-border group hover:border-muted-foreground/30 transition-all"
              >
                <span className="font-bold text-foreground uppercase text-[10px] tracking-widest">{cat.name}</span>
                <button
                  onClick={() => setCatToDelete({ id: cat.id, name: cat.name })}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingItem ? "Edit Dish" : "New Dish"}
        description="Edit item details"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            upsertMutation.mutate(formData);
          }}
          className="space-y-6"
        >
          <div className="flex gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-24 h-24 shrink-0 bg-muted border-2 border-dashed border-border rounded-[6px] flex flex-col items-center justify-center cursor-pointer hover:border-foreground transition-all overflow-hidden",
                formData.imageUrl && "border-solid border-foreground",
              )}
            >
              {formData.imageUrl ? (
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Name</label>
                    <input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-muted border border-border rounded-[4px] px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-foreground uppercase text-foreground"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Price (ETB)</label>
                    <input
                        required
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-muted border border-border rounded-[4px] px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-foreground text-foreground"
                    />
                </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          
          <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-muted border border-border rounded-[4px] px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-foreground appearance-none uppercase text-foreground"
                >
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the dish..."
                  rows={2}
                  className="w-full bg-muted border border-border rounded-[4px] px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-foreground text-foreground resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Description (Amharic)</label>
                <textarea
                  value={formData.descriptionAm}
                  onChange={(e) => setFormData({ ...formData, descriptionAm: e.target.value })}
                  placeholder="Amharic description..."
                  rows={2}
                  className="w-full bg-muted border border-border rounded-[4px] px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-foreground text-foreground resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Prep Time (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedPrepTime}
                  onChange={(e) => setFormData({ ...formData, estimatedPrepTime: e.target.value })}
                  placeholder="e.g. 15"
                  className="w-full bg-muted border border-border rounded-[4px] px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-foreground text-foreground"
                />
              </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={upsertMutation.isPending || isUploading}
              className="flex-1 px-6 py-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-primary/90 shadow-lg flex justify-center items-center gap-2"
            >
              {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Version History"
        description="View saved menu versions"
      >
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                No versions saved yet
              </p>
            </div>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-4 bg-muted rounded-[6px] border border-border"
              >
                <div>
                  <p className="text-xs font-black text-foreground uppercase tracking-tight">
                    {v.name}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    {new Date(v.createdAt).toLocaleDateString()} at{" "}
                    {new Date(v.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                    v.status === "published" &&
                      "bg-emerald-50 text-emerald-600 border-emerald-100",
                    v.status === "draft" &&
                      "bg-amber-50 text-amber-600 border-amber-100",
                    v.status === "archived" &&
                      "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {v.status === "published" && <FileText className="w-3 h-3 inline mr-1" />}
                  {v.status === "draft" && <Save className="w-3 h-3 inline mr-1" />}
                  {v.status === "archived" && <Archive className="w-3 h-3 inline mr-1" />}
                  {v.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        description="This action cannot be undone"
      >
        <div className="text-center space-y-6">
          <p className="text-sm font-bold text-foreground uppercase tracking-tight">
            Delete "{itemToDelete?.name}"?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => deleteMutation.mutate(itemToDelete!.id)}
              disabled={deleteMutation.isPending}
              className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-red-700 transition-all flex justify-center items-center gap-2"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full py-4 border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={() => {
          if (catToDelete) {
            deleteCategoryMutation.mutate(catToDelete.id);
            setCatToDelete(null);
          }
        }}
        title="Delete Category"
        message={`Delete "${catToDelete?.name}" and all its items? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteCategoryMutation.isPending}
      />
    </div>
  );
}
