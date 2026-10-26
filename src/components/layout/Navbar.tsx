"use client";

import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  Plus,
  Sparkles,
  Sun,
  Moon,
  UserCheck,
  Check,
  Truck,
  RotateCcw,
} from "lucide-react";
import { UserSession, UserPersona, UserBusiness } from "@/lib/types";

export interface NavbarProps {
  session: UserSession | null;
  businesses: UserBusiness[];
  availablePersonas: UserPersona[];
  onOpenNewSale: () => void;
  onOpenAiAssistant: () => void;
  onOpenNewBusiness: () => void;
  onResetDemoData: () => void;
  onOpenAuth: () => void;
}

export function Navbar({
  session,
  businesses = [],
  availablePersonas = [],
  onOpenNewSale,
  onOpenAiAssistant,
  onOpenNewBusiness,
  onResetDemoData,
  onOpenAuth,
}: NavbarProps) {
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [switching, setSwitching] = useState(false);

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
    setSwitching(true);
    try {
      await fetch("/api/auth/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId }),
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      setSwitching(false);
    }
  };

  const handleSwitchPersona = async (userId: string) => {
    setSwitching(true);
    try {
      await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, businessId: session?.businessId }),
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* Left: Active Business Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowBizDropdown(!showBizDropdown);
            setShowPersonaDropdown(false);
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {session?.businessName ? session.businessName.charAt(0) : "V"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 max-w-[140px] sm:max-w-[220px]">
                {session?.businessName || "Select Business"}
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
        {/* Google / Account Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-300"
          title="Google Authentication and Workspace Security"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="hidden sm:inline">Google Auth</span>
        </button>

        {/* Persona Switcher (Owner, Manager, Accountant, Salesperson) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowPersonaDropdown(!showPersonaDropdown);
              setShowBizDropdown(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 text-xs font-medium text-slate-700 dark:text-slate-300"
            title="Switch demo persona to test RBAC permissions"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">
              {session?.name?.split(" ")[0]} ({session?.role})
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPersonaDropdown && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role / Persona (RBAC Test)
              </div>
              <div className="space-y-1">
                {availablePersonas.map((usr) => {
                  const isCurrent = usr.id === session?.id;
                  let personaRole = "User";
                  if (usr.email.includes("owner")) personaRole = "Owner (Full Admin)";
                  else if (usr.email.includes("manager")) personaRole = "Manager (Ops)";
                  else if (usr.email.includes("accountant")) personaRole = "Accountant (Finance)";
                  else if (usr.email.includes("sales")) personaRole = "Salesperson (Billing)";

                  return (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => handleSwitchPersona(usr.id)}
                      className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs ${
                        isCurrent
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div>
                        <p>{usr.name}</p>
                        <p className="text-[10px] text-slate-400">{personaRole}</p>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonaDropdown(false);
                    onResetDemoData();
                  }}
                  className="w-full flex items-center gap-1.5 p-1.5 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" /> Reset FMCG Demo Data
                </button>
              </div>
            </div>
          )}
        </div>

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

        {/* Primary Quick Action: New Sale */}
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
