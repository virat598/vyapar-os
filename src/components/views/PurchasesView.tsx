"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/currency";
import { PaymentStatusBadge } from "@/components/common/Badge";
import { Plus, Search, Truck, DollarSign } from "lucide-react";

interface PurchasesViewProps {
  onOpenNewPurchase: () => void;
  onOpenNewPayment: (type?: "customer_receipt" | "supplier_payment", partyId?: string) => void;
}

export function PurchasesView({ onOpenNewPurchase, onOpenNewPayment }: PurchasesViewProps) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPurchases = () => {
    setLoading(true);
    fetch("/api/purchases")
      .then((res) => res.json())
      .then((json) => {
        setPurchases(json.purchases || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const filtered = purchases.filter(
    (p) =>
      p.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchasesVal = filtered.reduce((s, p) => s + p.grandTotal, 0);
  const totalPayableVal = filtered.reduce((s, p) => s + p.balanceAmount, 0);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Purchases & Inward Stock Bills
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log supplier purchases, receive godown inventory, and settle payables
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewPurchase}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Record Purchase & Receive Stock
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Bills</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{filtered.length}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Purchases</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatINR(totalPurchasesVal)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Paid to Suppliers</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(totalPurchasesVal - totalPayableVal)}
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Pending Payables</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatINR(totalPayableVal)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search bill number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading purchase bills...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No purchase bills recorded</p>
            <p className="mt-0.5">Click "Record Purchase" to add supplier stock inward.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Bill No</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Bill Date</th>
                  <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {pur.billNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {pur.supplierName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{pur.billDate}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(pur.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-600">
                      {formatINR(pur.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-600">
                      {formatINR(pur.balanceAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <PaymentStatusBadge status={pur.paymentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pur.balanceAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => onOpenNewPayment("supplier_payment", pur.supplierId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
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
    </div>
  );
}
