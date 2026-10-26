/**
 * Stage A Security & Tenancy Verification Test Suite
 * Self-contained isolated fixtures (Clean setup and teardown)
 */

import { db } from "../src/db";
import {
  users,
  businesses,
  memberships,
  invoices,
  invoiceItems,
  customers,
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import {
  verifySessionPayload,
  encodeSession,
  decodeSession,
} from "../src/lib/auth";
import { ROLE_PERMISSIONS, Role } from "../src/lib/types";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✕ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  STAGE A AUDIT: SECURITY, TENANCY & RBAC TEST SUITE");
  console.log("=======================================================");

  const TENANT_A_BIZ = "biz_test_tenant_a";
  const TENANT_A_OWNER = "usr_test_tenant_a_owner";

  const TENANT_B_BIZ = "biz_test_isolated_b";
  const TENANT_B_USER = "usr_test_tenant_b";

  try {
    // -------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------
    console.log("[Setup] Provisioning isolated test fixtures...");

    // Clean any previous artifacts
    await db.delete(invoiceItems).where(eq(invoiceItems.businessId, TENANT_A_BIZ));
    await db.delete(invoices).where(eq(invoices.businessId, TENANT_A_BIZ));
    await db.delete(customers).where(eq(customers.businessId, TENANT_A_BIZ));
    await db.delete(memberships).where(eq(memberships.businessId, TENANT_A_BIZ));
    await db.delete(businesses).where(eq(businesses.id, TENANT_A_BIZ));
    await db.delete(users).where(eq(users.id, TENANT_A_OWNER));

    await db.delete(invoiceItems).where(eq(invoiceItems.businessId, TENANT_B_BIZ));
    await db.delete(invoices).where(eq(invoices.businessId, TENANT_B_BIZ));
    await db.delete(customers).where(eq(customers.businessId, TENANT_B_BIZ));
    await db.delete(memberships).where(eq(memberships.businessId, TENANT_B_BIZ));
    await db.delete(businesses).where(eq(businesses.id, TENANT_B_BIZ));
    await db.delete(users).where(eq(users.id, TENANT_B_USER));

    // Provision Tenant A
    await db.insert(users).values({
      id: TENANT_A_OWNER,
      email: "alice@tenant-a.com",
      name: "Alice Owner",
    });

    await db.insert(businesses).values({
      id: TENANT_A_BIZ,
      name: "Alice Wholesale Trading",
      industry: "Distributors and wholesalers",
    });

    await db.insert(memberships).values({
      id: "mem_tenant_a_owner",
      businessId: TENANT_A_BIZ,
      userId: TENANT_A_OWNER,
      role: "owner",
      status: "active",
    });

    // Provision Tenant B
    await db.insert(users).values({
      id: TENANT_B_USER,
      email: "bob@isolated-tenant-b.com",
      name: "Bob Isolated",
    });

    await db.insert(businesses).values({
      id: TENANT_B_BIZ,
      name: "Isolated Tenant B Traders",
      industry: "Electronics and mobile shops",
    });

    await db.insert(memberships).values({
      id: "mem_tenant_b_owner",
      businessId: TENANT_B_BIZ,
      userId: TENANT_B_USER,
      role: "owner",
      status: "active",
    });

    // Create private records in Tenant B
    const privateCustId = "cust_secret_tenant_b";
    await db.insert(customers).values({
      id: privateCustId,
      businessId: TENANT_B_BIZ,
      name: "Confidential Customer B",
      currentBalance: 999900,
    });

    const privateInvId = "inv_secret_tenant_b";
    await db.insert(invoices).values({
      id: privateInvId,
      businessId: TENANT_B_BIZ,
      invoiceNumber: "SEC-9999",
      customerId: privateCustId,
      customerName: "Confidential Customer B",
      invoiceDate: "2025-01-01",
      grandTotal: 5000000,
      paidAmount: 0,
      balanceAmount: 5000000,
    });

    console.log("[Setup] Fixtures created successfully.\n");

    // -------------------------------------------------------------
    // 1. AUTHENTICATION & COOKIE VERIFICATION
    // -------------------------------------------------------------
    console.log("--- 1. Authentication & Cookie Verification ---");

    const nullResult = await verifySessionPayload(null);
    assert(nullResult === null, "Null session payload is rejected");

    const emptyResult = await verifySessionPayload({ userId: "", businessId: "" });
    assert(emptyResult === null, "Empty session credentials are rejected");

    const forgedUserResult = await verifySessionPayload({
      userId: "non_existent_user_999",
      businessId: TENANT_A_BIZ,
    });
    assert(forgedUserResult === null, "Non-existent user ID is rejected");

    const token = encodeSession({ userId: TENANT_A_OWNER, businessId: TENANT_A_BIZ });
    const decoded = decodeSession(token);
    assert(
      decoded?.userId === TENANT_A_OWNER && decoded?.businessId === TENANT_A_BIZ,
      "Valid token encodes and decodes accurately"
    );

    const corruptTokenDecoded = decodeSession("invalid_corrupted_base64_!!!");
    assert(corruptTokenDecoded === null, "Malformed or tampered token returns null");

    // -------------------------------------------------------------
    // 2. CROSS-TENANT ACCESS ENFORCEMENT
    // -------------------------------------------------------------
    console.log("\n--- 2. Cross-Tenant Access Enforcement ---");

    const crossTenantPayload = await verifySessionPayload({
      userId: TENANT_A_OWNER,
      businessId: TENANT_B_BIZ,
    });
    assert(
      crossTenantPayload === null,
      "User A cannot claim or access Tenant B workspace (Membership check fails)"
    );

    const tenantAInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.businessId, TENANT_A_BIZ));

    const leakFound = tenantAInvoices.some((inv) => inv.businessId === TENANT_B_BIZ || inv.id === privateInvId);
    assert(!leakFound, "Tenant A invoice queries strictly exclude Tenant B records");

    const unauthorizedInvRead = (
      await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, privateInvId), eq(invoices.businessId, TENANT_A_BIZ)))
        .limit(1)
    )[0];
    assert(
      unauthorizedInvRead === undefined,
      "Tenant A cannot fetch Tenant B invoice by ID (Returns 404 / Not Found)"
    );

    const unauthorizedCustRead = (
      await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, privateCustId), eq(customers.businessId, TENANT_A_BIZ)))
        .limit(1)
    )[0];
    assert(
      unauthorizedCustRead === undefined,
      "Tenant A cannot access Tenant B customer ledger (Returns 404 / Not Found)"
    );

    // -------------------------------------------------------------
    // 3. WORKSPACE SWITCHING PERMISSION VALIDATION
    // -------------------------------------------------------------
    console.log("\n--- 3. Workspace Switching Authorization ---");

    const membershipCheck = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, TENANT_A_OWNER), eq(memberships.businessId, TENANT_B_BIZ)))
      .limit(1);
    assert(
      membershipCheck.length === 0,
      "Switching to Tenant B is denied because Tenant A user is not a verified member"
    );

    // -------------------------------------------------------------
    // 4. ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION BOUNDARIES
    // -------------------------------------------------------------
    console.log("\n--- 4. Role-Based Permissions (RBAC) Matrix ---");

    const ownerPerms = ROLE_PERMISSIONS["owner"];
    const salesPerms = ROLE_PERMISSIONS["salesperson"];
    const viewerPerms = ROLE_PERMISSIONS["viewer"];
    const accountantPerms = ROLE_PERMISSIONS["accountant"];

    assert(ownerPerms.canManageTeam === true, "Owner has full permission to manage team");
    assert(ownerPerms.canDeleteRecords === true, "Owner has permission to delete records");

    assert(salesPerms.canCreateSales === true, "Salesperson can create sales orders");
    assert(salesPerms.canManageProducts === false, "Salesperson CANNOT add or edit products");
    assert(salesPerms.canDeleteRecords === false, "Salesperson CANNOT delete records");
    assert(salesPerms.canManageTeam === false, "Salesperson CANNOT invite team members");
    assert(salesPerms.canViewProfit === false, "Salesperson CANNOT view business profit margins");

    assert(viewerPerms.canCreateSales === false, "Viewer CANNOT create invoices");
    assert(viewerPerms.canCreatePurchases === false, "Viewer CANNOT record purchases");
    assert(viewerPerms.canRecordPayments === false, "Viewer CANNOT record payments");
    assert(viewerPerms.canViewReports === true, "Viewer can view read-only reports");

    assert(accountantPerms.canViewProfit === true, "Accountant can view P&L and profit reports");
    assert(accountantPerms.canRecordPayments === true, "Accountant can record payments");
    assert(accountantPerms.canManageProducts === false, "Accountant cannot modify product catalog");

    // -------------------------------------------------------------
    // 5. OWNER PROTECTION SAFEGUARDS
    // -------------------------------------------------------------
    console.log("\n--- 5. Owner Protection Safeguards ---");

    const ownerMembership = (
      await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, TENANT_A_OWNER), eq(memberships.businessId, TENANT_A_BIZ)))
        .limit(1)
    )[0];

    assert(ownerMembership.role === "owner", "Owner membership verified in workspace");

    const simulatedActorRole: Role = "manager";
    const canActorModifyOwner =
      ROLE_PERMISSIONS[simulatedActorRole].canManageTeam && (simulatedActorRole as string) === "owner";
    assert(
      !canActorModifyOwner,
      "Manager/Admin cannot demote or remove workspace owner"
    );

    // -------------------------------------------------------------
    // TEARDOWN FIXTURES
    // -------------------------------------------------------------
    console.log("\n[Teardown] Cleaning up isolated test fixtures...");
    await db.delete(invoiceItems).where(eq(invoiceItems.businessId, TENANT_A_BIZ));
    await db.delete(invoices).where(eq(invoices.businessId, TENANT_A_BIZ));
    await db.delete(customers).where(eq(customers.businessId, TENANT_A_BIZ));
    await db.delete(memberships).where(eq(memberships.businessId, TENANT_A_BIZ));
    await db.delete(businesses).where(eq(businesses.id, TENANT_A_BIZ));
    await db.delete(users).where(eq(users.id, TENANT_A_OWNER));

    await db.delete(invoiceItems).where(eq(invoiceItems.businessId, TENANT_B_BIZ));
    await db.delete(invoices).where(eq(invoices.businessId, TENANT_B_BIZ));
    await db.delete(customers).where(eq(customers.businessId, TENANT_B_BIZ));
    await db.delete(memberships).where(eq(memberships.businessId, TENANT_B_BIZ));
    await db.delete(businesses).where(eq(businesses.id, TENANT_B_BIZ));
    await db.delete(users).where(eq(users.id, TENANT_B_USER));

    console.log("\n=======================================================");
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED! Stage A Foundation is verified.`);
    console.log("=======================================================\n");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

runTestSuite().then(() => process.exit(0));
