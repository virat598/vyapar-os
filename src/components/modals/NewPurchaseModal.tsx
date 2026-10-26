"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { paiseToRupees, rupeesToPaise } from "@/lib/currency";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  taxRate: number;
}

interface SupplierOption {
  id: string;
  name: string;
  currentBalance: number;
}

interface LineItem {
  productId: string;
  quantity: number;
  unitCostRupees: number;
  taxRate: number;
}

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductOption[];
  suppliers: SupplierOption[];
}

export function NewPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  products = [],
  suppliers = [],
}: NewPurchaseModalProps) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [billNumber, setBillNumber] = useState<string>("");
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", quantity: 1, unitCostRupees: 0, taxRate: 18 },
  ]);
  const [paidRupees, setPaidRupees] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        unitCostRupees: prod ? paiseToRupees(prod.costPrice) : 0,
        taxRate: prod ? prod.taxRate : 18,
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitCostRupees: 0, taxRate: 18 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCostRupees) || 0;
    const subtotal = qty * cost;
    const tax = (subtotal * (item.taxRate || 0)) / 100;
    const total = subtotal + tax;
    return { ...item, subtotal, tax, total };
  });

  const subtotalRupees = calculatedItems.reduce((s, i) => s + i.subtotal, 0);
  const taxRupees = calculatedItems.reduce((s, i) => s + i.tax, 0);
  const grandTotalRupees = subtotalRupees + taxRupees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }
    if (!billNumber.trim()) {
      setError("Please enter supplier bill/invoice number");
      return;
    }
    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      setError("Please select products and valid quantities for all rows");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        supplierId,
        billNumber: billNumber.trim(),
        billDate,
        dueDate: dueDate || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: rupeesToPaise(i.unitCostRupees),
          taxRate: Number(i.taxRate),
        })),
        paidAmount: rupeesToPaise(paidRupees),
        paymentMethod,
        paymentReference: paymentRef,
        notes,
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record purchase");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Purchase & Receive Stock"
      subtitle="Increments godown inventory stock and updates supplier payable balance"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier / C&F Agent *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Payable: ₹{(s.currentBalance / 100).toFixed(0)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Supplier Bill / Invoice No *
            </label>
            <input
              type="text"
              placeholder="e.g. TAT-2025-081"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bill Date
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        {/* Item Rows */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Received Products
            </label>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product Row
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {calculatedItems.map((item, idx) => (
              <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-12 sm:col-span-5">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                    required
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">Quantity</span>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Cost ₹"
                    value={item.unitCostRupees}
                    onChange={(e) => handleItemChange(idx, "unitCostRupees", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right"
                    required
                  />
                  <span className="block text-[10px] text-slate-400 text-right mt-0.5">Cost / unit</span>
                </div>

                <div className="col-span-3 sm:col-span-1">
                  <select
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(idx, "taxRate", Number(e.target.value))}
                    className="w-full px-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  <span className="block text-[10px] text-slate-400 text-center mt-0.5">GST</span>
                </div>

                <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 text-right">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{item.total.toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Payment to Supplier (Optional Advance/Full)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Paid Now ₹"
                value={paidRupees}
                onChange={(e) => setPaidRupees(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Payment reference (e.g. UTR / Cheque number)"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>₹{subtotalRupees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>GST Total:</span>
              <span>₹{taxRupees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white">Bill Grand Total:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                ₹{grandTotalRupees.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Remaining Payable to Supplier:</span>
              <span className="font-medium text-amber-600">
                ₹{Math.max(0, grandTotalRupees - paidRupees).toFixed(2)}
              </span>
            </div>
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
            {loading ? "Recording..." : "Record Inward Purchase"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
