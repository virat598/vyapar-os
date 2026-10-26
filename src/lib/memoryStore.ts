/**
 * In-Memory Fallback Business Store
 * Provides zero-configuration persistence for deployments (such as Vercel)
 * where an external PostgreSQL database is not connected.
 */

export interface MemoryStoreData {
  users: any[];
  businesses: any[];
  memberships: any[];
  categories: any[];
  products: any[];
  customers: any[];
  suppliers: any[];
  invoices: any[];
  invoiceItems: any[];
  purchases: any[];
  purchaseItems: any[];
  payments: any[];
  expenses: any[];
  stockMovements: any[];
  auditLogs: any[];
}

function getInitialStore(): MemoryStoreData {
  const defaultBusiness = {
    id: "biz_krishna_fmcg",
    name: "Shree Krishna FMCG & Agro Distributors",
    legalName: "Shree Krishna FMCG & Agro Private Limited",
    gstin: "27AABCS1429B1Z2",
    industry: "FMCG distributors",
    phone: "+91 98220 12345",
    email: "contact@krishnadistributors.in",
    address: "Plot No. 44, APMC Market Yard, Gate No. 2",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411037",
    currency: "INR",
    timezone: "Asia/Kolkata",
    financialYearStart: "04-01",
    invoicePrefix: "SKD-",
    invoiceCounter: 1006,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const users = [
    {
      id: "usr_rajesh_owner",
      email: "rajesh@krishnadistributors.in",
      name: "Rajesh Sharma",
      phone: "+91 98220 12345",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
      createdAt: new Date(),
    },
    {
      id: "usr_amit_manager",
      email: "amit@krishnadistributors.in",
      name: "Amit Verma",
      phone: "+91 98220 44556",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
      createdAt: new Date(),
    },
    {
      id: "usr_priya_accountant",
      email: "priya@krishnadistributors.in",
      name: "Priya Patel",
      phone: "+91 98220 77889",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces",
      createdAt: new Date(),
    },
    {
      id: "usr_deepak_sales",
      email: "deepak@krishnadistributors.in",
      name: "Deepak Kumar",
      phone: "+91 98220 99001",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop&crop=faces",
      createdAt: new Date(),
    },
  ];

  const memberships = [
    { id: "mem_1", businessId: defaultBusiness.id, userId: "usr_rajesh_owner", role: "owner", status: "active", createdAt: new Date() },
    { id: "mem_2", businessId: defaultBusiness.id, userId: "usr_amit_manager", role: "manager", status: "active", createdAt: new Date() },
    { id: "mem_3", businessId: defaultBusiness.id, userId: "usr_priya_accountant", role: "accountant", status: "active", createdAt: new Date() },
    { id: "mem_4", businessId: defaultBusiness.id, userId: "usr_deepak_sales", role: "salesperson", status: "active", createdAt: new Date() },
  ];

  const categories = [
    { id: "cat_staples", businessId: defaultBusiness.id, name: "Food Staples & Atta", color: "amber", createdAt: new Date() },
    { id: "cat_oils", businessId: defaultBusiness.id, name: "Edible Oils & Ghee", color: "yellow", createdAt: new Date() },
    { id: "cat_packaged", businessId: defaultBusiness.id, name: "Packaged Snacks & Biscuits", color: "orange", createdAt: new Date() },
    { id: "cat_hygiene", businessId: defaultBusiness.id, name: "Personal Care & Hygiene", color: "blue", createdAt: new Date() },
    { id: "cat_beverages", businessId: defaultBusiness.id, name: "Beverages & Tea", color: "emerald", createdAt: new Date() },
  ];

  const products = [
    { id: "prod_1", businessId: defaultBusiness.id, sku: "TATA-SLT-1K", name: "Tata Salt Vacuum Evaporated (1kg)", categoryId: "cat_staples", unit: "PKT", costPrice: 2200, sellingPrice: 2600, mrp: 2800, taxRate: 5, hsnCode: "250100", barcode: "8901030383121", currentStock: 240, minStockAlert: 50, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_2", businessId: defaultBusiness.id, sku: "FORT-OIL-1L", name: "Fortune Sunlite Refined Sunflower Oil (1L Pouch)", categoryId: "cat_oils", unit: "PKT", costPrice: 12400, sellingPrice: 14200, mrp: 15500, taxRate: 5, hsnCode: "151219", barcode: "8906007280124", currentStock: 160, minStockAlert: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_3", businessId: defaultBusiness.id, sku: "MAGG-NDL-70G", name: "Nestle Maggi 2-Minute Masala Noodles (70g)", categoryId: "cat_packaged", unit: "PCS", costPrice: 1150, sellingPrice: 1400, mrp: 1400, taxRate: 12, hsnCode: "190230", barcode: "8901058852441", currentStock: 480, minStockAlert: 80, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_4", businessId: defaultBusiness.id, sku: "PARL-GLD-1K", name: "Parle-G Gold Glucose Biscuits (1kg Pack)", categoryId: "cat_packaged", unit: "PKT", costPrice: 11000, sellingPrice: 13000, mrp: 14000, taxRate: 18, hsnCode: "190531", barcode: "8901719114200", currentStock: 95, minStockAlert: 25, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_5", businessId: defaultBusiness.id, sku: "SURF-EXL-1K", name: "Surf Excel Quick Wash Detergent Powder (1kg)", categoryId: "cat_hygiene", unit: "PKT", costPrice: 13800, sellingPrice: 16400, mrp: 17500, taxRate: 18, hsnCode: "340220", barcode: "8901030018443", currentStock: 14, minStockAlert: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_6", businessId: defaultBusiness.id, sku: "AMUL-GHE-1L", name: "Amul Pure Cow Ghee (1L Tin)", categoryId: "cat_oils", unit: "PCS", costPrice: 56500, sellingPrice: 63500, mrp: 67000, taxRate: 12, hsnCode: "040590", barcode: "8901262010113", currentStock: 52, minStockAlert: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_7", businessId: defaultBusiness.id, sku: "RED-TEA-500", name: "Brooke Bond Red Label Natural Care Tea (500g)", categoryId: "cat_beverages", unit: "PKT", costPrice: 24500, sellingPrice: 28500, mrp: 31000, taxRate: 5, hsnCode: "090240", barcode: "8901030722104", currentStock: 110, minStockAlert: 20, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_8", businessId: defaultBusiness.id, sku: "DET-SOP-3PK", name: "Dettol Original Germ Protection Soap (125g x 3)", categoryId: "cat_hygiene", unit: "PKT", costPrice: 13500, sellingPrice: 15800, mrp: 17000, taxRate: 18, hsnCode: "340111", barcode: "8901396112202", currentStock: 75, minStockAlert: 20, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: "prod_9", businessId: defaultBusiness.id, sku: "AASH-ATT-10K", name: "Aashirvaad Shudh Chakki Whole Wheat Atta (10kg)", categoryId: "cat_staples", unit: "BAG", costPrice: 41000, sellingPrice: 47500, mrp: 51000, taxRate: 5, hsnCode: "110100", barcode: "8901725134102", currentStock: 11, minStockAlert: 25, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  const suppliers = [
    { id: "sup_tata", businessId: defaultBusiness.id, name: "Tata Consumer Products Central Depot", phone: "+91 20 2687 4000", email: "orders.west@tataconsumer.com", gstin: "27AAACT2727Q1ZT", address: "Warehouse 12, Hadapsar Industrial Area", city: "Pune", currentBalance: 12500000, notes: "Weekly Tuesday dispatch. 15-day credit cycle.", createdAt: new Date(), updatedAt: new Date() },
    { id: "sup_adani", businessId: defaultBusiness.id, name: "Adani Wilmar Logistics Hub", phone: "+91 22 6678 1200", email: "supply.pune@adaniwilmar.com", gstin: "27AAACA6023H1ZB", address: "Plot 8B, MIDC Bhosari", city: "Pune", currentBalance: 7800000, notes: "Minimum order 50 boxes for free freight delivery.", createdAt: new Date(), updatedAt: new Date() },
    { id: "sup_nestle", businessId: defaultBusiness.id, name: "Nestle India Regional C&F", phone: "+91 20 4123 9900", email: "cf.maharashtra@nestle.com", gstin: "27AAACN0021L1Z9", address: "Sector 3, Chakan Industrial Phase 2", city: "Pune", currentBalance: 3400000, notes: "Direct bank transfer within 21 days for 1% cash discount.", createdAt: new Date(), updatedAt: new Date() },
    { id: "sup_hul", businessId: defaultBusiness.id, name: "Hindustan Unilever Distribution Depot", phone: "+91 20 2744 5500", email: "pune.depot@hul.com", gstin: "27AAACH1111P1Z4", address: "Gat 410, Wagholi Logistics Park", city: "Pune", currentBalance: 5200000, notes: "Strict 14-day payment settlement.", createdAt: new Date(), updatedAt: new Date() },
  ];

  const customers = [
    { id: "cust_mahalaxmi", businessId: defaultBusiness.id, name: "Mahalaxmi Super Market", phone: "+91 98901 23456", email: "mahalaxmi.supermarket@gmail.com", gstin: "27AAFFM2045K1Z3", billingAddress: "Shop 1-4, Sai Heritage, Katraj Chowk", city: "Pune", state: "Maharashtra", creditLimit: 10000000, currentBalance: 4250000, notes: "A-class customer. Prompt weekly settlement.", createdAt: new Date(), updatedAt: new Date() },
    { id: "cust_ganesh", businessId: defaultBusiness.id, name: "Ganesh Kirana & General Stores", phone: "+91 98902 34567", email: "ganeshkirana.pune@yahoo.com", gstin: "27AABPG1234D1Z8", billingAddress: "12, Karve Road, Near Dashabhuja Ganpati, Kothrud", city: "Pune", state: "Maharashtra", creditLimit: 5000000, currentBalance: 2480000, notes: "Prefers morning delivery before 10 AM.", createdAt: new Date(), updatedAt: new Date() },
    { id: "cust_balaji", businessId: defaultBusiness.id, name: "Balaji Provisions & Mart", phone: "+91 98903 45678", email: "balajiprovisions.pimpri@gmail.com", gstin: "27AACPB9876E1Z1", billingAddress: "Station Road, Opp Pimpri Railway Station", city: "Pimpri", state: "Maharashtra", creditLimit: 7500000, currentBalance: 1650000, notes: "Pay via UPI QR code on invoice delivery.", createdAt: new Date(), updatedAt: new Date() },
    { id: "cust_sai", businessId: defaultBusiness.id, name: "Sai Departmental Store", phone: "+91 98904 56789", email: "sai.deptstore@gmail.com", gstin: "27AADPS4321A1Z5", billingAddress: "Shop 7, Datta Mandir Complex, Viman Nagar", city: "Pune", state: "Maharashtra", creditLimit: 5000000, currentBalance: 0, notes: "Regular buyer of premium oils and tea.", createdAt: new Date(), updatedAt: new Date() },
    { id: "cust_annapurna", businessId: defaultBusiness.id, name: "Annapurna Daily Needs", phone: "+91 98905 67890", email: "annapurna.needs@rediffmail.com", gstin: "27AAAPA8899C1Z7", billingAddress: "Thergaon Phata, Chinchwad", city: "Pimpri-Chinchwad", state: "Maharashtra", creditLimit: 6000000, currentBalance: 5120000, notes: "High outstanding balance; follow up for payment before next invoice.", createdAt: new Date(), updatedAt: new Date() },
  ];

  const invoices = [
    { id: "inv_1001", businessId: defaultBusiness.id, invoiceNumber: "SKD-1001", customerId: "cust_mahalaxmi", customerName: "Mahalaxmi Super Market", invoiceDate: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0], dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0], status: "confirmed", paymentStatus: "partial", subtotal: 5460000, taxTotal: 340000, discountTotal: 50000, grandTotal: 5750000, paidAmount: 1500000, balanceAmount: 4250000, notes: "Dispatched via Tempo MH-12-AB-1234", createdByName: "Amit Verma", createdAt: new Date(Date.now() - 4 * 86400000), updatedAt: new Date() },
    { id: "inv_1002", businessId: defaultBusiness.id, invoiceNumber: "SKD-1002", customerId: "cust_ganesh", customerName: "Ganesh Kirana & General Stores", invoiceDate: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], dueDate: new Date(Date.now() + 11 * 86400000).toISOString().split("T")[0], status: "confirmed", paymentStatus: "unpaid", subtotal: 2320000, taxTotal: 160000, discountTotal: 0, grandTotal: 2480000, paidAmount: 0, balanceAmount: 2480000, notes: "Payment due within 14 days", createdByName: "Deepak Kumar", createdAt: new Date(Date.now() - 3 * 86400000), updatedAt: new Date() },
    { id: "inv_1003", businessId: defaultBusiness.id, invoiceNumber: "SKD-1003", customerId: "cust_sai", customerName: "Sai Departmental Store", invoiceDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0], status: "confirmed", paymentStatus: "paid", subtotal: 3100000, taxTotal: 220000, discountTotal: 20000, grandTotal: 3300000, paidAmount: 3300000, balanceAmount: 0, notes: "Paid in full via UPI at delivery", createdByName: "Rajesh Sharma", createdAt: new Date(Date.now() - 2 * 86400000), updatedAt: new Date() },
    { id: "inv_1004", businessId: defaultBusiness.id, invoiceNumber: "SKD-1004", customerId: "cust_annapurna", customerName: "Annapurna Daily Needs", invoiceDate: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], dueDate: new Date(Date.now() + 13 * 86400000).toISOString().split("T")[0], status: "confirmed", paymentStatus: "unpaid", subtotal: 4850000, taxTotal: 270000, discountTotal: 0, grandTotal: 5120000, paidAmount: 0, balanceAmount: 5120000, notes: "Urgent order for weekend stock", createdByName: "Deepak Kumar", createdAt: new Date(Date.now() - 1 * 86400000), updatedAt: new Date() },
    { id: "inv_1005", businessId: defaultBusiness.id, invoiceNumber: "SKD-1005", customerId: "cust_balaji", customerName: "Balaji Provisions & Mart", invoiceDate: new Date().toISOString().split("T")[0], dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0], status: "confirmed", paymentStatus: "unpaid", subtotal: 1550000, taxTotal: 100000, discountTotal: 0, grandTotal: 1650000, paidAmount: 0, balanceAmount: 1650000, notes: "Delivered today", createdByName: "Amit Verma", createdAt: new Date(), updatedAt: new Date() },
  ];

  const invoiceItems = [
    { id: "item_1", invoiceId: "inv_1001", businessId: defaultBusiness.id, productId: "prod_2", productName: "Fortune Sunlite Refined Sunflower Oil (1L Pouch)", quantity: 25, unit: "PKT", unitPrice: 14200, taxRate: 5, taxAmount: 17750, discountAmount: 0, totalPrice: 372750 },
    { id: "item_2", invoiceId: "inv_1001", businessId: defaultBusiness.id, productId: "prod_6", productName: "Amul Pure Cow Ghee (1L Tin)", quantity: 30, unit: "PCS", unitPrice: 63500, taxRate: 12, taxAmount: 228600, discountAmount: 50000, totalPrice: 2083600 },
    { id: "item_3", invoiceId: "inv_1002", businessId: defaultBusiness.id, productId: "prod_7", productName: "Brooke Bond Red Label Natural Care Tea (500g)", quantity: 40, unit: "PKT", unitPrice: 28500, taxRate: 5, taxAmount: 57000, discountAmount: 0, totalPrice: 1197000 },
    { id: "item_4", invoiceId: "inv_1002", businessId: defaultBusiness.id, productId: "prod_3", productName: "Nestle Maggi 2-Minute Masala Noodles (70g)", quantity: 80, unit: "PCS", unitPrice: 1400, taxRate: 12, taxAmount: 13440, discountAmount: 0, totalPrice: 125440 },
    { id: "item_5", invoiceId: "inv_1003", businessId: defaultBusiness.id, productId: "prod_9", productName: "Aashirvaad Shudh Chakki Whole Wheat Atta (10kg)", quantity: 50, unit: "BAG", unitPrice: 47500, taxRate: 5, taxAmount: 118750, discountAmount: 20000, totalPrice: 2473750 },
  ];

  const purchases = [
    { id: "pur_501", businessId: defaultBusiness.id, billNumber: "TAT-24-9811", supplierId: "sup_tata", supplierName: "Tata Consumer Products Central Depot", billDate: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0], status: "received", paymentStatus: "partial", subtotal: 18000000, taxTotal: 900000, grandTotal: 18900000, paidAmount: 6400000, balanceAmount: 12500000, notes: "Consignment received in perfect condition at Godown B", createdByName: "Amit Verma", createdAt: new Date(Date.now() - 5 * 86400000) },
    { id: "pur_502", businessId: defaultBusiness.id, billNumber: "AW-PUN-4402", supplierId: "sup_adani", supplierName: "Adani Wilmar Logistics Hub", billDate: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], dueDate: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0], status: "received", paymentStatus: "unpaid", subtotal: 7428500, taxTotal: 371500, grandTotal: 7800000, paidAmount: 0, balanceAmount: 7800000, notes: "Refined sunflower oil stock replenishment", createdByName: "Rajesh Sharma", createdAt: new Date(Date.now() - 3 * 86400000) },
  ];

  const purchaseItems = [
    { id: "pitem_1", purchaseId: "pur_501", businessId: defaultBusiness.id, productId: "prod_1", productName: "Tata Salt Vacuum Evaporated (1kg)", quantity: 300, unit: "PKT", unitCost: 2200, taxRate: 5, taxAmount: 33000, totalCost: 693000 },
    { id: "pitem_2", purchaseId: "pur_501", businessId: defaultBusiness.id, productId: "prod_7", productName: "Brooke Bond Red Label Natural Care Tea (500g)", quantity: 150, unit: "PKT", unitCost: 24500, taxRate: 5, taxAmount: 183750, totalCost: 3858750 },
    { id: "pitem_3", purchaseId: "pur_502", businessId: defaultBusiness.id, productId: "prod_2", productName: "Fortune Sunlite Refined Sunflower Oil (1L Pouch)", quantity: 200, unit: "PKT", unitCost: 12400, taxRate: 5, taxAmount: 124000, totalCost: 2604000 },
  ];

  const payments = [
    { id: "pay_1", businessId: defaultBusiness.id, paymentType: "customer_receipt", partyType: "customer", partyId: "cust_mahalaxmi", partyName: "Mahalaxmi Super Market", amount: 1500000, paymentDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], paymentMethod: "bank_transfer", referenceNumber: "NEFT-HDFC-99210", invoiceId: "inv_1001", notes: "Part payment against Invoice SKD-1001", createdByName: "Priya Patel", createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: "pay_2", businessId: defaultBusiness.id, paymentType: "customer_receipt", partyType: "customer", partyId: "cust_sai", partyName: "Sai Departmental Store", amount: 3300000, paymentDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], paymentMethod: "upi", referenceNumber: "UPI-409128381920", invoiceId: "inv_1003", notes: "Instant settlement via PhonePe QR", createdByName: "Deepak Kumar", createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: "pay_3", businessId: defaultBusiness.id, paymentType: "supplier_payment", partyType: "supplier", partyId: "sup_tata", partyName: "Tata Consumer Products Central Depot", amount: 6400000, paymentDate: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0], paymentMethod: "bank_transfer", referenceNumber: "RTGS-ICIC-88120", purchaseId: "pur_501", notes: "Advance payment release for prompt discount", createdByName: "Priya Patel", createdAt: new Date(Date.now() - 1 * 86400000) },
  ];

  const expenses = [
    { id: "exp_1", businessId: defaultBusiness.id, category: "Freight & Transport", amount: 450000, expenseDate: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0], paymentMethod: "cash", notes: "Local delivery tempo freight charges (Katraj & Kothrud trips)", createdByName: "Amit Verma", createdAt: new Date(Date.now() - 3 * 86400000) },
    { id: "exp_2", businessId: defaultBusiness.id, category: "Packaging Materials", amount: 280000, expenseDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0], paymentMethod: "upi", notes: "Corrugated cartons & heavy packing tape rolls", createdByName: "Rajesh Sharma", createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: "exp_3", businessId: defaultBusiness.id, category: "Tea & Refreshments (Pantry)", amount: 85000, expenseDate: new Date().toISOString().split("T")[0], paymentMethod: "cash", notes: "Staff tea & snacks for APMC yard loaders", createdByName: "Deepak Kumar", createdAt: new Date() },
  ];

  const stockMovements = [
    { id: "mov_1", businessId: defaultBusiness.id, productId: "prod_1", movementType: "purchase", quantity: 300, balanceAfter: 240, referenceType: "purchase", referenceId: "pur_501", notes: "Received from Tata Consumer Depot", createdByName: "Amit Verma", createdAt: new Date(Date.now() - 5 * 86400000) },
    { id: "mov_2", businessId: defaultBusiness.id, productId: "prod_2", movementType: "sale", quantity: -25, balanceAfter: 160, referenceType: "sale", referenceId: "inv_1001", notes: "Delivered to Mahalaxmi Super Market", createdByName: "Amit Verma", createdAt: new Date(Date.now() - 4 * 86400000) },
    { id: "mov_3", businessId: defaultBusiness.id, productId: "prod_5", movementType: "adjustment_out", quantity: -2, balanceAfter: 14, referenceType: "adjustment", referenceId: "adj_damage_01", notes: "Pouch leakage during stacking (Approved by Owner)", createdByName: "Rajesh Sharma", createdAt: new Date(Date.now() - 1 * 86400000) },
  ];

  return {
    businesses: [defaultBusiness],
    users,
    memberships,
    categories,
    products,
    customers,
    suppliers,
    invoices,
    invoiceItems,
    purchases,
    purchaseItems,
    payments,
    expenses,
    stockMovements,
    auditLogs: [],
  };
}

const globalStore = globalThis as typeof globalThis & {
  __vyaparMemoryStore?: MemoryStoreData;
};

if (!globalStore.__vyaparMemoryStore) {
  globalStore.__vyaparMemoryStore = getInitialStore();
}

export const memoryStore = globalStore.__vyaparMemoryStore;

export function resetMemoryStore(): MemoryStoreData {
  globalStore.__vyaparMemoryStore = getInitialStore();
  return globalStore.__vyaparMemoryStore;
}
