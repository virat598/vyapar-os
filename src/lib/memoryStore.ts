/**
 * In-Memory Fallback Business Store
 * Provides zero-configuration persistence for deployments (such as Vercel)
 * where an external PostgreSQL database is not connected.
 * Starts completely clean with no mock or demo data.
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
  return {
    businesses: [],
    users: [],
    memberships: [],
    categories: [],
    products: [],
    customers: [],
    suppliers: [],
    invoices: [],
    invoiceItems: [],
    purchases: [],
    purchaseItems: [],
    payments: [],
    expenses: [],
    stockMovements: [],
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
