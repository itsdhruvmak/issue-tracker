import { getIssue } from "@/lib/api";
import IssueDetail from "@/components/IssueDetail";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const issueId = Number(resolvedParams.id);

  try {
    const issue = await getIssue(issueId);
    return <IssueDetail initialIssue={issue} />;
  } catch (error) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Issue Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested issue #{issueId} could not be found or has been deleted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issues
        </Link>
      </div>
    );
  }
}