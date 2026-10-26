"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { formatINR, paiseToRupees, rupeesToPaise } from "@/lib/currency";
import { AlertCircle } from "lucide-react";

interface PartyOption {
  id: string;
  name: string;
  currentBalance: number; // in paise
}

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: "customer_receipt" | "supplier_payment";
  initialPartyId?: string;
  customers: PartyOption[];
  suppliers: PartyOption[];
}

export function NewPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "customer_receipt",
  initialPartyId,
  customers = [],
  suppliers = [],
}: NewPaymentModalProps) {
  const [paymentType, setPaymentType] = useState<"customer_receipt" | "supplier_payment">(initialType);
  const [partyId, setPartyId] = useState<string>("");
  const [amountRupees, setAmountRupees] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPaymentType(initialType);
  }, [initialType]);

  useEffect(() => {
    const list = paymentType === "customer_receipt" ? customers : suppliers;
    if (initialPartyId && list.some((p) => p.id === initialPartyId)) {
      setPartyId(initialPartyId);
      const sel = list.find((p) => p.id === initialPartyId);
      if (sel && sel.currentBalance > 0) {
        setAmountRupees(paiseToRupees(sel.currentBalance));
      }
    } else if (list.length > 0) {
      setPartyId(list[0].id);
      if (list[0].currentBalance > 0) {
        setAmountRupees(paiseToRupees(list[0].currentBalance));
      }
    } else {
      setPartyId("");
    }
  }, [paymentType, initialPartyId, customers, suppliers]);

  const activePartyList = paymentType === "customer_receipt" ? customers : suppliers;
  const selectedParty = activePartyList.find((p) => p.id === partyId);

  const handlePartyChange = (id: string) => {
    setPartyId(id);
    const sel = activePartyList.find((p) => p.id === id);
    if (sel && sel.currentBalance > 0) {
      setAmountRupees(paiseToRupees(sel.currentBalance));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partyId) {
      setError("Please select a party");
      return;
    }
    const paise = rupeesToPaise(amountRupees);
    if (!paise || paise <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType,
          partyId,
          amount: paise,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paymentType === "customer_receipt" ? "Receive Customer Payment (Jama)" : "Record Supplier Payment (Kharcha)"}
      subtitle="Updates ledger balance and records payment reference"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toggle Receipt vs Payment */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setPaymentType("customer_receipt")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              paymentType === "customer_receipt"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Customer Receipt (Inflow)
          </button>
          <button
            type="button"
            onClick={() => setPaymentType("supplier_payment")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              paymentType === "supplier_payment"
                ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Supplier Payment (Outflow)
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {paymentType === "customer_receipt" ? "Customer / Retailer *" : "Supplier / Vendor *"}
          </label>
          <select
            value={partyId}
            onChange={(e) => handlePartyChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            required
          >
            <option value="">-- Choose Party --</option>
            {activePartyList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.currentBalance > 0 ? `(${formatINR(p.currentBalance)})` : "(₹0)"}
              </option>
            ))}
          </select>
          {selectedParty && (
            <p className="mt-1 text-xs text-slate-500">
              Current Outstanding:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatINR(selectedParty.currentBalance)}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 5000"
              value={amountRupees || ""}
              onChange={(e) => setAmountRupees(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-semibold text-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference / UTR / Cheque No
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-98120391"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes / Remark
          </label>
          <input
            type="text"
            placeholder="e.g. Part payment against monthly bill"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
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
            {loading ? "Saving..." : "Save Payment Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
