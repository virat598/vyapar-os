"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/currency";
import { Modal } from "@/components/common/Modal";
import { Plus, Search, Truck, DollarSign, Download, AlertCircle } from "lucide-react";

interface SuppliersViewProps {
  onPaySupplier: (supplierId: string) => void;
  onNewPurchase: () => void;
}

export function SuppliersView({ onPaySupplier, onNewPurchase }: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("Pune");
  const [address, setAddress] = useState("");
  const [openingBalanceRupees, setOpeningBalanceRupees] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadSuppliers = () => {
    setLoading(true);
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((json) => {
        setSuppliers(json.suppliers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Supplier name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          gstin: gstin.trim().toUpperCase() || undefined,
          city: city.trim(),
          address: address.trim() || undefined,
          currentBalance: Math.round(parseFloat(openingBalanceRupees || "0") * 100),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create supplier");

      setShowAddModal(false);
      setName("");
      setPhone("");
      setGstin("");
      loadSuppliers();
    } catch (err: any) {
      setFormError(err.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPayables = filtered.reduce((sum, s) => sum + Math.max(0, s.currentBalance), 0);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Suppliers & C&F Vendors
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vendor accounts, inward inventory supplies, and outstanding payable balances
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Suppliers Count</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{filtered.length}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Payable Balance</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatINR(totalPayables)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Suppliers with Due Payment</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {filtered.filter((s) => s.currentBalance > 0).length}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No suppliers found</p>
            <p className="mt-0.5">Click "Add Supplier" to record your procurement partners.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Contact & City</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Payable Balance (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {sup.name}
                      {sup.notes && (
                        <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{sup.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <p>{sup.phone || "No phone"}</p>
                      <p className="text-[11px] text-slate-400">{sup.city || "Pune"}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{sup.gstin || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatINR(sup.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sup.currentBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => onPaySupplier(sup.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg transition-colors"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Pay Supplier
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Supplier / C&F Vendor"
        subtitle="Record vendor contact details and opening payable balance"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-sm">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Parle Agro Regional Depot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone / Mobile
              </label>
              <input
                type="tel"
                placeholder="020 2687 4000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="Pune / Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="27AAACT2727Q1ZT"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opening Payable Balance (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={openingBalanceRupees}
                onChange={(e) => setOpeningBalanceRupees(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dispatch Terms / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 15-day payment cycle, free delivery above 50 cases"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
