"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { formatINR } from "@/lib/currency";
import { MessageCircle, DollarSign, AlertCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onReceivePaymentClick?: (customerId: string) => void;
}

export function LedgerModal({
  isOpen,
  onClose,
  customerId,
  onReceivePaymentClick,
}: LedgerModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !customerId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/customers/${customerId}/ledger`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customer ledger");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleWhatsAppReminder = () => {
    if (!data) return;
    const cust = data.customer;
    const biz = data.business;
    const balance = formatINR(cust.currentBalance);
    const msg = encodeURIComponent(
      `Namaste ${cust.name},\n\nThis is a friendly ledger statement from *${biz.name}*.\n\nYour current outstanding balance (Baqaya) is *${balance}*.\n\nPlease arrange for settlement at your earliest convenience. Thank you!`
    );
    const phone = cust.phone?.replace(/[^0-9]/g, "") || "";
    window.open(`https://wa.me/${phone ? "91" + phone.slice(-10) : ""}?text=${msg}`, "_blank");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Ledger (Jama-Khata)"
      subtitle={data?.customer ? `${data.customer.name} • Running Balance Statement` : "Loading..."}
      maxWidth="3xl"
    >
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Calculating running balance...</p>
        </div>
      ) : error || !data ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Could not load ledger"}</span>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          {/* Top Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Current Outstanding Balance (Baqaya)
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {formatINR(data.customer.currentBalance)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Credit Limit: <span className="font-medium text-slate-700 dark:text-slate-300">{formatINR(data.customer.creditLimit)}</span>
                {data.customer.gstin && ` • GSTIN: ${data.customer.gstin}`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppReminder}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Send WhatsApp Reminder
              </button>
              {onReceivePaymentClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReceivePaymentClick(data.customer.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  <DollarSign className="w-4 h-4" /> Receive Payment
                </button>
              )}
            </div>
          </div>

          {/* Statement Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 grid grid-cols-12 gap-2 uppercase">
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Particulars & Ref</div>
              <div className="col-span-2 text-right">Debit (₹)</div>
              <div className="col-span-2 text-right">Credit (₹)</div>
              <div className="col-span-2 text-right">Balance (₹)</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {data.ledger.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No recorded transactions for this customer yet.
                </div>
              ) : (
                data.ledger.map((row: any) => (
                  <div key={row.id} className="px-4 py-2.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="col-span-2 text-slate-600 dark:text-slate-400 font-mono">
                      {row.date}
                    </div>
                    <div className="col-span-4">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                        {row.type === "INVOICE" ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span>{row.reference}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{row.description}</span>
                    </div>
                    <div className="col-span-2 text-right font-mono font-medium text-slate-900 dark:text-white">
                      {row.debit > 0 ? (row.debit / 100).toFixed(2) : "—"}
                    </div>
                    <div className="col-span-2 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {row.credit > 0 ? (row.credit / 100).toFixed(2) : "—"}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {(row.runningBalance / 100).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
