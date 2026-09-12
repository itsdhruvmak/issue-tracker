"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getOrganizationsApi, createOrganizationApi, inviteOrgAdminApi } from "@/lib/api";
import { Organization } from "@/types/organization";
import {
  Building2,
  PlusCircle,
  UserPlus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  Clock,
  X,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Org Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: "", domain: "" });
  const [creating, setCreating] = useState(false);

  // Invite Org Admin Modal
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizationsApi();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createOrganizationApi({
        name: orgForm.name,
        domain: orgForm.domain || undefined,
      });
      setOrgForm({ name: "", domain: "" });
      setIsAddModalOpen(false);
      fetchOrgs();
    } catch (err: any) {
      alert(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteOrgAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setInviting(true);
    setGeneratedInviteLink(null);
    try {
      const res = await inviteOrgAdminApi(selectedOrg.id, inviteEmail);
      setGeneratedInviteLink(res.invite_url);
      setInviteEmail("");
    } catch (err: any) {
      alert(err.message || "Failed to generate invite");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <main className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to User Accounts
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Client Organizations
                </h1>
                <p className="text-sm text-slate-500">
                  Provision client tenant firms and bootstrap their first org_admin accounts.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 text-sm self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Firm
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Organizations Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Registered Client Firms ({organizations.length})
            </h2>
            <button
              onClick={fetchOrgs}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
            >
              Refresh List
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm">Loading client firms...</span>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">No organizations created yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add New Firm" to onboard your first client firm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-5">ID</th>
                    <th className="py-3.5 px-5">Firm Name</th>
                    <th className="py-3.5 px-5">Domain</th>
                    <th className="py-3.5 px-5">Created At</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-slate-400">
                        #{org.id}
                      </td>

                      <td className="py-4 px-5 font-semibold text-slate-900">
                        {org.name}
                      </td>

                      <td className="py-4 px-5 text-slate-600">
                        {org.domain ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {org.domain}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-italic">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(org.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            setGeneratedInviteLink(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Invite Org Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal 1: Add Organization */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Add New Firm</h3>
                    <p className="text-xs text-slate-500">Create a client tenant organization</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Textiles Ltd"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Domain (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. acmetextiles.com"
                    value={orgForm.domain}
                    onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Organization"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Provision Org Admin */}
        {selectedOrg && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Provision Org Admin</h3>
                    <p className="text-xs text-slate-500">
                      Invite client lead for <strong className="text-slate-900">{selectedOrg.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrg(null);
                    setGeneratedInviteLink(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!generatedInviteLink ? (
                <form onSubmit={handleInviteOrgAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Client Lead Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@clientfirm.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedOrg(null)}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Invite"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Org Admin Invite Created!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Share this signup URL with the client firm's lead to activate their org_admin account.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-2 border border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full bg-transparent text-xs font-mono text-slate-700 focus:outline-none"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => {
                        setSelectedOrg(null);
                        setGeneratedInviteLink(null);
                      }}
                      className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
