import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/db";
import { products, customers, invoices, expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatINR } from "@/lib/currency";
import { GoogleGenAI } from "@google/genai";
import { memoryStore } from "@/lib/memoryStore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Query prompt is required" }, { status: 400 });
    }

    const queryText = prompt.trim().toLowerCase();
    const bizId = session.businessId;

    let allProducts: any[] = [];
    let allCustomers: any[] = [];
    let allInvoices: any[] = [];
    let allExpenses: any[] = [];

    try {
      allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          unit: products.unit,
          currentStock: products.currentStock,
          minStockAlert: products.minStockAlert,
          costPrice: products.costPrice,
          sellingPrice: products.sellingPrice,
        })
        .from(products)
        .where(eq(products.businessId, bizId));

      allCustomers = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          currentBalance: customers.currentBalance,
          creditLimit: customers.creditLimit,
        })
        .from(customers)
        .where(eq(customers.businessId, bizId))
        .orderBy(desc(customers.currentBalance));

      allInvoices = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: invoices.customerName,
          invoiceDate: invoices.invoiceDate,
          grandTotal: invoices.grandTotal,
          paidAmount: invoices.paidAmount,
          balanceAmount: invoices.balanceAmount,
          status: invoices.status,
        })
        .from(invoices)
        .where(eq(invoices.businessId, bizId));

      allExpenses = await db.select().from(expenses).where(eq(expenses.businessId, bizId));
    } catch {
      allProducts = memoryStore.products.filter((p) => p.businessId === bizId);
      allCustomers = memoryStore.customers.filter((c) => c.businessId === bizId).sort((a, b) => b.currentBalance - a.currentBalance);
      allInvoices = memoryStore.invoices.filter((i) => i.businessId === bizId);
      allExpenses = memoryStore.expenses.filter((e) => e.businessId === bizId);
    }

    const lowStockItems = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
    const debtorCustomers = allCustomers.filter((c) => c.currentBalance > 0);
    const totalReceivables = debtorCustomers.reduce((s, c) => s + c.currentBalance, 0);

    const activeInvoices = allInvoices.filter((i) => i.status !== "cancelled");
    const totalSalesRevenue = activeInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalCollected = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);

    const verifiedFacts = [
      { label: "Total Sales", value: formatINR(totalSalesRevenue, false) },
      { label: "Receivables (Baqaya)", value: formatINR(totalReceivables, false) },
      { label: "Low Stock Items", value: `${lowStockItems.length} products` },
      { label: "Cash Collected", value: formatINR(totalCollected, false) },
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contextPrompt = `
You are Vyapar AI, a senior financial and inventory intelligence copilot for an Indian business owner (${session.businessName}).
You must answer questions strictly based on the following verified database facts.
DO NOT hallucinate or invent numbers. If data is unavailable, state clearly that it is not in the system yet.
Always use Indian Rupee (₹) and Indian terminology where helpful (Kirana, Jama-Khata, Udhari, Challan).

LIVE VERIFIED DATABASE FACTS:
- Business Name: ${session.businessName}
- Total Active Products: ${allProducts.length}
- Low Stock Alert Items (${lowStockItems.length}): ${lowStockItems.map((p) => `${p.name} (Current: ${p.currentStock} ${p.unit}, Min: ${p.minStockAlert})`).join("; ")}
- Total Customers: ${allCustomers.length}
- Total Outstanding Receivables (Baqaya): ${formatINR(totalReceivables)}
- Top Debtors: ${debtorCustomers.slice(0, 5).map((c) => `${c.name}: ${formatINR(c.currentBalance)} (Limit: ${formatINR(c.creditLimit)})`).join("; ")}
- Total Sales Recorded: ${formatINR(totalSalesRevenue)} across ${activeInvoices.length} invoices
- Total Cash/Bank Payments Collected: ${formatINR(totalCollected)}
- Total Operational Expenses: ${formatINR(totalExpenses)}

USER QUESTION: "${prompt}"

Provide a crisp, professional, bulleted answer. Separate "Calculated Database Facts" from "Actionable Recommendations".
`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contextPrompt,
        });

        if (response.text) {
          return NextResponse.json({
            answer: response.text,
            verifiedFacts,
            source: "gemini",
          });
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to local analytical engine:", geminiError);
      }
    }

    let answer = "";
    if (queryText.includes("stock") || queryText.includes("low") || queryText.includes("inventory")) {
      if (lowStockItems.length === 0) {
        answer = `### 📦 Inventory Status: Healthy\n\nAll **${allProducts.length} products** currently have stock levels above their configured minimum thresholds. No immediate reorders are required.\n\n**Actionable Suggestion:** Check back after heavy dispatch days or set seasonal minimum thresholds for peak months.`;
      } else {
        const itemsList = lowStockItems
          .map(
            (p) =>
              `- **${p.name}** (${p.sku}): Current **${p.currentStock} ${p.unit}** remaining (Threshold: ${p.minStockAlert} ${p.unit})`
          )
          .join("\n");
        answer = `### ⚠️ Low Stock Alert (${lowStockItems.length} Products)\n\nThe following items have breached minimum safety stock levels:\n\n${itemsList}\n\n**Actionable Recommendations:**\n1. Issue Purchase Orders to suppliers immediately to prevent stockouts.\n2. Prioritize dispatch for high-margin items.`;
      }
    } else if (
      queryText.includes("receivable") ||
      queryText.includes("overdue") ||
      queryText.includes("udhari") ||
      queryText.includes("owe") ||
      queryText.includes("customer")
    ) {
      if (debtorCustomers.length === 0) {
        answer = `### 💳 Receivables: Clean Slate\n\nThere are **no outstanding receivables** currently pending from your customers. Total collected revenue is 100% realized.`;
      } else {
        const customerList = debtorCustomers
          .slice(0, 5)
          .map(
            (c) =>
              `- **${c.name}**: Outstanding **${formatINR(c.currentBalance)}** (Credit Limit: ${formatINR(c.creditLimit)})`
          )
          .join("\n");
        answer = `### 📋 Outstanding Receivables Analysis\n\nTotal market outstanding is **${formatINR(totalReceivables)}** across **${debtorCustomers.length} retailers/customers**.\n\n**Top Outstanding Balances:**\n${customerList}\n\n**Recommended Actions:**\n1. Share WhatsApp ledger statements with customers having overdue balances.\n2. Withhold new credit orders for parties near or above their credit limits until partial payment is recorded.`;
      }
    } else if (
      queryText.includes("sale") ||
      queryText.includes("revenue") ||
      queryText.includes("profit") ||
      queryText.includes("turnover")
    ) {
      answer = `### 📊 Financial & Sales Performance Overview\n\n- **Total Sales Revenue:** ${formatINR(totalSalesRevenue)}\n- **Invoices Generated:** ${activeInvoices.length} verified invoices\n- **Payments Collected:** ${formatINR(totalCollected)} (${totalSalesRevenue > 0 ? Math.round((totalCollected / totalSalesRevenue) * 100) : 0}% realization rate)\n- **Operating Expenses:** ${formatINR(totalExpenses)}\n- **Estimated Operating Net:** ${formatINR(totalSalesRevenue - totalExpenses)}\n\n**Key Takeaway:** Your collection rate is healthy. Keep daily expenses logged to ensure your P&L margins remain accurate.`;
    } else {
      answer = `### 🏢 Executive Business Summary for ${session.businessName}\n\nHere are the live verified figures from your business workspace:\n\n- **Total Revenue:** ${formatINR(totalSalesRevenue)}\n- **Pending Market Receivables:** ${formatINR(totalReceivables)}\n- **Stock Health:** ${lowStockItems.length > 0 ? `⚠️ ${lowStockItems.length} items running low` : "✅ All items well stocked"}\n- **Active Products:** ${allProducts.length} cataloged SKUs\n- **Operating Expenses:** ${formatINR(totalExpenses)}\n\n**Tip:** Ask specific questions such as *"Which customers have overdue payments?"*, *"Show low stock items"*, or *"How to improve cash flow?"* for immediate actionable guidance.`;
    }

    return NextResponse.json({
      answer,
      verifiedFacts,
      source: "analytical_engine",
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json({ error: "Failed to generate AI insights" }, { status: 500 });
  }
}
