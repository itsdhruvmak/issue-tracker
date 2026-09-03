import Link from "next/link";
import { Issue } from "@/types/issue";
import { User, AlertCircle, Clock, CheckCircle2, CircleDot, ArrowUpRight } from "lucide-react";

export default function IssueCard({ issue }: { issue: Issue }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
            <CircleDot className="w-3 h-3" />
            Open
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-red-100/80 text-red-800 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" />
            High
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-amber-100/80 text-amber-800 border border-amber-200">
            Medium
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Link
      href={`/issues/${issue.id}`}
      className="group block bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold text-slate-400">
            #{issue.id}
          </span>
          {getStatusBadge(issue.status)}
          {getPriorityBadge(issue.priority)}
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1.5">
        {issue.title}
      </h3>

      {issue.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {issue.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          {issue.reporter && (
            <span className="flex items-center gap-1 text-slate-600" title="Reporter">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{issue.reporter}</span>
            </span>
          )}
          {issue.assignee && (
            <span className="flex items-center gap-1 text-slate-600" title="Assignee">
              <span className="text-slate-400">→</span>
              <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {issue.assignee}
              </span>
            </span>
          )}
        </div>

        {issue.created_at && (
          <span className="text-slate-400 shrink-0">
            {formatDate(issue.created_at)}
          </span>
        )}
      </div>
    </Link>
  );
}