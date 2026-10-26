"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { INDUSTRIES, IndustryType } from "@/lib/types";
import { Check, Sparkles, Building2, AlertCircle, ArrowRight } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onComplete: (business: any) => void;
}

export function OnboardingModal({ isOpen, onClose, userName, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [industry, setIndustry] = useState<IndustryType>("Distributors and wholesalers");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [financialYearStart] = useState("04-01");
  const [currency] = useState("INR");
  const [timezone] = useState("Asia/Kolkata");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Business workspace name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          legalName: legalName.trim() || name.trim(),
          industry,
          gstin: gstin.trim().toUpperCase() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim() || undefined,
          invoicePrefix: invoicePrefix.trim().toUpperCase() || "INV-",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create workspace");

      onComplete(data.business);
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to VyaparOS Bharat"
      subtitle={`Namaste ${userName || "Trader"}! Let's set up your business workspace`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1 rounded-xl font-bold transition-colors ${
              step === 1 ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
            }`}
          >
            1. Select Industry Template
          </button>
          <span className="text-slate-300">→</span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1 rounded-xl font-bold transition-colors ${
              step === 2 ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
            }`}
          >
            2. Business & Tax Details
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-slate-500">
              Select your primary line of business to pre-configure tax slabs, units, and inventory categories:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-2xl">
              {INDUSTRIES.map((ind) => {
                const isSelected = industry === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => {
                      setIndustry(ind.id);
                      if (ind.id === "FMCG distributors") setInvoicePrefix("FMCG-");
                      else if (ind.id === "Grocery and general retail") setInvoicePrefix("RET-");
                      else if (ind.id === "Pharmacies") setInvoicePrefix("MED-");
                      else setInvoicePrefix("INV-");
                    }}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{ind.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ind.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
              >
                Continue to Business Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Business / Trading Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shree Ganesh FMCG Wholesale"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  GSTIN (15 Digit Number)
                </label>
                <input
                  type="text"
                  placeholder="27ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  placeholder="INV-"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Primary Mobile / Phone
                </label>
                <input
                  type="tel"
                  placeholder="98220 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  City & State
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Default Parameters */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
              <div>
                <span className="block font-medium text-slate-700 dark:text-slate-300">Currency</span>
                <span>{currency} (₹)</span>
              </div>
              <div>
                <span className="block font-medium text-slate-700 dark:text-slate-300">Timezone</span>
                <span>{timezone}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-700 dark:text-slate-300">Fiscal Year</span>
                <span>Apr 1 – Mar 31</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
              >
                {loading ? "Configuring Workspace..." : "Complete Setup & Launch Workspace"}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
