"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { DashboardView } from "@/components/views/DashboardView";
import { SalesView } from "@/components/views/SalesView";
import { PurchasesView } from "@/components/views/PurchasesView";
import { ProductsView } from "@/components/views/ProductsView";
import { CustomersView } from "@/components/views/CustomersView";
import { SuppliersView } from "@/components/views/SuppliersView";
import { PaymentsView } from "@/components/views/PaymentsView";
import { ExpensesView } from "@/components/views/ExpensesView";
import { ReportsView } from "@/components/views/ReportsView";
import { ImportExportView } from "@/components/views/ImportExportView";
import { TeamView } from "@/components/views/TeamView";
import { SettingsView } from "@/components/views/SettingsView";

import { NewSaleModal } from "@/components/modals/NewSaleModal";
import { NewPurchaseModal } from "@/components/modals/NewPurchaseModal";
import { NewPaymentModal } from "@/components/modals/NewPaymentModal";
import { NewProductModal } from "@/components/modals/NewProductModal";
import { StockAdjustmentModal } from "@/components/modals/StockAdjustmentModal";
import { InvoicePrintModal } from "@/components/modals/InvoicePrintModal";
import { LedgerModal } from "@/components/modals/LedgerModal";
import { NewBusinessModal } from "@/components/modals/NewBusinessModal";
import { AiAssistantDrawer } from "@/components/modals/AiAssistantDrawer";
import { AuthModal } from "@/components/modals/AuthModal";
import { OnboardingModal } from "@/components/modals/OnboardingModal";

