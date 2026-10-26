"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/currency";
import { BarChart3, TrendingUp, DollarSign, Boxes, CreditCard, Printer, CheckCircle } from "lucide-react";

export function ReportsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
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
    return <div className="p-8 text-center text-xs text-slate-400">Compiling financial reports...</div>;
  }

  const pl = data?.profitLoss || {};
  const stock = data?.stockValuation || {};
  const rec = data?.receivables || {};
  const pay = data?.payables || {};

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Financial & Inventory Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified Profit & Loss statements, godown asset valuation, and balance aging
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Print Statement
        </button>
      </div>

      {/* P&L Statement Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Profit & Loss Statement (P&L)
              </h3>
              <p className="text-xs text-slate-500">Authorized accounting ledger estimate</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full">
            Gross Margin: {pl.grossMarginPercent}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          {/* Revenue & COGS */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Revenue & Direct Cost of Goods
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Total Billed Sales Revenue (Inc. GST)</span>
                <span className="font-mono font-medium">{formatINR(pl.totalSalesRevenue)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Net Sales Revenue (Excl. GST)</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatINR(pl.netSalesExTax)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                <span>(-) Cost of Goods Sold (COGS at Purchase Cost)</span>
                <span className="font-mono font-medium">-{formatINR(pl.estimatedCogs)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                <span>(=) Gross Profit</span>
                <span className="font-mono">{formatINR(pl.grossProfit)}</span>
              </div>
            </div>
          </div>

          {/* Operating Overheads & Net Profit */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Operating Expenses & Net Margin
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                <span>(-) Total Shop Overheads & Freight</span>
                <span className="font-mono font-medium">-{formatINR(pl.totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">GST Output Tax Collected</span>
                <span className="font-mono text-slate-500">{formatINR(pl.taxCollected)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 dark:border-slate-700 font-black text-slate-900 dark:text-white text-base">
                <span>(=) Estimated Net Operating Income</span>
                <span className={pl.netOperatingProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {formatINR(pl.netOperatingProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Valuation & Receivables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Stock Asset Valuation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Inventory Valuation Breakdown
              </h3>
            </div>
            <span className="text-xs font-bold text-purple-600 font-mono">
              Asset Value: {formatINR(stock.totalStockCostValue)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-xl text-xs">
              <span className="text-slate-500 block">Total Units in Godown</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {stock.totalStockUnits?.toLocaleString("en-IN")} units
              </span>
            </div>
            <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-xl text-xs">
              <span className="text-slate-500 block">Potential Sales Value</span>
              <span className="font-bold text-sm text-emerald-600">
                {formatINR(stock.totalStockSalesValue)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Valuation by Category
            </h4>
            {(stock.categoryBreakdown || []).map((cat: any, i: number) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {cat.units} units • {formatINR(cat.costValue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Receivables & Credit Limit Warning */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Market Receivables Risk
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-600 font-mono">
              Total Baqaya: {formatINR(rec.totalReceivables)}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            Retailers with the highest outstanding market balances:
          </p>

          <div className="space-y-2 text-xs">
            {(rec.topDebtors || []).map((deb: any) => (
              <div
                key={deb.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {deb.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Credit Limit: {formatINR(deb.creditLimit)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-600 block">
                    {formatINR(deb.currentBalance)}
                  </span>
                  {deb.currentBalance > deb.creditLimit && (
                    <span className="text-[10px] text-rose-600 font-semibold">Exceeded Limit</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
