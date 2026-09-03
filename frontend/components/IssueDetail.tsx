"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Issue, IssueStatus, IssuePriority, Attachment } from "@/types/issue";
import { updateIssue, deleteIssue, uploadAttachments, deleteAttachment } from "@/lib/api";
import {
  ArrowLeft,
  User,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  CircleDot,
  Loader2,
  Tag,
  Pencil,
  X,
  Save,
  AlertCircle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function IssueDetail({ initialIssue }: { initialIssue: Issue }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [issue, setIssue] = useState<Issue>(initialIssue);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>(initialIssue.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: issue.title,
    description: issue.description || "",
    status: issue.status,
    priority: issue.priority,
    reporter: issue.reporter || "",
    assignee: issue.assignee || "",
  });

  const handleStatusQuickChange = async (newStatus: IssueStatus) => {
    if (newStatus === issue.status || updating) return;
    try {
      setUpdating(true);
      setError(null);
      const updated = await updateIssue(issue.id, { status: newStatus });
      setIssue(updated);
      setEditForm((prev) => ({ ...prev, status: updated.status }));
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      const updated = await updateIssue(issue.id, {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status as IssueStatus,
        priority: editForm.priority as IssuePriority,
        reporter: editForm.reporter,
        assignee: editForm.assignee,
      });
      setIssue(updated);
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to save changes.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete issue #${issue.id}?`)) return;
    try {
      setDeleting(true);
      await deleteIssue(issue.id);
      router.push("/");
      router.refresh();
    } catch (err) {
      alert("Failed to delete issue");
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploading(true);
      setError(null);
      const newAttachments = await uploadAttachments(issue.id, Array.from(e.target.files));
      setAttachments((prev) => [...prev, ...newAttachments]);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to upload attachments");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm("Remove this attachment?")) return;
    try {
      setDeletingAttachmentId(attachmentId);
      await deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      router.refresh();
    } catch (err) {
      alert("Failed to delete attachment");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const getFileIcon = (resourceType: string) => {
    if (resourceType === "image") return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (resourceType === "video") return <Video className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issues
        </Link>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              Edit Issue
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setError(null);
                setEditForm({
                  title: issue.title,
                  description: issue.description || "",
                  status: issue.status,
                  priority: issue.priority,
                  reporter: issue.reporter || "",
                  assignee: issue.assignee || "",
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Edit
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-transparent rounded-lg transition-all cursor-pointer"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete Issue
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Issue Card / Edit Form */}
      {!isEditing ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
          {/* Title & Metadata Top Bar */}
          <div className="border-b border-slate-100 pb-6 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-bold text-slate-400">
                #{issue.id}
              </span>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full capitalize border ${
                  issue.priority === "high"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : issue.priority === "medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {issue.priority} Priority
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {issue.title}
            </h1>
          </div>

          {/* Quick Status Control Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Current Status:
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleStatusQuickChange("open")}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  issue.status === "open"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" />
                Open
              </button>

              <button
                onClick={() => handleStatusQuickChange("in_progress")}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  issue.status === "in_progress"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                In Progress
              </button>

              <button
                onClick={() => handleStatusQuickChange("closed")}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  issue.status === "closed"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Closed
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Description
            </h2>
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
              {issue.description || (
                <span className="italic text-slate-400">No description provided.</span>
              )}
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium block mb-1">Reporter</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {issue.reporter || "Unspecified"}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium block mb-1">Assignee</span>
              <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                {issue.assignee || "Unassigned"}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium block mb-1">Created At</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(issue.created_at)}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/60">
              <span className="text-slate-400 font-medium block mb-1">Updated At</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(issue.updated_at || issue.created_at)}
              </span>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments ({attachments.length})
              </h2>
              {issue.status !== "closed" && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="w-3.5 h-3.5" />
                  )}
                  {uploading ? "Uploading..." : "Add Files"}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {attachments.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No attachments yet.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-sm"
                  >
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors truncate"
                    >
                      {getFileIcon(att.resource_type)}
                      <span className="truncate">{att.file_name}</span>
                      <Download className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      disabled={deletingAttachmentId === att.id}
                      className="text-slate-400 hover:text-red-600 transition-colors shrink-0 ml-3 cursor-pointer"
                    >
                      {deletingAttachmentId === att.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Full Edit Form Card */
        <form
          onSubmit={handleSaveEdit}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Editing Issue #{issue.id}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify the details below and click Save Changes.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-y"
            />
          </div>

          {/* Status & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as IssueStatus })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as IssuePriority })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Reporter & Assignee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reporter Name
              </label>
              <input
                type="text"
                value={editForm.reporter}
                onChange={(e) => setEditForm({ ...editForm, reporter: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assignee Name
              </label>
              <input
                type="text"
                value={editForm.assignee}
                onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}