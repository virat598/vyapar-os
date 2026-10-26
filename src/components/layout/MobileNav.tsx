"use client";

import React from "react";
import { LayoutDashboard, ShoppingCart, Boxes, Users, Menu } from "lucide-react";
import { NavTab } from "./Sidebar";

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMenu: () => void;
}

export function MobileNav({ activeTab, onSelectTab, onOpenMenu }: MobileNavProps) {
  const tabs = [
    { id: "dashboard" as NavTab, label: "Home", icon: LayoutDashboard },
    { id: "sales" as NavTab, label: "Sales", icon: ShoppingCart },
    { id: "products" as NavTab, label: "Stock", icon: Boxes },
    { id: "customers" as NavTab, label: "Khata", icon: Users },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around h-15 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium transition-colors ${
              isActive
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Menu Drawer Toggle */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </div>
  );
}
