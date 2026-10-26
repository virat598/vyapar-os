"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { AlertCircle } from "lucide-react";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
}

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductOption[];
  selectedProduct?: ProductOption | null;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  onSuccess,
  products = [],
  selectedProduct,
}: StockAdjustmentModalProps) {
  const [productId, setProductId] = useState(selectedProduct?.id || (products[0]?.id || ""));
  const [adjustmentReason, setAdjustmentReason] = useState("Damaged Goods");
  const [direction, setDirection] = useState<"decrease" | "increase">("decrease");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProd = products.find((p) => p.id === (productId || selectedProduct?.id)) || selectedProduct;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeProdId = productId || selectedProduct?.id;
    if (!activeProdId) {
      setError("Please select a product");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    const signedQty = direction === "increase" ? qty : -qty;

    setLoading(true);

    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeProdId,
          adjustmentType: adjustmentReason,
          quantity: signedQty,
          notes: notes.trim() || `${adjustmentReason}: ${direction === "increase" ? "+" : "-"}${qty}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      subtitle="Records an auditable stock adjustment with balance tracking"
      maxWidth="md"
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
            Product *
          </label>
          <select
            value={productId || selectedProduct?.id}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Current: {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
          {currentProd && (
            <p className="mt-1 text-xs text-slate-500">
              Current Stock on Hand:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentProd.currentStock} {currentProd.unit}
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Action Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("decrease")}
              className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                direction === "decrease"
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Reduce Stock (-)
            </button>
            <button
              type="button"
              onClick={() => setDirection("increase")}
              className={`py-2 text-xs font-medium rounded-xl border transition-colors ${
                direction === "increase"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Add Stock (+)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason / Category
            </label>
            <select
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Damaged Goods">Damaged Goods / Leakage</option>
              <option value="Physical Count Variance">Physical Stock Count Difference</option>
              <option value="Expired Stock">Expired / Obsolete Stock</option>
              <option value="Return to Supplier">Return to Supplier</option>
              <option value="Sales Return">Customer Return</option>
              <option value="Internal Use">Sample / Internal Consumption</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Approver Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Approved during monthly audit"
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
            {loading ? "Adjusting..." : "Confirm Stock Adjustment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
