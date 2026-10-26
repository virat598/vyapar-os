export type Role = "owner" | "admin" | "manager" | "accountant" | "salesperson" | "viewer";

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
}

export interface UserBusiness {
  id: string;
  name: string;
  legalName?: string | null;
  industry: string;
  gstin?: string | null;
  role: Role | string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: Role;
  businessId: string;
  businessName: string;
}

export type IndustryType =
  | "Distributors and wholesalers"
  | "FMCG distributors"
  | "Grocery and general retail"
  | "Electronics and mobile shops"
  | "Automobile dealers and auto-parts businesses"
  | "Hardware and building materials"
  | "Garments and fashion retail"
  | "Furniture businesses"
  | "Pharmacies"
  | "Service businesses";

export const INDUSTRIES: { id: IndustryType; label: string; icon: string; description: string }[] = [
  {
    id: "Distributors and wholesalers",
    label: "Distributors & Wholesalers",
    icon: "Truck",
    description: "B2B bulk orders, tiered pricing, credit limits & route delivery",
  },
  {
    id: "FMCG distributors",
    label: "FMCG Distributors",
    icon: "Package",
    description: "Fast-moving consumer goods, batch tracking & multi-retailer ledgers",
  },
  {
    id: "Grocery and general retail",
    label: "Grocery & General Retail (Kirana)",
    icon: "ShoppingBag",
    description: "Quick POS billing, barcode scanning, loose & packaged stock",
  },
  {
    id: "Electronics and mobile shops",
    label: "Electronics & Mobile Shops",
    icon: "Smartphone",
    description: "Serial/IMEI tracking, warranty periods & brand catalog",
  },
  {
    id: "Automobile dealers and auto-parts businesses",
    label: "Auto Parts & Dealers",
    icon: "Wrench",
    description: "Part number indexing, OEM compatibility & workshop billing",
  },
  {
    id: "Hardware and building materials",
    label: "Hardware & Building Materials",
    icon: "Hammer",
    description: "Length/weight units (KG, Mtr, Bag), contractor billing & transport",
  },
  {
    id: "Garments and fashion retail",
    label: "Garments & Fashion Retail",
    icon: "Shirt",
    description: "Size & color variants, seasonal collections & return management",
  },
  {
    id: "Furniture businesses",
    label: "Furniture Businesses",
    icon: "Armchair",
    description: "Custom orders, advance payments, assembly & delivery status",
  },
  {
    id: "Pharmacies",
    label: "Pharmacies & Medical Stores",
    icon: "Pill",
    description: "Drug batch tracking, expiry date alerts & prescription billing",
  },
  {
    id: "Service businesses",
    label: "Service Businesses",
    icon: "Briefcase",
    description: "Job cards, service invoices, hourly rates & technician logs",
  },
];

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GstRate = (typeof GST_RATES)[number];

export const UNITS = ["PCS", "BOX", "KG", "LTR", "MTR", "PKT", "DOZ", "BAG", "SET", "ROLL"] as const;
export type UnitType = (typeof UNITS)[number];

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI (GPay / PhonePe / Paytm)" },
  { id: "cash", label: "Cash" },
  { id: "bank_transfer", label: "Bank Transfer (NEFT/IMPS)" },
  { id: "cheque", label: "Cheque" },
] as const;

export const EXPENSE_CATEGORIES = [
  "Rent & Shop Lease",
  "Staff Salaries & Wages",
  "Electricity & Utilities",
  "Freight & Transport",
  "Packaging Materials",
  "Tea & Refreshments (Pantry)",
  "Shop Maintenance & Repairs",
  "Marketing & Promotions",
  "Printing & Stationery",
  "Government Taxes & Fees",
  "Other Expenses",
] as const;

export const ROLE_PERMISSIONS: Record<Role, {
  canManageTeam: boolean;
  canEditSettings: boolean;
  canCreateSales: boolean;
  canCreatePurchases: boolean;
  canRecordPayments: boolean;
  canManageProducts: boolean;
  canDeleteRecords: boolean;
  canViewReports: boolean;
  canViewProfit: boolean;
}> = {
  owner: {
    canManageTeam: true,
    canEditSettings: true,
    canCreateSales: true,
    canCreatePurchases: true,
    canRecordPayments: true,
    canManageProducts: true,
    canDeleteRecords: true,
    canViewReports: true,
    canViewProfit: true,
  },
  admin: {
    canManageTeam: true,
    canEditSettings: true,
    canCreateSales: true,
    canCreatePurchases: true,
    canRecordPayments: true,
    canManageProducts: true,
    canDeleteRecords: true,
    canViewReports: true,
    canViewProfit: true,
  },
  manager: {
    canManageTeam: false,
    canEditSettings: false,
    canCreateSales: true,
    canCreatePurchases: true,
    canRecordPayments: true,
    canManageProducts: true,
    canDeleteRecords: false,
    canViewReports: true,
    canViewProfit: true,
  },
  accountant: {
    canManageTeam: false,
    canEditSettings: false,
    canCreateSales: true,
    canCreatePurchases: true,
    canRecordPayments: true,
    canManageProducts: false,
    canDeleteRecords: false,
    canViewReports: true,
    canViewProfit: true,
  },
  salesperson: {
    canManageTeam: false,
    canEditSettings: false,
    canCreateSales: true,
    canCreatePurchases: false,
    canRecordPayments: true,
    canManageProducts: false,
    canDeleteRecords: false,
    canViewReports: false,
    canViewProfit: false,
  },
  viewer: {
    canManageTeam: false,
    canEditSettings: false,
    canCreateSales: false,
    canCreatePurchases: false,
    canRecordPayments: false,
    canManageProducts: false,
    canDeleteRecords: false,
    canViewReports: true,
    canViewProfit: false,
  },
};
