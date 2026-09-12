"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getClientIssuesApi,
  createClientIssueApi,
  uploadClientAttachmentsApi,
  getClientTeamApi,
  inviteTeammateApi,
  removeTeammateApi,
} from "@/lib/api";
import { ClientIssue, ClientIssueCreatePayload } from "@/types/client_issue";
import { User } from "@/types/auth";
import {
  Building2,
  PlusCircle,
  UserPlus,
  Users,
  ListTodo,
  CheckCircle2,
  Clock,
  Trash2,
  Copy,
  Check,
  Loader2,
  X,
  Paperclip,
  FileText,
  Film,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"issues" | "team">("issues");

  // Issues State
  const [issues, setIssues] = useState<ClientIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [issueError, setIssueError] = useState<string | null>(null);

  // New Issue Modal & Attachments
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<ClientIssueCreatePayload>({
    title: "",
    description: "",
    priority: "medium",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [creatingIssue, setCreatingIssue] = useState(false);

  // Team State (org_admin only)
  const [team, setTeam] = useState<User[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Invite Teammate Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOrgAdmin = user?.role === "org_admin";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load Client Issues
  const fetchIssues = async () => {
    setLoadingIssues(true);
    setIssueError(null);
    try {
      const data = await getClientIssuesApi();
      setIssues(data);
    } catch (err: any) {
      setIssueError(err.message || "Failed to load organization issues");
    } finally {
      setLoadingIssues(false);
    }
  };

  // Load Client Team
  const fetchTeam = async () => {
    if (!isOrgAdmin) return;
    setLoadingTeam(true);
    setTeamError(null);
    try {
      const data = await getClientTeamApi();
      setTeam(data);
    } catch (err: any) {
      setTeamError(err.message || "Failed to load team members");
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchIssues();
      if (isOrgAdmin) {
        fetchTeam();
      }
    }
  }, [isAuthenticated, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingIssue(true);
    try {
      const newIssue = await createClientIssueApi(issueForm);
      if (selectedFiles.length > 0) {
        await uploadClientAttachmentsApi(newIssue.id, selectedFiles);
      }
      setIssueForm({ title: "", description: "", priority: "medium" });
      setSelectedFiles([]);
      setIsIssueModalOpen(false);
      fetchIssues();
    } catch (err: any) {
      alert(err.message || "Failed to create issue");
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleInviteTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setGeneratedInviteLink(null);
    try {
      const res = await inviteTeammateApi(inviteEmail);
      setGeneratedInviteLink(res.invite_url);
      setInviteEmail("");
      fetchTeam();
    } catch (err: any) {
      alert(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveTeammate = async (targetUserId: number) => {
    if (!confirm("Are you sure you want to deactivate this teammate?")) return;
    try {
      await removeTeammateApi(targetUserId);
      fetchTeam();
    } catch (err: any) {
      alert(err.message || "Failed to remove teammate");
    }
  };

  const copyInviteLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Loading Client Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/15">
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Organization Portal</h1>
            <p className="text-blue-100/80 text-sm max-w-xl">
              Track issues logged by your firm, submit new tickets with media attachments, and collaborate with your team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow-lg shadow-black/10 transition-all flex items-center gap-2.5 text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              Report Issue
            </button>

            {isOrgAdmin && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-5 py-3 bg-white/15 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Invite Teammate
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("issues")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "issues"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Organization Issues ({issues.length})
          </button>

          {isOrgAdmin && (
            <button
              onClick={() => setActiveTab("team")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "team"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Manage Team ({team.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Issues View */}
      {activeTab === "issues" && (
        <div className="space-y-6">
          {loadingIssues ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading firm issues...</p>
            </div>
          ) : issueError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {issueError}
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Issues Logged Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Your firm hasn't raised any issues yet. Click "Report Issue" to submit your first ticket.
              </p>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Report New Issue
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400">#{issue.id}</span>
                        <h3 className="font-bold text-slate-900 text-base">{issue.title}</h3>
                      </div>
                      {issue.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">{issue.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          issue.status === "open"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : issue.status === "in_progress"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {issue.status.replace("_", " ")}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          issue.priority === "high"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : issue.priority === "medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {issue.priority} priority
                      </span>
                    </div>
                  </div>

                  {/* Render Attachments/Media previews */}
                  {issue.attachments && issue.attachments.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        Attachments ({issue.attachments.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {issue.attachments.map((att) => {
                          const isVideo = att.resource_type === "video" || att.file_type?.startsWith("video/");
                          const isImage = att.resource_type === "image" || att.file_type?.startsWith("image/");
                          return (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-colors"
                            >
                              {isVideo ? (
                                <Film className="w-3.5 h-3.5 text-indigo-600" />
                              ) : isImage ? (
                                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span className="truncate max-w-[140px]">{att.file_name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Team View (org_admin only) */}
      {activeTab === "team" && isOrgAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Firm Teammates</h2>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite Teammate
            </button>
          </div>

          {loadingTeam ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Loading team roster...</p>
            </div>
          ) : teamError ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {teamError}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {member.full_name || member.username}
                      </td>
                      <td className="px-6 py-4">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                          {member.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            member.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {member.id !== user.id && member.is_active && (
                          <button
                            onClick={() => handleRemoveTeammate(member.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Deactivate teammate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Report New Issue */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Report New Issue</h3>
                  <p className="text-xs text-slate-500">Submit a ticket to ERP support</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsIssueModalOpen(false);
                  setSelectedFiles([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cannot export monthly ledger PDF"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Priority
                </label>
                <select
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide details about the issue..."
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Media File Attachment Upload Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Attach Media / Screenshots / Videos
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                    <Paperclip className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file(s) selected`
                        : "Click or drag images, videos, or documents"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supports JPG, PNG, MP4, MOV, PDF
                    </span>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono text-slate-600 flex items-center justify-between bg-slate-100 px-3 py-1 rounded-lg"
                      >
                        <span className="truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsIssueModalOpen(false);
                    setSelectedFiles([]);
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingIssue}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {creatingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Invite Teammate */}
      {isInviteModalOpen && isOrgAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Invite Teammate</h3>
                  <p className="text-xs text-slate-500">Invite a colleague into your firm's account</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setGeneratedInviteLink(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedInviteLink ? (
              <form onSubmit={handleInviteTeammate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Colleague Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
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
                    <p className="font-bold">Invitation Generated!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Share the signup link below with your colleague to complete registration.
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
                      setIsInviteModalOpen(false);
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
    </div>
  );
}
