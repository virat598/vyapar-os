"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { INDUSTRIES, IndustryType } from "@/lib/types";
import { AlertCircle, Building2, Check } from "lucide-react";

interface NewBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBusiness: any) => void;
}

export function NewBusinessModal({ isOpen, onClose, onSuccess }: NewBusinessModalProps) {
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [industry, setIndustry] = useState<IndustryType>("Distributors and wholesalers");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
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
          legalName: legalName.trim() || undefined,
          industry,
          gstin: gstin.trim().toUpperCase() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          invoicePrefix: invoicePrefix.trim().toUpperCase() || "INV-",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create business workspace");
      }

      onSuccess(data.business);
      onClose();
      // Reload window to re-render in the new business workspace
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create business workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Business Workspace"
      subtitle="Select an industry template to configure tailored categories, units, and billing workflows"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Choose Your Industry *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
            {INDUSTRIES.map((ind) => {
              const isSelected = industry === ind.id;
              return (
                <button
                  type="button"
                  key={ind.id}
                  onClick={() => {
                    setIndustry(ind.id);
                    // Helpful default prefix based on industry
                    if (ind.id === "Pharmacies") setInvoicePrefix("MED-");
                    else if (ind.id === "Grocery and general retail") setInvoicePrefix("RET-");
                    else if (ind.id === "FMCG distributors") setInvoicePrefix("FMCG-");
                    else setInvoicePrefix("INV-");
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{ind.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {ind.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Electricals & Wholesale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Legal Trade Name (for GST Invoices)
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Electricals Pvt Ltd"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              GSTIN (GST Identification Number)
            </label>
            <input
              type="text"
              placeholder="e.g. 27ABCDE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Invoice Prefix Code
            </label>
            <input
              type="text"
              placeholder="e.g. INV- or BILL-"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Primary City
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai, Pune, Delhi, Bangalore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs disabled:opacity-50"
          >
            {loading ? "Creating Workspace..." : "Create Business & Launch"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
