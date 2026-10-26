"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { rupeesToPaise } from "@/lib/currency";
import { GST_RATES, UNITS } from "@/lib/types";
import { AlertCircle } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
}

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryOption[];
}

export function NewProductModal({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
}: NewProductModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [costPriceRupees, setCostPriceRupees] = useState("");
  const [sellingPriceRupees, setSellingPriceRupees] = useState("");
  const [mrpRupees, setMrpRupees] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [hsnCode, setHsnCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [minStockAlert, setMinStockAlert] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!sku.trim()) {
      setError("SKU code is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          categoryId: categoryId || undefined,
          unit,
          costPrice: rupeesToPaise(costPriceRupees || "0"),
          sellingPrice: rupeesToPaise(sellingPriceRupees || "0"),
          mrp: mrpRupees ? rupeesToPaise(mrpRupees) : undefined,
          taxRate: Number(taxRate),
          hsnCode: hsnCode.trim() || undefined,
          barcode: barcode.trim() || undefined,
          initialStock: Number(initialStock) || 0,
          minStockAlert: Number(minStockAlert) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product / Item"
      subtitle="Configure SKU, GST tax slab, opening godown stock, and alert thresholds"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Fortune Sunlite Refined Sunflower Oil (1L Pouch)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              SKU / Item Code *
            </label>
            <input
              type="text"
              placeholder="e.g. FORT-OIL-1L"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Primary Unit of Measure
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              GST Tax Slab (%)
            </label>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}% GST {rate === 0 ? "(Exempt)" : rate === 5 ? "(Standard Low)" : rate === 18 ? "(Standard)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cost Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 124.00"
              value={costPriceRupees}
              onChange={(e) => setCostPriceRupees(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-medium"
              required
            />
            <span className="block text-[10px] text-slate-400 mt-0.5 text-right">Wholesale purchase cost</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 142.00"
              value={sellingPriceRupees}
              onChange={(e) => setSellingPriceRupees(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-medium text-emerald-600"
              required
            />
            <span className="block text-[10px] text-slate-400 mt-0.5 text-right">Standard sale price</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              MRP (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 155.00"
              value={mrpRupees}
              onChange={(e) => setMrpRupees(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right"
            />
            <span className="block text-[10px] text-slate-400 mt-0.5 text-right">Printed package MRP</span>
          </div>
        </div>

        {/* Stock & Compliance */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Opening Stock
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Low Stock Alert
            </label>
            <input
              type="number"
              min="1"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              HSN Code
            </label>
            <input
              type="text"
              placeholder="e.g. 151219"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Barcode / EAN
            </label>
            <input
              type="text"
              placeholder="e.g. 8901030383121"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
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
            {loading ? "Saving..." : "Save Product to Inventory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
