"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  iconColor?: "emerald" | "blue" | "amber" | "rose" | "purple";
  badgeText?: string;
  badgeType?: "positive" | "negative" | "neutral" | "warning";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  iconColor = "emerald",
  badgeText,
  badgeType = "neutral",
  onClick,
}: StatCardProps) {
  const iconBgStyles = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50",
  }[iconColor];

  const badgeStyles = {
    positive: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    negative: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  }[badgeType];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h4>
            {badgeText && (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeStyles}`}>
                {badgeText}
              </span>
            )}
          </div>
          {subValue && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">{subValue}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgStyles} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
