"use client";

import React, { useState } from "react";
import { UserSession } from "@/lib/types";
import { Building2, ShieldCheck, User, LogOut } from "lucide-react";

interface SettingsViewProps {
  session: UserSession | null;
  onSignOut?: () => void;
}

export function SettingsView({ session, onSignOut }: SettingsViewProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Business & Workspace Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Workspace profile, tax parameters, invoice sequencing, and fiscal year rules
        </p>
      </div>

      {/* Company Profile Card */}
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Your Role in Workspace</label>
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Timezone</label>
            <input
              type="text"
              readOnly
              value="Asia/Kolkata (IST +5:30)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Financial Year Cycle</label>
            <input
              type="text"
              readOnly
              value="April 1 to March 31 (Indian Fiscal Standard)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Invoice Prefix & Sequencing</label>
            <input
              type="text"
              readOnly
              value="Scoped per workspace (Auto-incrementing)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* User Account & Security Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          Active Account & Security
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{session?.name}</p>
            <p className="text-xs text-slate-500">{session?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Role: {session?.role}
            </span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
