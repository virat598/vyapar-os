"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/common/StatCard";
import { formatINR, formatCompactINR } from "@/lib/currency";
import { PaymentStatusBadge, StockStatusBadge } from "@/components/common/Badge";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Boxes,
  Truck,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Printer,
  Sparkles,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";

interface DashboardViewProps {
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewPayment: (type?: "customer_receipt" | "supplier_payment", partyId?: string) => void;
  onOpenNewProduct: () => void;
  onOpenAiAssistant: () => void;
  onViewInvoice: (invoiceId: string) => void;
  onViewCustomerLedger: (customerId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export function DashboardView({
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewPayment,
  onOpenNewProduct,
  onOpenAiAssistant,
  onViewInvoice,
  onViewCustomerLedger,
  onNavigateTab,
}: DashboardViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const maxSales = Math.max(...(data?.salesTrend || []).map((d: any) => d.sales), 1);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-emerald-800 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl shadow-md">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Operations Live Hub
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Business Overview</h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5">
            Real-time sales, market receivables, and warehouse inventory tracking.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-transform active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Sale (Invoice)
          </button>
          <button
            type="button"
            onClick={() => onOpenNewPayment("customer_receipt")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs backdrop-blur-xs transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-300" /> Receive Payment
          </button>
          <button
            type="button"
            onClick={onOpenNewPurchase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs backdrop-blur-xs transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-300" /> Stock In (Purchase)
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Sales Revenue"
          value={formatCompactINR(m.totalSales)}
          subValue={`${formatINR(m.totalSales)} recorded`}
          icon={TrendingUp}
          iconColor="emerald"
          badgeText="Verified"
          badgeType="positive"
          onClick={() => onNavigateTab("sales")}
        />
        <StatCard
          title="Market Receivables (Baqaya)"
          value={formatCompactINR(m.totalReceivables)}
          subValue="Due from retailers"
          icon={CreditCard}
          iconColor="amber"
          badgeText={m.totalReceivables > 0 ? "Pending" : "Zero Due"}
          badgeType={m.totalReceivables > 0 ? "warning" : "positive"}
          onClick={() => onNavigateTab("customers")}
        />
        <StatCard
          title="Cash & UPI Collected"
          value={formatCompactINR(m.totalCollected)}
          subValue="Customer settlements"
          icon={DollarSign}
          iconColor="blue"
          badgeText="Inflow"
          badgeType="positive"
          onClick={() => onNavigateTab("payments")}
        />
        <StatCard
          title="Supplier Payables"
          value={formatCompactINR(m.totalPayables)}
          subValue="Bills to be paid"
          icon={Truck}
          iconColor="rose"
          badgeText={m.totalPayables > 0 ? "Payable" : "Clear"}
          badgeType="negative"
          onClick={() => onNavigateTab("suppliers")}
        />
        <StatCard
          title="Godown Stock Value"
          value={formatCompactINR(m.totalInventoryValue)}
          subValue={`${m.productsCount || 0} active SKUs`}
          icon={Boxes}
          iconColor="purple"
          badgeText={`${m.lowStockCount || 0} low stock`}
          badgeType={m.lowStockCount > 0 ? "warning" : "neutral"}
          onClick={() => onNavigateTab("products")}
        />
      </div>

      {/* Middle Section: Sales Trend & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales Trend Chart (Pure SVG / CSS Responsive) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Daily Sales Trend (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized invoice dispatch totals in Indian Rupees
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("sales")}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View Invoices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-4 flex items-end justify-between gap-2 h-48 border-b border-slate-100 dark:border-slate-800 pb-2">
            {(data?.salesTrend || []).map((day: any, i: number) => {
              const heightPercent = Math.max(12, Math.round((day.sales / maxSales) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCompactINR(day.sales)}
                  </div>
                  <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-36 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-linear-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-300 group-hover:from-emerald-500 group-hover:to-emerald-300"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
            <span>7-Day Total Dispatch Volume</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatINR((data?.salesTrend || []).reduce((s: number, d: any) => s + d.sales, 0))}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Stock Alerts</span>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full">
                {data?.lowStockItems?.length || 0} Critical
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Items below safety stock threshold. Reorder before stockouts occur.
            </p>

            <div className="space-y-2.5">
              {!data?.lowStockItems || data.lowStockItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ✅ All godown products are adequately stocked!
                </div>
              ) : (
                data.lowStockItems.map((prod: any) => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {prod.name}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">{prod.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 block">
                        {prod.currentStock} {prod.unit}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Min: {prod.minStockAlert}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={onOpenNewPurchase}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Order Inward Stock from Supplier
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Pending Collections & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Collections (Retailers with highest outstanding balances) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Pending Collections (Baqaya Ledger)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customers with overdue or highest outstanding receivables
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("customers")}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              All Retailers <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {!data?.pendingCollections || data.pendingCollections.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No outstanding customer balances pending.
              </div>
            ) : (
              data.pendingCollections.map((cust: any) => (
                <div
                  key={cust.id}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{cust.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      Limit: {formatINR(cust.creditLimit)} • {cust.phone || "No phone"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-rose-600 block">
                        {formatINR(cust.currentBalance)}
                      </span>
                      <span className="text-[10px] text-slate-400">Receivable</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewCustomerLedger(cust.id)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                      >
                        Khata
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenNewPayment("customer_receipt", cust.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Recent Business Transactions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited ledger entries across sales, purchases, and receipts
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("payments")}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {!data?.recentActivity || data.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent transactions recorded.
              </div>
            ) : (
              data.recentActivity.map((act: any) => {
                const isSale = act.type === "sale";
                const isPurchase = act.type === "purchase";
                const isReceipt = act.type === "receipt";

                return (
                  <div
                    key={act.id}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl ${
                          isSale
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : isPurchase
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                        }`}
                      >
                        {isSale ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : isPurchase ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{act.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {act.ref} • {act.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {formatINR(act.amount)}
                        </span>
                        <span className="text-[10px] capitalize text-slate-400">{act.status}</span>
                      </div>
                      {isSale && (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(act.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
