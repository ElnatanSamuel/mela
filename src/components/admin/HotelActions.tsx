"use client";

import React, { useState, useEffect } from "react";
import { Plus, ExternalLink, Loader2, Edit2, Trash2, Globe, Building2, Image as ImageIcon, Percent } from "lucide-react";
import { createHotel, updateHotel, deleteHotel } from "@/lib/actions";
import { Modal } from "@/components/ui/Modal";

interface Hotel {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    phone: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    vatNumber: string | null;
    settings?: {
        vatRate: number;
        serviceChargeRate: number;
    };
}

export function HotelModal({ 
    isOpen, 
    onClose, 
    hotel 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    hotel?: Hotel | null;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(hotel?.name || "");
  const [slug, setSlug] = useState(hotel?.slug || "");

  useEffect(() => {
    if (hotel) {
        setName(hotel.name);
        setSlug(hotel.slug);
    } else {
        setName("");
        setSlug("");
    }
  }, [hotel]);

  // Auto-generate slug ONLY for new hotels
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
        alert(err.message);
    } finally {
        setLoading(false);
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={hotel ? "Hotel Configuration" : "Provision New Tenant"}
      description={hotel ? "Modify existing platform configuration" : "Deploy a new dedicated instance"}
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
          <div className="space-y-6">
              {/* Basic Info Group */}
              <div className="space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">Identity & Path</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Hotel Name</label>
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
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Slug {hotel && "(Read Only)"}</label>
                          <input 
                              name="slug" 
                              required 
                              readOnly={!!hotel}
                              type="text" 
                              value={slug}
                              onChange={(e) => setSlug(e.target.value)}
                              placeholder="hilton-addis" 
                              className={`w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900 ${hotel ? 'bg-neutral-50 text-neutral-400 border-neutral-100' : ''}`} 
                          />
                      </div>
                  </div>
              </div>

              {/* Fiscal Config Group */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">Fiscal Configuration</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">VAT / TIN Number</label>
                        <input name="vatNumber" defaultValue={hotel?.vatNumber || ""} type="text" placeholder="123456789" className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">VAT Rate (e.g. 0.15)</label>
                            <input name="vatRate" defaultValue={hotel?.settings?.vatRate ?? 0.15} step="0.01" type="number" className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Srv Charge (e.g. 0.10)</label>
                            <input name="serviceChargeRate" defaultValue={hotel?.settings?.serviceChargeRate ?? 0.10} step="0.01" type="number" className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                        </div>
                    </div>
                  </div>
              </div>

              {/* Contact & Branding Group */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">Contact & Branding</h4>
                  <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Location</label>
                              <input name="location" defaultValue={hotel?.location || ""} type="text" placeholder="Addis Ababa" className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Phone</label>
                              <input name="phone" defaultValue={hotel?.phone || ""} type="text" placeholder="+251..." className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Logo URL</label>
                          <input name="logoUrl" defaultValue={hotel?.logoUrl || ""} type="url" placeholder="https://..." className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Banner URL</label>
                          <input name="bannerUrl" defaultValue={hotel?.bannerUrl || ""} type="url" placeholder="https://..." className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900" />
                      </div>
                  </div>
              </div>
          </div>

          <button 
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white py-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 sticky bottom-0 shadow-xl border-t border-black"
          >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : hotel ? "Save Configuration" : "Deploy Instance"}
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
        className="bg-neutral-900 text-white px-6 py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Onboard Hotel
      </button>
      <HotelModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export function HotelRowActions({ hotel }: { hotel: Hotel }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
      if (confirm(`Are you sure you want to decommission ${hotel.name}?`)) {
          setLoading(true);
          try {
              await deleteHotel(hotel.id);
          } catch (err: any) {
              alert(err.message);
          } finally {
              setLoading(false);
          }
      }
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => window.open(`/guest/${hotel.slug}/default`, '_blank')}
        className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-[4px] text-neutral-400 hover:text-neutral-900 hover:border-neutral-900 transition-all group"
        title="Live Preview"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>

      <button 
        onClick={() => setIsEditOpen(true)}
        className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-[4px] text-neutral-400 hover:text-neutral-900 hover:border-neutral-900 transition-all group"
        title="Configuration"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      
      <button 
        onClick={handleDelete}
        disabled={loading}
        className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-[4px] text-red-300 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all group"
        title="Decommission Tenant"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>

      <HotelModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        hotel={hotel} 
      />
    </div>
  );
}
