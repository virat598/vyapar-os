/**
 * Money utilities for VyaparOS.
 * All monetary amounts in the database are stored as integers in paise (1 INR = 100 paise)
 * to avoid floating-point inaccuracies.
 */

export function paiseToRupees(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === "string" ? parseFloat(rupees || "0") : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Formats a paise amount into standard Indian Rupee format, e.g.:
 * 12345678 paise -> ₹1,23,456.78
 */
export function formatINR(paise: number = 0, showDecimals: boolean = true): string {
  const rupees = paise / 100;
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);

  const parts = absRupees.toFixed(showDecimals ? 2 : 0).split(".");
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian numbering system: last 3 digits, then groups of 2
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }

  const formatted = showDecimals ? `${intPart}.${decPart}` : intPart;
  return `${isNegative ? "-" : ""}₹${formatted}`;
}

/**
 * Compact Indian currency for KPI cards, e.g. ₹4.25 L, ₹1.2 Cr
 */
export function formatCompactINR(paise: number = 0): string {
  const rupees = Math.abs(paise / 100);
  const sign = paise < 0 ? "-" : "";

  if (rupees >= 10000000) {
    return `${sign}₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `${sign}₹${(rupees / 100000).toFixed(2)} L`;
  }
  if (rupees >= 1000) {
    return `${sign}₹${(rupees / 1000).toFixed(1)} K`;
  }
  return formatINR(paise, false);
}

/**
 * GST Calculation helper
 */
export function calculateGstBreakdown(taxablePaise: number, gstRatePercent: number, isInterstate: boolean = false) {
  const taxAmount = Math.round((taxablePaise * gstRatePercent) / 100);
  if (isInterstate) {
    return {
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      totalTax: taxAmount,
      totalAmount: taxablePaise + taxAmount,
    };
  } else {
    const halfTax = Math.round(taxAmount / 2);
    return {
      cgst: halfTax,
      sgst: taxAmount - halfTax,
      igst: 0,
      totalTax: taxAmount,
      totalAmount: taxablePaise + taxAmount,
    };
  }
}
