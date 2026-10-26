"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/currency";
import { StockStatusBadge } from "@/components/common/Badge";
import { Plus, Search, Boxes, Download, Upload, SlidersHorizontal, AlertTriangle } from "lucide-react";

interface ProductsViewProps {
  onOpenNewProduct: () => void;
  onOpenStockAdjustment: (product?: any) => void;
  onNavigateTab: (tab: any) => void;
}

export function ProductsView({
  onOpenNewProduct,
  onOpenStockAdjustment,
  onNavigateTab,
}: ProductsViewProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([prodData, catData]) => {
        setProducts(prodData.products || []);
        setCategories(catData.categories || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    const matchesCat = !selectedCat || p.categoryId === selectedCat;
    const matchesLowStock = !lowStockOnly || p.currentStock <= p.minStockAlert;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const totalStockUnits = filtered.reduce((s, p) => s + Math.max(0, p.currentStock), 0);
  const totalValuation = filtered.reduce(
    (s, p) => s + Math.max(0, p.currentStock) * p.costPrice,
    0
  );
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Stock & Inventory Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time godown balances, wholesale valuation, and minimum threshold alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab("import-export")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <a
            href="/api/import-export?type=products"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <button
            type="button"
            onClick={onOpenNewProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Mini KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total SKUs</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{products.length}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total Units in Godown</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">{totalStockUnits.toLocaleString("en-IN")}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Stock Valuation (Cost)</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalValuation)}</span>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Low Stock Alerts</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{lowStockCount} items</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-1.5 text-xs rounded-xl font-medium border transition-colors flex items-center gap-1.5 ${
            lowStockOnly
              ? "bg-amber-500 text-white border-amber-600"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Only ({lowStockCount})</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No products found</p>
            <p className="mt-0.5">Click "Add Product" or "Import CSV" to populate your inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Cost Price (₹)</th>
                  <th className="py-3 px-4 text-right">Sale Price (₹)</th>
                  <th className="py-3 px-4 text-center">GST</th>
                  <th className="py-3 px-4 text-center">Stock on Hand</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {prod.sku}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs">
                      <p className="line-clamp-1">{prod.name}</p>
                      {prod.barcode && (
                        <span className="text-[10px] text-slate-400 font-mono">EAN: {prod.barcode}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{prod.categoryName || "General"}</td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">{prod.unit}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {(prod.costPrice / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {(prod.sellingPrice / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">{prod.taxRate}%</td>
                    <td className="py-3 px-4 text-center">
                      <StockStatusBadge stock={prod.currentStock} alertThreshold={prod.minStockAlert} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenStockAdjustment(prod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <SlidersHorizontal className="w-3 h-3" /> Adjust Stock
                      </button>
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
