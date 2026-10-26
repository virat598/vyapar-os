"use client";

import React, { useState } from "react";
import { Download, Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, RotateCcw } from "lucide-react";

export function ImportExportView() {
  const [importType, setImportType] = useState<"products" | "customers">("products");
  const [step, setStep] = useState<number>(1);
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validatedRows, setValidatedRows] = useState<any[]>([]);
  const [rowErrors, setRowErrors] = useState<{ row: number; error: string }[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ count: number; errorCount: number } | null>(null);

  // Sample CSV generators
  const downloadSampleTemplate = () => {
    let sample = "";
    if (importType === "products") {
      sample = "SKU,Product Name,Unit,Cost Price,Selling Price,Initial Stock,GST\n" +
        "RICE-BASM-5K,Kohinoor Super Basmati Rice (5kg),BAG,450,520,30,5\n" +
        "SOAP-LUX-3PK,Lux Rose Glow Bathing Soap (3 Pack),PKT,95,115,60,18\n" +
        "CHANA-DAL-1K,Organic Chana Dal (1kg),PKT,82,98,45,0";
    } else {
      sample = "Customer Name,Mobile,City,GSTIN,Opening Balance\n" +
        "Shree Ganesh General Store,9822112233,Pune,27ABCDE1234F1Z5,15000\n" +
        "Laxmi Daily Needs,9822445566,Pimpri,,8500";
    }

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sample_${importType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Step 1: Handle File Upload / Paste
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      processRawCsv(text);
    };
    reader.readAsText(file);
  };

  const handlePasteRaw = () => {
    if (!rawCsvText.trim()) return;
    setFileName("Pasted Data");
    processRawCsv(rawCsvText);
  };

  const processRawCsv = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      alert("CSV must contain at least a header row and one data row.");
      return;
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
    setCsvHeaders(headers);

    // Initial mapping
    const mapping: Record<string, string> = {};
    headers.forEach((h) => {
      const lower = h.toLowerCase();
      if (importType === "products") {
        if (lower.includes("name") || lower.includes("title") || lower.includes("item")) mapping.name = h;
        else if (lower.includes("sku") || lower.includes("code")) mapping.sku = h;
        else if (lower.includes("cost") || lower.includes("buy")) mapping.costPrice = h;
        else if (lower.includes("sell") || lower.includes("price") || lower.includes("rate")) mapping.sellingPrice = h;
        else if (lower.includes("stock") || lower.includes("qty") || lower.includes("quantity")) mapping.stock = h;
        else if (lower.includes("unit")) mapping.unit = h;
        else if (lower.includes("gst") || lower.includes("tax")) mapping.taxRate = h;
      } else {
        if (lower.includes("name")) mapping.name = h;
        else if (lower.includes("phone") || lower.includes("mobile")) mapping.phone = h;
        else if (lower.includes("city")) mapping.city = h;
        else if (lower.includes("gst")) mapping.gstin = h;
        else if (lower.includes("bal") || lower.includes("udhari")) mapping.openingBalance = h;
      }
    });
    setColumnMapping(mapping);

    // Parse rows
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
      const rowObj: Record<string, string> = {};
      headers.forEach((h, i) => {
        rowObj[h] = values[i] || "";
      });
      return rowObj;
    });

    setParsedRows(rows);
    setStep(2); // Go to Preview & Mapping
  };

  // Step 3: Run Validation on Mapped Columns
  const validateMappedRows = () => {
    const errs: { row: number; error: string }[] = [];
    const valid: any[] = [];
    const seenSkus = new Set<string>();

    parsedRows.forEach((raw, i) => {
      const rowNum = i + 1;
      const cleanObj: Record<string, any> = {};

      if (importType === "products") {
        const nameField = columnMapping.name;
        const skuField = columnMapping.sku;
        const costField = columnMapping.costPrice;
        const sellField = columnMapping.sellingPrice;
        const stockField = columnMapping.stock;
        const unitField = columnMapping.unit;
        const taxField = columnMapping.taxRate;

        const name = (nameField && raw[nameField]) || "";
        const sku = ((skuField && raw[skuField]) || "").toUpperCase();
        const costPrice = parseFloat((costField && raw[costField]) || "0");
        const sellingPrice = parseFloat((sellField && raw[sellField]) || "0");
        const stock = parseInt((stockField && raw[stockField]) || "0", 10);
        const unit = (unitField && raw[unitField]) || "PCS";
        const taxRate = parseInt((taxField && raw[taxField]) || "18", 10);

        if (!name.trim()) {
          errs.push({ row: rowNum, error: "Missing required Product Name" });
          return;
        }
        if (!sku.trim()) {
          errs.push({ row: rowNum, error: "Missing required SKU code" });
          return;
        }
        if (seenSkus.has(sku)) {
          errs.push({ row: rowNum, error: `Duplicate SKU "${sku}" found within upload file` });
          return;
        }
        seenSkus.add(sku);

        cleanObj.name = name.trim();
        cleanObj.sku = sku.trim();
        cleanObj.costPrice = costPrice;
        cleanObj.sellingPrice = sellingPrice;
        cleanObj.stock = stock;
        cleanObj.unit = unit;
        cleanObj.taxRate = taxRate;
        valid.push(cleanObj);
      } else {
        const nameField = columnMapping.name;
        const phoneField = columnMapping.phone;
        const cityField = columnMapping.city;
        const gstinField = columnMapping.gstin;
        const balField = columnMapping.openingBalance;

        const name = (nameField && raw[nameField]) || "";
        if (!name.trim()) {
          errs.push({ row: rowNum, error: "Missing required Customer Name" });
          return;
        }

        cleanObj.name = name.trim();
        cleanObj.phone = (phoneField && raw[phoneField]) || "";
        cleanObj.city = (cityField && raw[cityField]) || "Pune";
        cleanObj.gstin = (gstinField && raw[gstinField]) || "";
        cleanObj.openingBalance = parseFloat((balField && raw[balField]) || "0");
        valid.push(cleanObj);
      }
    });

    setRowErrors(errs);
    setValidatedRows(valid);
    setStep(3); // Go to Validation & Confirmation
  };

  // Step 4: Commit Valid Rows to Database
  const commitImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/import-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: importType,
          rows: validatedRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setImportResult({ count: data.importedCount, errorCount: (data.errors || []).length });
      setStep(4); // Success screen
    } catch (err: any) {
      alert("Error during import: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setRawCsvText("");
    setParsedRows([]);
    setValidatedRows([]);
    setRowErrors([]);
    setImportResult(null);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Data Import & Export Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Safely migrate products and customer ledgers with column mapping and row validation
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          Export Live Workspace Data (CSV)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Download complete database spreadsheets formatted for Excel, Tally, or accounting backup.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="/api/import-export?type=products"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Products Catalog (.CSV)
          </a>
          <a
            href="/api/import-export?type=customers"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export Customers & Ledgers (.CSV)
          </a>
          <a
            href="/api/import-export?type=sales"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" /> Export Sales Invoices (.CSV)
          </a>
        </div>
      </div>

      {/* 8-Step Safe Import Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Safe Multi-Step CSV Importer
            </h3>
            <p className="text-xs text-slate-500">
              Validates rows, detects duplicates, and prevents accidental database corruptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download Sample {importType === "products" ? "Product" : "Customer"} CSV
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6 text-xs">
          <span className={`px-2.5 py-1 rounded-full font-bold ${step === 1 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            1. Upload CSV
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-2.5 py-1 rounded-full font-bold ${step === 2 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            2. Preview & Map Columns
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-2.5 py-1 rounded-full font-bold ${step === 3 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            3. Validate & Commit
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-2.5 py-1 rounded-full font-bold ${step === 4 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            4. Finished
          </span>
        </div>

        {/* STEP 1: Select Type & File */}
        {step === 1 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Entity to Import
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportType("products")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    importType === "products"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Products Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setImportType("customers")}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    importType === "customers"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Customers & Ledgers
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
              <Upload className="w-8 h-8 mx-auto text-slate-400" />
              <div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">
                  <span>Browse .CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  or paste raw CSV text lines below
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Paste CSV Plain Text
              </label>
              <textarea
                rows={4}
                placeholder="SKU,Product Name,Unit,Cost Price,Selling Price,Initial Stock,GST&#10;ITEM01,Parle Rusks 200g,PKT,35,42,100,5"
                value={rawCsvText}
                onChange={(e) => setRawCsvText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <button
                type="button"
                onClick={handlePasteRaw}
                disabled={!rawCsvText.trim()}
                className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
              >
                Parse & Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Column Mapping & Raw Preview */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Map CSV Columns to System Fields
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                File contains <strong>{parsedRows.length} rows</strong>. Confirm mapping below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                {importType === "products" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Product Title (Required) *
                      </label>
                      <select
                        value={columnMapping.name || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        SKU / Item Code (Required) *
                      </label>
                      <select
                        value={columnMapping.sku || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, sku: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cost Price (₹)
                      </label>
                      <select
                        value={columnMapping.costPrice || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, costPrice: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Selling Price (₹)
                      </label>
                      <select
                        value={columnMapping.sellingPrice || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, sellingPrice: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Initial Stock
                      </label>
                      <select
                        value={columnMapping.stock || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, stock: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GST Tax Rate (%)
                      </label>
                      <select
                        value={columnMapping.taxRate || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, taxRate: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Customer Name *
                      </label>
                      <select
                        value={columnMapping.name || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <select
                        value={columnMapping.phone || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Opening Balance (₹)
                      </label>
                      <select
                        value={columnMapping.openingBalance || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, openingBalance: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 rounded-lg"
                      >
                        <option value="">-- Select Header --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Preview of first 3 rows */}
            <div>
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">
                Raw File Preview (First 3 Rows)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50">
                    <tr>
                      {csvHeaders.map((h) => (
                        <th key={h} className="p-2 border-r">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 3).map((r, i) => (
                      <tr key={i} className="border-t">
                        {csvHeaders.map((h) => (
                          <td key={h} className="p-2 border-r text-slate-700">{r[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetImport}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={validateMappedRows}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
              >
                Validate Rows & Check Duplicates →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Validation & Row Errors */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Validation Results
                </h4>
                <p className="text-xs text-slate-500">
                  {validatedRows.length} valid rows ready to import • {rowErrors.length} invalid rows flagged
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full">
                  ✓ {validatedRows.length} Valid
                </span>
                {rowErrors.length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 rounded-full">
                    ✕ {rowErrors.length} Errors
                  </span>
                )}
              </div>
            </div>

            {rowErrors.length > 0 && (
              <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Row-Level Errors (These will be skipped):
                </p>
                {rowErrors.map((e, idx) => (
                  <p key={idx}>Row #{e.row}: {e.error}</p>
                ))}
              </div>
            )}

            {/* Valid Rows Preview */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Name</th>
                    {importType === "products" ? (
                      <>
                        <th className="p-2">SKU</th>
                        <th className="p-2 text-right">Cost (₹)</th>
                        <th className="p-2 text-right">Sale (₹)</th>
                        <th className="p-2 text-center">Stock</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2">Phone</th>
                        <th className="p-2">City</th>
                        <th className="p-2 text-right">Balance (₹)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validatedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 text-slate-400">{i + 1}</td>
                      <td className="p-2 font-medium">{r.name}</td>
                      {importType === "products" ? (
                        <>
                          <td className="p-2 font-mono">{r.sku}</td>
                          <td className="p-2 text-right font-mono">{r.costPrice}</td>
                          <td className="p-2 text-right font-mono">{r.sellingPrice}</td>
                          <td className="p-2 text-center font-bold text-emerald-600">{r.stock}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 text-slate-600">{r.phone || "—"}</td>
                          <td className="p-2 text-slate-600">{r.city}</td>
                          <td className="p-2 text-right font-mono">{r.openingBalance}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                ← Back to Mapping
              </button>
              <button
                type="button"
                onClick={commitImport}
                disabled={isImporting || validatedRows.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {isImporting ? "Importing to Workspace..." : `Commit & Import ${validatedRows.length} Records`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Import Complete */}
        {step === 4 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Import Completed Successfully!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Successfully persisted <strong>{importResult?.count} records</strong> to your PostgreSQL workspace with opening balances and audit logs.
            </p>
            <div>
              <button
                type="button"
                onClick={resetImport}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
              >
                Import More Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
