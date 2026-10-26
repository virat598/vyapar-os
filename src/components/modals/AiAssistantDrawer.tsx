"use client";

import React, { useState } from "react";
import { Sparkles, Send, X, Bot, CheckCircle2, RefreshCw } from "lucide-react";

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
}

export function AiAssistantDrawer({ isOpen, onClose, businessName }: AiAssistantDrawerProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      text: string;
      verifiedFacts?: { label: string; value: string }[];
    }[]
  >([
    {
      role: "assistant",
      text: `### Namaste! I am your Vyapar AI Copilot for **${businessName || "your business"}**.\n\nI analyze your live inventory, receivables, sales ledgers, and cash flow to give you exact operational facts and reorder recommendations.\n\nAsk me anything or tap one of the suggested prompts below:`,
    },
  ]);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || prompt;
    if (!q.trim() || loading) return;

    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get AI response");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          verifiedFacts: data.verifiedFacts,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ Error fetching data: ${err.message || "Failed to connect to assistant"}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Which products are low in stock?",
    "Which customers have overdue payments?",
    "What are our total sales and profit numbers?",
    "What actions might improve stock planning?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                Vyapar AI Assistant
                <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Ground Truth
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">Authorized Workspace Copilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs space-y-2 leading-relaxed"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                {m.verifiedFacts && m.verifiedFacts.length > 0 && (
                  <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Live Verified Database Figures
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {m.verifiedFacts.map((f, fi) => (
                        <div
                          key={fi}
                          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px]"
                        >
                          <span className="text-slate-400 block text-[10px]">{f.label}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing live database records...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Inquiries
          </p>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAsk(q)}
                className="text-[11px] px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about stock, customers, profit, receivables..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAsk();
              }}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={loading || !prompt.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
