"use client";

import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  Plus,
  Sparkles,
  Sun,
  Moon,
  User,
  Check,
  LogOut,
} from "lucide-react";
import { UserSession, UserBusiness } from "@/lib/types";

export interface NavbarProps {
  session: UserSession | null;
  businesses: UserBusiness[];
  onOpenNewSale: () => void;
  onOpenAiAssistant: () => void;
  onOpenNewBusiness: () => void;
  onSignOut: () => void;
}

export function Navbar({
  session,
  businesses = [],
  onOpenNewSale,
  onOpenAiAssistant,
  onOpenNewBusiness,
  onSignOut,
}: NavbarProps) {
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSwitchBusiness = async (bizId: string) => {
    if (bizId === session?.businessId) {
      setShowBizDropdown(false);
      return;
    }
    try {
      await fetch("/api/auth/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId }),
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* Left: Active Business Workspace Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowBizDropdown(!showBizDropdown);
            setShowUserDropdown(false);
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {session?.businessName ? session.businessName.charAt(0) : "V"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 max-w-[140px] sm:max-w-[220px]">
                {session?.businessName || "My Business"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider block">
              Workspace • {session?.role || "Owner"}
            </span>
          </div>
        </button>

        {/* Business Dropdown */}
        {showBizDropdown && (
          <div
            className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Workspaces ({businesses.length})
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {businesses.map((biz) => {
                const isCurrent = biz.id === session?.businessId;
                return (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => handleSwitchBusiness(biz.id)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                      isCurrent
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-xs">{biz.name}</p>
                      <p className="text-[10px] text-slate-400">{biz.industry}</p>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowBizDropdown(false);
                  onOpenNewBusiness();
                }}
                className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> + Create New Business Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Assistant Button */}
        <button
          type="button"
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Vyapar AI</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Real User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowBizDropdown(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
              {session?.name ? session.name.charAt(0) : "U"}
            </div>
            <span className="hidden sm:inline font-semibold">
              {session?.name?.split(" ")[0]}
            </span>
            <span className="hidden sm:inline text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
              {session?.role}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs text-slate-900 dark:text-white">{session?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{session?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Role: {session?.role}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action: New Sale */}
        <button
          type="button"
          onClick={onOpenNewSale}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Sale</span>
        </button>
      </div>
    </header>
  );
}
