"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { getIssues } from "@/lib/api";
import { Issue } from "@/types/issue";
import IssueList from "@/components/IssueList";
import { PlusCircle, CircleDot, Clock, CheckCircle2, Layers, Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const isClientUser = user?.role === "org_admin" || user?.role === "client_member";

  useEffect(() => {
    if (!authLoading) {
      // 1. If not logged in, redirect to login page
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      // 2. If client role, redirect to client portal
      if (isClientUser) {
        router.replace("/client-dashboard");
        return;
      }

      // 3. Authenticated internal team: fetch issues
      getIssues()
        .then((data) => setIssues(data))
        .catch((err) => console.error("Failed to load internal issues:", err))
        .finally(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated, isClientUser, router]);

  if (authLoading || !isAuthenticated || isClientUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Checking authorization...</span>
      </div>
    );
  }

  const openCount = issues.filter((i) => i.status === "open").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length;
  const closedCount = issues.filter((i) => i.status === "closed").length;

  return (
    <main className="space-y-8">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Internal Issue Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, assign, and resolve project bugs and requests across client accounts.
          </p>
        </div>

        <Link
          href="/issues/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:shadow-md self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Issue
        </Link>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 leading-none">
              {issues.length}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Total Issues</div>
          </div>
        </div>

        {/* Open Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <CircleDot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-600 leading-none">
              {openCount}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Open</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 leading-none">
              {inProgressCount}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">In Progress</div>
          </div>
        </div>

        {/* Closed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 leading-none">
              {closedCount}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Closed</div>
          </div>
        </div>
      </div>

      {/* Main Issues List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading internal issues...</p>
        </div>
      ) : (
        <IssueList issues={issues} />
      )}
    </main>
  );
}
