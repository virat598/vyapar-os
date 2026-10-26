"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/currency";
import { Plus, Search, DollarSign, ArrowDownLeft, ArrowUpRight, CreditCard } from "lucide-react";

interface PaymentsViewProps {
  onOpenNewPayment: (type?: "customer_receipt" | "supplier_payment") => void;
}

export function PaymentsView({ onOpenNewPayment }: PaymentsViewProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadPayments = () => {
    setLoading(true);
    fetch("/api/payments")
      .then((res) => res.json())
      .then((json) => {
        setPayments(json.payments || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const matchesType = typeFilter === "all" || p.paymentType === typeFilter;
    const matchesSearch =
      p.partyName.toLowerCase().includes(search.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalReceipts = payments
    .filter((p) => p.paymentType === "customer_receipt")
    .reduce((s, p) => s + p.amount, 0);

  const totalDisbursements = payments
    .filter((p) => p.paymentType === "supplier_payment")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Payments & Roznamcha (Cash / Bank Ledger)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of customer collections (inflow) and supplier settlements (outflow)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNewPayment("customer_receipt")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Receive Payment (Jama)
          </button>
          <button
            type="button"
            onClick={() => onOpenNewPayment("supplier_payment")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Pay Supplier (Kharcha)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Customer Inflow (Jama)</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalReceipts)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Supplier Outflow (Nikasi)</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatINR(totalDisbursements)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Net Cash / Bank Inflow</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatINR(totalReceipts - totalDisbursements)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search party name or reference UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 text-xs rounded-xl font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            All Transactions
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("customer_receipt")}
            className={`px-3 py-1 text-xs rounded-xl font-medium transition-colors ${
              typeFilter === "customer_receipt"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Customer Receipts
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("supplier_payment")}
            className={`px-3 py-1 text-xs rounded-xl font-medium transition-colors ${
              typeFilter === "supplier_payment"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            Supplier Disbursements
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading payments ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No payment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => {
                  const isReceipt = p.paymentType === "customer_receipt";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 font-mono">{p.paymentDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {p.partyName}
                        {p.notes && <p className="text-[11px] text-slate-400 font-normal">{p.notes}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReceipt
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}
                        >
                          {isReceipt ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isReceipt ? "Receipt (Inflow)" : "Disbursement (Outflow)"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium uppercase text-slate-600 dark:text-slate-400">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNumber || "—"}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span className={isReceipt ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {formatINR(p.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.createdByName || "Staff"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
