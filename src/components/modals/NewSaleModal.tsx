"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { formatINR, paiseToRupees, rupeesToPaise } from "@/lib/currency";
import { Plus, Trash2, AlertCircle, CheckCircle, Calculator } from "lucide-react";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  sellingPrice: number; // paise
  costPrice: number;
  currentStock: number;
  taxRate: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
  currentBalance: number;
  creditLimit: number;
}

interface LineItem {
  productId: string;
  quantity: number;
  unitPriceRupees: number;
  taxRate: number;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
  products: ProductOption[];
  customers: CustomerOption[];
}

export function NewSaleModal({
  isOpen,
  onClose,
  onSuccess,
  products = [],
  customers = [],
}: NewSaleModalProps) {
  const [customerId, setCustomerId] = useState<string>("");
  const [customCustomerName, setCustomCustomerName] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", quantity: 1, unitPriceRupees: 0, taxRate: 18 },
  ]);
  const [discountRupees, setDiscountRupees] = useState<number>(0);
  const [paidRupees, setPaidRupees] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default customer
  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: prodId,
        unitPriceRupees: prod ? paiseToRupees(prod.sellingPrice) : 0,
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
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitPriceRupees: 0, taxRate: 18 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPriceRupees) || 0;
    const subtotal = qty * price;
    const tax = (subtotal * (item.taxRate || 0)) / 100;
    const total = subtotal + tax;
    const hasEnoughStock = prod ? prod.currentStock >= qty : true;
    return { ...item, prod, subtotal, tax, total, hasEnoughStock };
  });

  const subtotalRupees = calculatedItems.reduce((s, i) => s + i.subtotal, 0);
  const taxRupees = calculatedItems.reduce((s, i) => s + i.tax, 0);
  const grandTotalRupees = Math.max(0, subtotalRupees + taxRupees - (Number(discountRupees) || 0));

  const hasStockError = calculatedItems.some((i) => i.productId && !i.hasEnoughStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId && !customCustomerName.trim()) {
      setError("Please select or enter customer details");
      return;
    }

    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      setError("Please select products and valid quantities for all rows");
      return;
    }

    if (hasStockError) {
      setError("Insufficient stock for one or more items. Please adjust quantities.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerId: customerId === "NEW" ? undefined : customerId,
        customerName: customerId === "NEW" ? customCustomerName : undefined,
        invoiceDate,
        dueDate: dueDate || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: rupeesToPaise(i.unitPriceRupees),
          taxRate: Number(i.taxRate),
        })),
        discountTotal: rupeesToPaise(discountRupees),
        paidAmount: rupeesToPaise(paidRupees),
        paymentMethod,
        paymentReference: paymentRef,
        notes,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }

      onSuccess(data.invoiceId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Sale / Tax Invoice"
      subtitle="Generates scoped invoice, decrements stock on hand, and updates customer ledger"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer / Retailer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.currentBalance > 0 ? `(Baqaya: ₹${(c.currentBalance / 100).toFixed(0)})` : ""}
                </option>
              ))}
              <option value="NEW">+ Quick Cash / New Customer</option>
            </select>
          </div>

          {customerId === "NEW" && (
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                placeholder="Enter customer / shop name"
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date (Payment terms)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Line Items & Stock Verification
            </label>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Item
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {calculatedItems.map((item, idx) => (
              <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center text-xs">
                {/* Product Select */}
                <div className="col-span-12 sm:col-span-5">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                        {p.name} (Stock: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                  {item.prod && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                      <span className={item.hasEnoughStock ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 font-semibold"}>
                        Available: {item.prod.currentStock} {item.prod.unit}
                      </span>
                      {!item.hasEnoughStock && (
                        <span className="text-rose-600">⚠️ Insufficient stock</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
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
                  {item.prod && (
                    <span className="block text-[10px] text-slate-400 text-center mt-0.5">{item.prod.unit}</span>
                  )}
                </div>

                {/* Rate (₹) */}
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Rate ₹"
                    value={item.unitPriceRupees}
                    onChange={(e) => handleItemChange(idx, "unitPriceRupees", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right"
                    required
                  />
                  <span className="block text-[10px] text-slate-400 text-right mt-0.5">Rate / unit</span>
                </div>

                {/* Tax % */}
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

                {/* Row Total */}
                <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 text-right">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ₹{item.total.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      (Tax: ₹{item.tax.toFixed(2)})
                    </span>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Payment Settlement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">Amount Received Now (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={grandTotalRupees}
                  value={paidRupees}
                  onChange={(e) => setPaidRupees(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="upi">UPI (GPay / PhonePe / QR)</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaidRupees(grandTotalRupees)}
                className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
              >
                Full Paid (₹{grandTotalRupees.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setPaidRupees(0)}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200"
              >
                100% Credit (₹0)
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Payment Reference / UPI UTR / Cheque No"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Subtotal (Taxable):</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{subtotalRupees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>GST Total:</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{taxRupees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span>Special Discount (₹):</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountRupees}
                onChange={(e) => setDiscountRupees(Number(e.target.value))}
                className="w-24 px-2 py-1 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
              />
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="font-semibold text-slate-900 dark:text-white text-base">Grand Total:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xl">
                ₹{grandTotalRupees.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 text-slate-500">
              <span>Balance (Udhari/Receivable):</span>
              <span className="font-medium text-rose-600">
                ₹{Math.max(0, grandTotalRupees - paidRupees).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || hasStockError}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating Invoice..." : "Confirm & Create Invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
