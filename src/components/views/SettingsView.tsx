"use client";

import React, { useState } from "react";
import { UserSession } from "@/lib/types";
import { Settings, Building2, RotateCcw, Check, Sparkles } from "lucide-react";

interface SettingsViewProps {
  session: UserSession | null;
  onResetDemoData: () => void;
}

export function SettingsView({ session, onResetDemoData }: SettingsViewProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Business & Workspace Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Workspace profile, GSTIN configuration, invoice sequencing, and fiscal parameters
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Company Profile & Tax Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Business Name</label>
            <input
              type="text"
              readOnly
              value={session?.businessName || ""}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Role in Workspace</label>
            <input
              type="text"
              readOnly
              value={session?.role?.toUpperCase() || "OWNER"}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-emerald-600 uppercase"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Default Currency</label>
            <input
              type="text"
              readOnly
              value="INR (₹) — Indian Rupee"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value="Asia/Kolkata (IST +5:30)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Financial Year Cycle</label>
            <input
              type="text"
              readOnly
              value="April 1 to March 31 (Indian Fiscal Standard)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Invoice Prefix & Counter</label>
            <input
              type="text"
              readOnly
              value="Auto-incrementing scoped per business"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Demo Seed Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-emerald-600" />
          Demo Environment Reset
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Need to test the end-to-end wholesale workflow from a clean state or restore sample Indian FMCG data with Tata Salt, Fortune Oil, Kirana retailer ledgers, and supplier payables?
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reload Shree Krishna FMCG Demo Dataset
          </button>
        </div>
      </div>
    </div>
  );
}
