"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  LayoutDashboard,
  Image as ImageIcon,
  Upload,
  Eye,
  Settings,
  Edit2,
  Trash2,
} from "lucide-react";
import { createHotel, updateHotel, deleteHotel } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import ActionMenu from "@/components/ui/ActionMenu";
import { useToastStore } from "@/lib/toast-store";
import Link from "next/link";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  phone: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  vatNumber: string | null;
  subscriptionPlan?: string;
  subscriptionPlanId?: string | null;
  subscriptionExpiresAt?: Date | null;
  settings?: {
    vatRate: number;
    serviceChargeRate: number;
  };
}

export function HotelModal({
  isOpen,
  onClose,
  hotel,
}: {
  isOpen: boolean;
  onClose: () => void;
  hotel?: Hotel | null;
}) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();
  const [name, setName] = useState(hotel?.name || "");
  const [slug, setSlug] = useState(hotel?.slug || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(
    hotel?.logoUrl || null,
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    hotel?.bannerUrl || null,
  );

  useEffect(() => {
    if (hotel) {
      setName(hotel.name);
      setSlug(hotel.slug);
      setLogoPreview(hotel.logoUrl);
      setBannerPreview(hotel.bannerUrl);
    } else {
      setName("");
      setSlug("");
      setLogoPreview(null);
      setBannerPreview(null);
    }
  }, [hotel, isOpen]);

  useEffect(() => {
    if (!hotel && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generatedSlug);
    }
  }, [name, hotel]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (url: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (hotel) {
        await updateHotel(hotel.id, formData);
      } else {
        await createHotel(formData);
      }
      onClose();
    } catch (err: any) {
      addToast(err.message || "Failed to save hotel", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hotel ? "Edit Hotel" : "Add Hotel"}
      description={
        hotel
          ? "Update hotel settings"
          : "Create a new hotel"
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar"
      >
        <div className="space-y-6">
          {/* Identity Group */}
          <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                Name & Slug
              </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Hotel Name
                </label>
                <input
                  name="name"
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.G. HILTON ADDIS"
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Slug {hotel && "(Read Only)"}
                </label>
                <input
                  name="slug"
                  required
                  readOnly={!!hotel}
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="hilton-addis"
                  className={`w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900 ${hotel ? "bg-neutral-50 text-neutral-400 border-neutral-100" : ""}`}
                />
              </div>
            </div>
          </div>

          {!hotel && (
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-orange-500" />
                Admin Login
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300" />
                    <input
                      name="adminEmail"
                      required
                      type="email"
                      placeholder="manager@hotel.com"
                      className="w-full p-4 pl-11 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300" />
                    <input
                      name="adminPassword"
                      required
                      type="text"
                      placeholder="••••••••"
                      className="w-full p-4 pl-11 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Group */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                Images
              </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                  Hotel Logo
                </label>
                <div className="relative group aspect-square w-32 h-32 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[6px] flex flex-col items-center justify-center overflow-hidden hover:border-neutral-900 transition-all cursor-pointer">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
                      <span className="text-[8px] font-black uppercase text-neutral-400 mt-2">
                        Upload Logo
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    name="logoFile"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setLogoPreview)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                  Brand Banner
                </label>
                <div className="relative group aspect-video w-full h-32 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[6px] flex flex-col items-center justify-center overflow-hidden hover:border-neutral-900 transition-all cursor-pointer">
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
                      <span className="text-[8px] font-black uppercase text-neutral-400 mt-2">
                        Upload Banner
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    name="bannerFile"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setBannerPreview)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fiscal Config */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                Tax & Fees
              </h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Tax ID
                </label>
                <input
                  name="vatNumber"
                  defaultValue={hotel?.vatNumber || ""}
                  type="text"
                  placeholder="123456789"
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      VAT Rate
                    </label>
                  <input
                    name="vatRate"
                    defaultValue={hotel?.settings?.vatRate ?? 0.15}
                    step="0.01"
                    type="number"
                    className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Service Charge
                    </label>
                  <input
                    name="serviceChargeRate"
                    defaultValue={hotel?.settings?.serviceChargeRate ?? 0.1}
                    step="0.01"
                    type="number"
                    className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Access */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                Access
              </h4>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Expires On
                  </label>
                <input
                  name="subscriptionExpiresAt"
                  defaultValue={hotel?.subscriptionExpiresAt ? new Date(hotel.subscriptionExpiresAt).toISOString().split('T')[0] : ""}
                  type="date"
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                Contact
              </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Location
                </label>
                <input
                  name="location"
                  defaultValue={hotel?.location || ""}
                  type="text"
                  placeholder="Addis Ababa"
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Phone
                </label>
                <input
                  name="phone"
                  defaultValue={hotel?.phone || ""}
                  type="text"
                  placeholder="+251..."
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white py-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 sticky bottom-0 shadow-lg border-t border-black/20"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hotel ? (
            "Save Changes"
          ) : (
            "Create Hotel & Admin"
          )}
        </button>
      </form>
    </Modal>
  );
}

export function OnboardHotelButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-8 py-5 bg-neutral-900 text-white rounded-[8px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        Add Hotel
      </button>
      <HotelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export function HotelRowActions({ hotel }: { hotel: Hotel }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  async function handleDelete() {
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    setLoading(true);
    try {
      await deleteHotel(hotel.id);
      addToast(`${hotel.name} decommissioned`, "success");
      setShowDeleteConfirm(false);
    } catch (err: any) {
      addToast(err.message || "Failed to delete hotel", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/hotels/${hotel.id}`}
        className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-[4px] text-neutral-400 hover:text-neutral-900 hover:border-neutral-900 transition-all group"
        title="Details"
      >
        <Eye className="w-3.5 h-3.5" />
      </Link>

      <ActionMenu
        actions={[
          { label: "Preview", icon: <Eye className="w-3.5 h-3.5" />, onClick: () => window.open(`/guest/${hotel.slug}`, "_blank") },
          { label: "Edit", icon: <Edit2 className="w-3.5 h-3.5" />, onClick: () => setIsEditOpen(true) },
          { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: handleDelete, danger: true },
        ]}
      />

      <HotelModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        hotel={hotel}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Decommission Hotel"
        message={`Are you sure you want to decommission ${hotel.name}? This will remove all data.`}
        confirmLabel="Decommission"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}

export function HotelSettingsButton({ hotel }: { hotel: Hotel }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-4 bg-neutral-900/50 backdrop-blur-xl border border-white/10 text-white rounded-[8px] hover:bg-white hover:text-black transition-all"
      >
        <Settings className="w-4 h-4" />
      </button>
      <HotelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        hotel={hotel}
      />
    </>
  );
}