import { UserSession, UserBusiness } from "@/lib/types";
import { isFirebaseConfigured, signInWithGoogle, signOutFirebase } from "@/lib/firebase";
import { X, Sparkles, Building2, AlertCircle, ArrowRight } from "lucide-react";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  // Options for modals
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Modals state
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"customer_receipt" | "supplier_payment">("customer_receipt");
  const [paymentPartyId, setPaymentPartyId] = useState<string | undefined>(undefined);

  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any | null>(null);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<any>(null);

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsNewProductOpen(true);
  };

  const handleOpenEditProduct = (product: any) => {
    setProductToEdit(product);
    setIsNewProductOpen(true);
  };

  const [isNewBusinessOpen, setIsNewBusinessOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Direct login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load Session and Master Options
  const loadAppData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();

      if (authData.authenticated && authData.session) {
        setSession(authData.session);
        setBusinesses(authData.businesses || []);

        // Fetch options in parallel
        const [prodRes, custRes, supRes, catRes] = await Promise.all([
          fetch("/api/products").then((r) => r.json()).catch(() => ({ products: [] })),
          fetch("/api/customers").then((r) => r.json()).catch(() => ({ customers: [] })),
          fetch("/api/suppliers").then((r) => r.json()).catch(() => ({ suppliers: [] })),
          fetch("/api/categories").then((r) => r.json()).catch(() => ({ categories: [] })),
        ]);

        setProducts(prodRes.products || []);
        setCustomers(custRes.customers || []);
        setSuppliers(supRes.suppliers || []);
        setCategories(catRes.categories || []);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error("Error loading app data:", err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    setSession(null);
    window.location.reload();
  };

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setLoginLoading(true);

    try {
      if (!isFirebaseConfigured) {
        throw new Error(
          "Firebase is not configured yet. Please configure your Firebase environment variables or sign in with your email below."
        );
      }

      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
            googleId: firebaseUser.uid,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        if (data.needsOnboarding) {
          setIsOnboardingOpen(true);
        } else {
          loadAppData();
        }
      }
    } catch (err: any) {
      setLoginError(err.message || "Failed to sign in with Google");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginError("Please enter your email address");
      return;
    }

    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          name: loginName.trim() || loginEmail.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (data.needsOnboarding) {
        setIsOnboardingOpen(true);
      } else {
        loadAppData();
      }
    } catch (err: any) {
      setLoginError(err.message || "Authentication failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOpenNewPayment = (type?: "customer_receipt" | "supplier_payment", partyId?: string) => {
    setPaymentType(type || "customer_receipt");
    setPaymentPartyId(partyId);
    setIsNewPaymentOpen(true);
  };

  const handleOpenStockAdjustment = (product?: any) => {
    setSelectedProductForAdjustment(product || null);
    setIsStockAdjustmentOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">VyaparOS Bharat</h2>
          <p className="text-xs text-slate-500">Loading business workspace...</p>
        </div>
      </div>
    );
  }

  // Real Authentication Screen (No demo buttons, no fake personas)
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 font-sans text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
              V
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Vyapar<span className="text-emerald-600 dark:text-emerald-400">OS</span> Bharat
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Business Operating System for Indian Wholesalers, Distributors & Retailers
            </p>
          </div>

          {loginError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Real Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google Sign-In</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Or Sign In with Email
              </span>
              <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Real Email Sign-In / Register Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="name@business.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                {loginLoading ? "Authenticating..." : "Sign In / Register"}
              </button>
            </form>
          </div>
        </div>

        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          userName={loginName || loginEmail.split("@")[0]}
          onComplete={() => loadAppData()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/70 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        industry={businesses.find((b) => b.id === session?.businessId)?.industry || "Wholesale & Distribution"}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          session={session}
          businesses={businesses}
          onOpenNewSale={() => setIsNewSaleOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          onOpenNewBusiness={() => setIsNewBusinessOpen(true)}
          onSignOut={handleSignOut}
        />

        {/* View Component Container */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          {activeTab === "dashboard" && (
            <DashboardView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onOpenNewPurchase={() => setIsNewPurchaseOpen(true)}
              onOpenNewPayment={handleOpenNewPayment}
              onOpenNewProduct={handleOpenAddProduct}
              onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
              onViewInvoice={(id) => setPrintInvoiceId(id)}
              onViewCustomerLedger={(id) => setLedgerCustomerId(id)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "sales" && (
            <SalesView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onViewInvoice={(id) => setPrintInvoiceId(id)}
            />
          )}

          {activeTab === "purchases" && (
            <PurchasesView
              onOpenNewPurchase={() => setIsNewPurchaseOpen(true)}
              onOpenNewPayment={handleOpenNewPayment}
            />
          )}

          {activeTab === "products" && (
            <ProductsView
              onOpenNewProduct={handleOpenAddProduct}
              onEditProduct={handleOpenEditProduct}
              onOpenStockAdjustment={handleOpenStockAdjustment}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "customers" && (
            <CustomersView
              onViewLedger={(id) => setLedgerCustomerId(id)}
              onReceivePayment={(id) => handleOpenNewPayment("customer_receipt", id)}
            />
          )}

          {activeTab === "suppliers" && (
            <SuppliersView
              onPaySupplier={(id) => handleOpenNewPayment("supplier_payment", id)}
              onNewPurchase={() => setIsNewPurchaseOpen(true)}
            />
          )}

          {activeTab === "payments" && (
            <PaymentsView onOpenNewPayment={handleOpenNewPayment} />
          )}

          {activeTab === "expenses" && <ExpensesView />}

          {activeTab === "reports" && <ReportsView />}

          {activeTab === "import-export" && <ImportExportView />}

          {activeTab === "team" && <TeamView currentRole={session?.role || "owner"} />}

          {activeTab === "settings" && (
            <SettingsView session={session} onSignOut={handleSignOut} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-white dark:bg-slate-900 h-full p-4 overflow-y-auto space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm">All Business Modules</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              {[
                { id: "dashboard", label: "Dashboard (Home)" },
                { id: "sales", label: "Sales & Invoices" },
                { id: "purchases", label: "Purchases & Inward" },
                { id: "products", label: "Stock & Inventory" },
                { id: "customers", label: "Customers (Khata)" },
                { id: "suppliers", label: "Suppliers & Vendors" },
                { id: "payments", label: "Payments Ledger" },
                { id: "expenses", label: "Daily Expenses" },
                { id: "reports", label: "Reports & P&L" },
                { id: "import-export", label: "Import / Export CSV" },
                { id: "team", label: "Team & Permissions" },
                { id: "settings", label: "Business Settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as NavTab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAiAssistantOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" /> Vyapar AI Assistant
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        onSuccess={(newInvId) => {
          loadAppData();
          setPrintInvoiceId(newInvId);
        }}
        products={products}
        customers={customers}
      />

      <NewPurchaseModal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        onSuccess={loadAppData}
        products={products}
        suppliers={suppliers}
      />

      <NewPaymentModal
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        onSuccess={loadAppData}
        initialType={paymentType}
        initialPartyId={paymentPartyId}
        customers={customers}
        suppliers={suppliers}
      />

      <NewProductModal
        isOpen={isNewProductOpen}
        onClose={() => {
          setIsNewProductOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={loadAppData}
        categories={categories}
        productToEdit={productToEdit}
      />

      <StockAdjustmentModal
        isOpen={isStockAdjustmentOpen}
        onClose={() => setIsStockAdjustmentOpen(false)}
        onSuccess={loadAppData}
        products={products}
        selectedProduct={selectedProductForAdjustment}
      />

      <InvoicePrintModal
        isOpen={!!printInvoiceId}
        onClose={() => setPrintInvoiceId(null)}
        invoiceId={printInvoiceId}
      />

      <LedgerModal
        isOpen={!!ledgerCustomerId}
        onClose={() => setLedgerCustomerId(null)}
        customerId={ledgerCustomerId}
        onReceivePaymentClick={(cId) => handleOpenNewPayment("customer_receipt", cId)}
      />

      <NewBusinessModal
        isOpen={isNewBusinessOpen}
        onClose={() => setIsNewBusinessOpen(false)}
        onSuccess={() => loadAppData()}
      />

      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        businessName={session?.businessName}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={session}
        onLoginSuccess={() => loadAppData()}
        onLogoutSuccess={() => {
          setSession(null);
          loadAppData();
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        userName={session?.name || loginName}
        onComplete={() => loadAppData()}
      />
    </div>
  );
}
