"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  CreditCard,
  Receipt,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  Sparkles,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "sales"
  | "purchases"
  | "products"
  | "customers"
  | "suppliers"
  | "payments"
  | "expenses"
  | "reports"
  | "import-export"
  | "team"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  industry?: string;
  onOpenAiAssistant: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  industry = "Wholesale & Distribution",
  onOpenAiAssistant,
}: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: any; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales & Invoices", icon: ShoppingCart },
    { id: "purchases", label: "Purchases & Stock In", icon: Truck },
    { id: "products", label: "Stock & Inventory", icon: Boxes },
    { id: "customers", label: "Customers (Khata)", icon: Users },
    { id: "suppliers", label: "Suppliers", icon: Package },
    { id: "payments", label: "Payments & Ledger", icon: CreditCard },
    { id: "expenses", label: "Daily Expenses", icon: Receipt },
    { id: "reports", label: "Reports & P&L", icon: BarChart3 },
    { id: "import-export", label: "Import / Export", icon: FileSpreadsheet },
    { id: "team", label: "Team & Permissions", icon: ShieldCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-50/70 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-lg">
          V
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            Vyapar<span className="text-emerald-600 dark:text-emerald-400">OS</span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Bharat Business OS
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Assistant Callout Card */}
      <div className="p-3 m-3 bg-linear-to-b from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/50 rounded-2xl text-xs">
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Vyapar AI Assistant</span>
        </div>
        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 leading-snug mb-2.5">
          Ask questions about low stock, receivables, and profit margins.
        </p>
        <button
          type="button"
          onClick={onOpenAiAssistant}
          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-[11px] transition-colors shadow-2xs"
        >
          Launch Assistant
        </button>
      </div>

      {/* Bottom Industry Tag */}
      <div className="p-3.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Industry Profile
        </span>
        <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{industry}</span>
      </div>
    </aside>
  );
}
