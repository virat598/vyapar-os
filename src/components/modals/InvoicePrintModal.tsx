"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { formatINR, paiseToRupees } from "@/lib/currency";
import { Printer, MessageCircle, Download, Check, AlertCircle } from "lucide-react";

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
}

export function InvoicePrintModal({ isOpen, onClose, invoiceId }: InvoicePrintModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !invoiceId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/sales/${invoiceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load invoice details");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [isOpen, invoiceId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const inv = data.invoice;
    const biz = data.business;
    const text = encodeURIComponent(
      `Hello ${inv.customerName},\n\nHere is your Tax Invoice *${inv.invoiceNumber}* from *${biz.name}*.\n\n📅 Date: ${inv.invoiceDate}\n💰 Total Amount: ${formatINR(inv.grandTotal)}\n💵 Paid: ${formatINR(inv.paidAmount)}\n⏳ Remaining Balance: ${formatINR(inv.balanceAmount)}\n\nThank you for your business!`
    );
    const phone = data.customer?.phone?.replace(/[^0-9]/g, "") || "";
    window.open(`https://wa.me/${phone ? "91" + phone.slice(-10) : ""}?text=${text}`, "_blank");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GST Tax Invoice Preview"
      subtitle={data?.invoice?.invoiceNumber ? `Invoice #${data.invoice.invoiceNumber}` : "Loading..."}
      maxWidth="4xl"
    >
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Generating tax invoice document...</p>
        </div>
      ) : error || !data ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || "Could not load invoice data"}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Bar (Not printed) */}
          <div className="no-print flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                data.invoice.paymentStatus === "paid"
                  ? "bg-emerald-100 text-emerald-800"
                  : data.invoice.paymentStatus === "partial"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}>
                Payment Status: {data.invoice.paymentStatus}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
            </div>
          </div>

          {/* Printable Invoice Sheet */}
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-300 shadow-xs text-xs font-sans">
            {/* Top Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                  ORIGINAL FOR RECIPIENT • TAX INVOICE
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1 uppercase">
                  {data.business.name}
                </h2>
                <p className="text-slate-600 max-w-sm mt-0.5">{data.business.address || "APMC Yard"}, {data.business.city}, {data.business.state} - {data.business.pincode}</p>
                <p className="text-slate-700 font-semibold mt-1">
                  GSTIN: <span className="font-mono text-slate-900">{data.business.gstin || "27AABCS1429B1Z2"}</span>
                </p>
                <p className="text-slate-600">Phone: {data.business.phone || "+91 98220 12345"} | Email: {data.business.email || "billing@vyaparos.in"}</p>
              </div>

              <div className="text-right">
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block text-left mb-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">INVOICE NO</div>
                  <div className="text-sm font-black font-mono text-slate-900">{data.invoice.invoiceNumber}</div>
                </div>
                <div className="text-slate-600 space-y-0.5">
                  <p>Date: <strong className="text-slate-900">{data.invoice.invoiceDate}</strong></p>
                  {data.invoice.dueDate && (
                    <p>Due Date: <strong className="text-slate-900">{data.invoice.dueDate}</strong></p>
                  )}
                  <p>State: <strong>{data.business.state} (27)</strong></p>
                </div>
              </div>
            </div>

            {/* Bill To & Dispatch Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 bg-slate-50/50 px-3 rounded-lg my-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  BILLED TO (BUYER)
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{data.invoice.customerName}</h4>
                {data.customer && (
                  <div className="text-slate-600 space-y-0.5 mt-0.5">
                    {data.customer.billingAddress && <p>{data.customer.billingAddress}</p>}
                    <p>{data.customer.city}, {data.customer.state}</p>
                    {data.customer.gstin && (
                      <p className="font-semibold text-slate-800">
                        GSTIN: <span className="font-mono">{data.customer.gstin}</span>
                      </p>
                    )}
                    {data.customer.phone && <p>Mobile: {data.customer.phone}</p>}
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  DISPATCH DETAILS & NOTES
                </span>
                <p className="text-slate-700">{data.invoice.notes || "Standard B2B Wholesale Delivery via Road Cargo."}</p>
                <p className="text-slate-600 mt-1">Payment Terms: <strong>14 Days Credit</strong></p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full border border-slate-300 text-left my-4 divide-y divide-slate-200">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-2 border-r border-slate-300 text-center w-10">#</th>
                  <th className="p-2 border-r border-slate-300">Description of Goods</th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">Qty</th>
                  <th className="p-2 border-r border-slate-300 text-center w-14">Unit</th>
                  <th className="p-2 border-r border-slate-300 text-right w-24">Rate (₹)</th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">GST %</th>
                  <th className="p-2 border-r border-slate-300 text-right w-20">Tax (₹)</th>
                  <th className="p-2 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items.map((item: any, i: number) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-300 text-center text-slate-500">{i + 1}</td>
                    <td className="p-2 border-r border-slate-300 font-medium text-slate-900">
                      {item.productName}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-semibold">{item.quantity}</td>
                    <td className="p-2 border-r border-slate-300 text-center text-slate-600">{item.unit}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">
                      {(item.unitPrice / 100).toFixed(2)}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center">{item.taxRate}%</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">
                      {(item.taxAmount / 100).toFixed(2)}
                    </td>
                    <td className="p-2 text-right font-semibold font-mono text-slate-900">
                      {(item.totalPrice / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & Totals */}
            <div className="grid grid-cols-2 gap-6 pt-3">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">BANK DETAILS FOR PAYMENT</p>
                  <p className="font-semibold text-slate-800">Bank: HDFC Bank Ltd (Market Yard Branch)</p>
                  <p className="text-slate-600">A/C No: <strong>50200088912345</strong></p>
                  <p className="text-slate-600">IFSC Code: <strong>HDFC0001234</strong></p>
                  <p className="text-slate-600">UPI ID: <strong>krishnadist@hdfcbank</strong></p>
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  <p><strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-200">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">{formatINR(data.invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-200">
                  <span>CGST + SGST Output:</span>
                  <span className="font-mono">{formatINR(data.invoice.taxTotal)}</span>
                </div>
                {data.invoice.discountTotal > 0 && (
                  <div className="flex justify-between py-1 text-emerald-700 border-b border-slate-200">
                    <span>Discount Allowed:</span>
                    <span className="font-mono">-{formatINR(data.invoice.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-base font-black text-slate-900 border-b-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{formatINR(data.invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Amount Received:</span>
                  <span className="font-mono font-medium">{formatINR(data.invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-rose-600">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatINR(data.invoice.balanceAmount)}</span>
                </div>
              </div>
            </div>

            {/* Signature Box */}
            <div className="flex justify-between items-end pt-8 mt-6 border-t border-slate-200">
              <div className="text-[10px] text-slate-500">
                Customer Signature & Stamp
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-600 uppercase">For {data.business.name}</p>
                <div className="h-10"></div>
                <p className="text-xs font-semibold text-slate-900 border-t border-slate-400 pt-1 px-4 inline-block">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
