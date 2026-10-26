import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  gstin: text("gstin"),
  industry: text("industry").notNull().default("Distributors and wholesalers"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state").default("Maharashtra"),
  pincode: text("pincode"),
  currency: text("currency").default("INR").notNull(),
  timezone: text("timezone").default("Asia/Kolkata").notNull(),
  financialYearStart: text("financial_year_start").default("04-01").notNull(),
  invoicePrefix: text("invoice_prefix").default("INV-").notNull(),
  invoiceCounter: integer("invoice_counter").default(1001).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull().default("owner"), // owner, admin, manager, accountant, salesperson, viewer
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  color: text("color").default("emerald").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  unit: text("unit").default("PCS").notNull(), // PCS, BOX, KG, LTR, MTR, PKT, DOZ, BAG
  costPrice: integer("cost_price").default(0).notNull(), // in paise (e.g. 5000 = ₹50.00)
  sellingPrice: integer("selling_price").default(0).notNull(), // in paise
  mrp: integer("mrp").default(0), // in paise
  taxRate: integer("tax_rate").default(18).notNull(), // 0, 5, 12, 18, 28
  hsnCode: text("hsn_code"),
  barcode: text("barcode"),
  currentStock: integer("current_stock").default(0).notNull(),
  minStockAlert: integer("min_stock_alert").default(10).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  movementType: text("movement_type").notNull(), // purchase, sale, adjustment_in, adjustment_out, return_sale, return_purchase, opening_stock
  quantity: integer("quantity").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  referenceType: text("reference_type"), // sale, purchase, adjustment, manual
  referenceId: text("reference_id"),
  notes: text("notes"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),
  billingAddress: text("billing_address"),
  city: text("city"),
  state: text("state"),
  creditLimit: integer("credit_limit").default(5000000).notNull(), // in paise (₹50,000)
  currentBalance: integer("current_balance").default(0).notNull(), // positive = customer owes us (receivable)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  currentBalance: integer("current_balance").default(0).notNull(), // positive = we owe supplier (payable)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  invoiceDate: text("invoice_date").notNull(), // YYYY-MM-DD
  dueDate: text("due_date"),
  status: text("status").default("confirmed").notNull(), // draft, confirmed, cancelled, returned
  paymentStatus: text("payment_status").default("unpaid").notNull(), // unpaid, partial, paid
  subtotal: integer("subtotal").default(0).notNull(), // in paise
  taxTotal: integer("tax_total").default(0).notNull(), // in paise
  discountTotal: integer("discount_total").default(0).notNull(), // in paise
  grandTotal: integer("grand_total").default(0).notNull(), // in paise
  paidAmount: integer("paid_amount").default(0).notNull(), // in paise
  balanceAmount: integer("balance_amount").default(0).notNull(), // in paise
  notes: text("notes"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").default("PCS").notNull(),
  unitPrice: integer("unit_price").default(0).notNull(), // in paise
  taxRate: integer("tax_rate").default(18).notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  discountAmount: integer("discount_amount").default(0).notNull(),
  totalPrice: integer("total_price").default(0).notNull(),
});

export const purchases = pgTable("purchases", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  billNumber: text("bill_number").notNull(),
  supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  supplierName: text("supplier_name").notNull(),
  billDate: text("bill_date").notNull(),
  dueDate: text("due_date"),
  status: text("status").default("received").notNull(), // received, draft, cancelled
  paymentStatus: text("payment_status").default("unpaid").notNull(), // unpaid, partial, paid
  subtotal: integer("subtotal").default(0).notNull(),
  taxTotal: integer("tax_total").default(0).notNull(),
  grandTotal: integer("grand_total").default(0).notNull(),
  paidAmount: integer("paid_amount").default(0).notNull(),
  balanceAmount: integer("balance_amount").default(0).notNull(),
  notes: text("notes"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseItems = pgTable("purchase_items", {
  id: text("id").primaryKey(),
  purchaseId: text("purchase_id").references(() => purchases.id, { onDelete: "cascade" }).notNull(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").default("PCS").notNull(),
  unitCost: integer("unit_cost").default(0).notNull(),
  taxRate: integer("tax_rate").default(18).notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  totalCost: integer("total_cost").default(0).notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  paymentType: text("payment_type").notNull(), // customer_receipt, supplier_payment
  partyType: text("party_type").notNull(), // customer, supplier
  partyId: text("party_id").notNull(),
  partyName: text("party_name").notNull(),
  amount: integer("amount").default(0).notNull(), // in paise
  paymentDate: text("payment_date").notNull(),
  paymentMethod: text("payment_method").default("upi").notNull(), // cash, upi, bank_transfer, cheque
  referenceNumber: text("reference_number"),
  invoiceId: text("invoice_id"),
  purchaseId: text("purchase_id"),
  notes: text("notes"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  category: text("category").notNull(), // Rent, Electricity, Salaries, Transport, Tea/Pantry, Packaging, Maintenance, Others
  amount: integer("amount").default(0).notNull(), // in paise
  expenseDate: text("expense_date").notNull(),
  paymentMethod: text("payment_method").default("cash").notNull(),
  notes: text("notes"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  businessId: text("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
