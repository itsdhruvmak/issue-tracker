import IssueForm from "@/components/IssueForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";

export default function NewIssuePage() {
  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto space-y-6">
        {/* Back Button & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Issues
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Create New Issue
              </h1>
              <p className="text-sm text-slate-500">
                Fill out the details below to report or assign a new task.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
          <IssueForm />
        </div>
      </main>
    </ProtectedRoute>
  );
}