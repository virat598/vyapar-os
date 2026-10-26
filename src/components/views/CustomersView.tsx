"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/currency";
import { Modal } from "@/components/common/Modal";
import { Plus, Search, Users, DollarSign, BookOpen, Download, AlertCircle } from "lucide-react";

interface CustomersViewProps {
  onViewLedger: (customerId: string) => void;
  onReceivePayment: (customerId: string) => void;
}

export function CustomersView({ onViewLedger, onReceivePayment }: CustomersViewProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [city, setCity] = useState("Pune");
  const [creditLimitRupees, setCreditLimitRupees] = useState("50000");
  const [openingBalanceRupees, setOpeningBalanceRupees] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCustomers = () => {
    setLoading(true);
    fetch("/api/customers")
      .then((res) => res.json())
      .then((json) => {
        setCustomers(json.customers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Customer name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          gstin: gstin.trim().toUpperCase() || undefined,
          city: city.trim(),
          creditLimit: Math.round(parseFloat(creditLimitRupees || "0") * 100),
          openingBalance: Math.round(parseFloat(openingBalanceRupees || "0") * 100),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      setShowAddModal(false);
      setName("");
      setPhone("");
      setGstin("");
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  const totalReceivables = filtered.reduce((s, c) => s + Math.max(0, c.currentBalance), 0);
  const totalCreditLimit = filtered.reduce((s, c) => s + c.creditLimit, 0);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Retailers & Customer Khata
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customer directory, credit limits, Jama-Khata running ledgers, and payment reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/import-export?type=customers"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Retailer / Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Customers</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{filtered.length}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Receivables (Baqaya)</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatINR(totalReceivables)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Credit Line Offered</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatINR(totalCreditLimit)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Customers with Due Balance</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {filtered.filter((c) => c.currentBalance > 0).length} parties
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No customers found</p>
            <p className="mt-0.5">Click "Add Customer" to start your customer ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer / Shop Name</th>
                  <th className="py-3 px-4">Contact & City</th>
                  <th className="py-3 px-4">GSTIN</th>
                  <th className="py-3 px-4 text-right">Credit Limit (₹)</th>
                  <th className="py-3 px-4 text-right">Current Balance (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((cust) => {
                  const hasDue = cust.currentBalance > 0;
                  const isNearLimit = cust.currentBalance >= cust.creditLimit * 0.85;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {cust.name}
                        {isNearLimit && (
                          <span className="ml-2 text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.5 rounded-md font-bold">
                            Near Limit
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <p>{cust.phone || "No mobile"}</p>
                        <p className="text-[11px] text-slate-400">{cust.city || "Pune"}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{cust.gstin || "—"}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatINR(cust.creditLimit, false)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={hasDue ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}>
                          {formatINR(cust.currentBalance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewLedger(cust.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Khata
                          </button>
                          {hasDue && (
                            <button
                              type="button"
                              onClick={() => onReceivePayment(cust.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg transition-colors"
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Collect
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Customer / Retailer"
        subtitle="Track billing, credit limit terms, and Jama-Khata accounts"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-sm">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer / Shop Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Mahavir Provisions & Kirana"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 98220 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                City / Town
              </label>
              <input
                type="text"
                placeholder="e.g. Pune"
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
                placeholder="27ABCDE1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                placeholder="50000"
                value={creditLimitRupees}
                onChange={(e) => setCreditLimitRupees(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Opening Balance (₹)
            </label>
            <input
              type="number"
              placeholder="0"
              value={openingBalanceRupees}
              onChange={(e) => setOpeningBalanceRupees(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-medium"
            />
            <span className="block text-[11px] text-slate-400 mt-0.5">
              Enter existing receivable balance if migrating accounts.
            </span>
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
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
