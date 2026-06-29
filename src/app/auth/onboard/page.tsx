"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  Settings,
  PartyPopper,
  Upload,
  X,
  Mail,
  Lock,
  MapPin,
  Phone,
  Globe,
  Percent,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Account", icon: User },
  { id: 2, label: "Hotel", icon: Building2 },
  { id: 3, label: "Preferences", icon: Settings },
  { id: 4, label: "Done", icon: PartyPopper },
];

const CURRENCIES = ["ETB", "USD", "EUR", "GBP", "KES", "UGX", "TZS", "RWF"];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [hotelName, setHotelName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [createdHotelName, setCreatedHotelName] = useState("");

  const [currency, setCurrency] = useState("ETB");
  const [vatRate, setVatRate] = useState("15");
  const [serviceChargeRate, setServiceChargeRate] = useState("10");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function navigate(to: number) {
    setDirection(to > step ? 1 : -1);
    setStep(to);
    setError(null);
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError("Full name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      setUserId(data.userId);
      navigate(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleHotelNameChange(value: string) {
    setHotelName(value);
    setSlug(slugify(value));
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function clearLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hotelName.trim()) { setError("Hotel name is required"); return; }

    setLoading(true);
    try {
      let finalLogoUrl = null;
      if (logoFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", logoFile);
        uploadForm.append("path", "logos");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || "Logo upload failed");
        }
        const { url } = await uploadRes.json();
        finalLogoUrl = url;
        setLogoUrl(url);
      }

      const res = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: hotelName,
          slug,
          location,
          phone,
          userId,
          fullName,
          logoUrl: finalLogoUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create hotel");
      }

      const hotel = await res.json();
      setHotelId(hotel.id);
      setCreatedHotelName(hotel.name);
      navigate(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const vat = parseFloat(vatRate);
    const sc = parseFloat(serviceChargeRate);
    if (isNaN(vat) || vat < 0) { setError("Invalid VAT rate"); return; }
    if (isNaN(sc) || sc < 0) { setError("Invalid service charge rate"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, vatRate, serviceChargeRate }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save preferences");
      }

      navigate(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-neutral-200 rounded-[6px] p-10 shadow-sm relative overflow-hidden">
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tighter uppercase">
              Mela
            </h1>
            <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
              Create Account
            </p>
          </div>

          <div className="flex items-center justify-center mb-10 overflow-x-auto px-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center shrink-0">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                    step === s.id && "bg-neutral-900 text-white",
                    step > s.id && "bg-emerald-500 text-white",
                    step < s.id && "bg-neutral-100 text-neutral-300"
                  )}
                >
                  {step > s.id ? (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    s.id
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider ml-1.5 hidden sm:block",
                    step === s.id && "text-neutral-900",
                    step > s.id && "text-emerald-600",
                    step < s.id && "text-neutral-300"
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-4 sm:w-8 h-[2px] mx-1 sm:mx-2",
                      step > s.id ? "bg-emerald-500" : "bg-neutral-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest p-4 rounded-[4px] flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 px-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Email
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="name@hotel.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neutral-900 text-white font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Hotel Name
                    </label>
                    <input
                      type="text"
                      required
                      value={hotelName}
                      onChange={(e) => handleHotelNameChange(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 px-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                      placeholder="Grand Palace Hotel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Slug
                    </label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(slugify(e.target.value))}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300 font-mono"
                        placeholder="grand-palace-hotel"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Location
                    </label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="Addis Ababa, Ethiopia"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Phone
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="+251 911 000 000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Logo
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-[4px] text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-all"
                      >
                        <Upload className="w-3 h-3" />
                        {logoPreview ? "Change" : "Upload"}
                      </button>
                      {logoPreview && (
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-12 h-12 object-contain rounded-[4px] border border-neutral-200"
                          />
                          <button
                            type="button"
                            onClick={clearLogo}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(1)}
                      className="flex-1 bg-neutral-100 text-neutral-600 font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-neutral-900 text-white font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleStep3} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 px-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      VAT Rate (%)
                    </label>
                    <div className="relative group">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        required
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Service Charge Rate (%)
                    </label>
                    <div className="relative group">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        required
                        value={serviceChargeRate}
                        onChange={(e) => setServiceChargeRate(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-[4px] py-4 pl-12 pr-4 text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all placeholder:text-neutral-300"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(2)}
                      className="flex-1 bg-neutral-100 text-neutral-600 font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-neutral-900 text-white font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {step === 4 && (
                <div className="text-center space-y-8">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <PartyPopper className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                      You're all set!
                    </h2>
                    <p className="text-neutral-500 text-sm mt-2 leading-relaxed">
                      <span className="font-bold text-neutral-900">{createdHotelName}</span> has been created and is pending approval.
                      An admin will review and activate it shortly. You'll be able to log in once approved.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-neutral-900 text-white font-black py-5 rounded-[4px] text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                  >
                    Go to Dashboard
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[9px] text-neutral-400 mt-2 uppercase tracking-widest font-bold">
                    Your menu won't be public until approved
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
