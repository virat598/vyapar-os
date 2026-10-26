"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { ROLE_PERMISSIONS, Role } from "@/lib/types";
import { ShieldCheck, Plus, Check, X, AlertCircle } from "lucide-react";

interface TeamViewProps {
  currentRole: Role;
}

export function TeamView({ currentRole }: TeamViewProps) {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("salesperson");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = () => {
    setLoading(true);
    fetch("/api/team")
      .then((res) => res.json())
      .then((json) => {
        setTeam(json.team || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite member");

      setShowInviteModal(false);
      setEmail("");
      setName("");
      loadTeam();
    } catch (err: any) {
      setError(err.message || "Failed to invite member");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: Role) => {
    try {
      await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role: newRole }),
      });
      loadTeam();
    } catch (err) {
      console.error(err);
    }
  };

  const roleLabels: Record<Role, { name: string; desc: string }> = {
    owner: { name: "Owner", desc: "Full root access, delete businesses, manage subscription" },
    admin: { name: "Admin", desc: "Manage team, edit all inventory and billing settings" },
    manager: { name: "Operations Manager", desc: "Manage sales, purchases, stock adjustments, and ledgers" },
    accountant: { name: "Accountant / Munim", desc: "View P&L, balance sheets, log payments and expenses" },
    salesperson: { name: "Salesperson", desc: "Create sales invoices, collect payments, view catalog" },
    viewer: { name: "Viewer", desc: "Read-only access to records and reports" },
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Team Members & Role-Based Permissions (RBAC)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict database-enforced permissions for owners, managers, accountants, and salespeople
          </p>
        </div>

        {ROLE_PERMISSIONS[currentRole]?.canManageTeam && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        )}
      </div>

      {/* Team List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Workspace Members</h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {team.map((mem) => (
            <div key={mem.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                  {mem.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{mem.name}</h4>
                  <p className="text-slate-500">{mem.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Role:
                </span>
                {ROLE_PERMISSIONS[currentRole]?.canManageTeam && mem.role !== "owner" ? (
                  <select
                    value={mem.role}
                    onChange={(e) => handleRoleChange(mem.id, e.target.value as Role)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold capitalize"
                  >
                    {Object.keys(roleLabels).map((r) => (
                      <option key={r} value={r}>
                        {roleLabels[r as Role].name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full font-bold uppercase text-[10px]">
                    {mem.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Enforced Permission Matrix
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          All endpoints enforce these rules on the server using verified session cookies and database lookups.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-xl">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] text-slate-500">
              <tr>
                <th className="p-3">Role</th>
                <th className="p-3 text-center">Sales Invoices</th>
                <th className="p-3 text-center">Supplier Purchases</th>
                <th className="p-3 text-center">Receive Payments</th>
                <th className="p-3 text-center">Product Catalog</th>
                <th className="p-3 text-center">Reports & P&L</th>
                <th className="p-3 text-center">Team Invites</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(["owner", "admin", "manager", "accountant", "salesperson", "viewer"] as Role[]).map((r) => {
                const p = ROLE_PERMISSIONS[r];
                return (
                  <tr key={r} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white capitalize">
                      {roleLabels[r].name}
                    </td>
                    <td className="p-3 text-center">
                      {p.canCreateSales ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {p.canCreatePurchases ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {p.canRecordPayments ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {p.canManageProducts ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {p.canViewReports ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {p.canManageTeam ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        subtitle="Grant role-scoped access to this business workspace"
        maxWidth="md"
      >
        <form onSubmit={handleInvite} className="space-y-4 text-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Member Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kulkarni"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="ramesh@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role Assignment
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl capitalize"
            >
              {Object.keys(roleLabels)
                .filter((r) => r !== "owner")
                .map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r as Role].name} — {roleLabels[r as Role].desc}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs disabled:opacity-50"
            >
              {saving ? "Inviting..." : "Grant Membership"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
