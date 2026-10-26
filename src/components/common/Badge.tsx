"use client";

import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  children: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({ variant = "neutral", children, size = "sm", dot = false }: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    danger: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  }[variant];

  const dotStyles = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    purple: "bg-purple-500",
    neutral: "bg-slate-400",
  }[variant];

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-sm font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles} ${sizeStyles}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
      {children}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="success" dot>Paid</Badge>;
  if (status === "partial") return <Badge variant="warning" dot>Partial</Badge>;
  if (status === "unpaid") return <Badge variant="danger" dot>Unpaid</Badge>;
  return <Badge variant="neutral">{status}</Badge>;
}

export function StockStatusBadge({ stock, alertThreshold }: { stock: number; alertThreshold: number }) {
  if (stock <= 0) return <Badge variant="danger" dot>Out of Stock</Badge>;
  if (stock <= alertThreshold) return <Badge variant="warning" dot>Low Stock ({stock})</Badge>;
  return <Badge variant="success" dot>In Stock ({stock})</Badge>;
}
