"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getInviteInfoApi, acceptInviteApi } from "@/lib/api";
import { InvitePublicInfo } from "@/types/organization";
import { Building2, UserCheck, Lock, User, UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [inviteInfo, setInviteInfo] = useState<InvitePublicInfo | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    password: "",
    confirm_password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No invite token provided in the URL.");
      setLoadingToken(false);
      return;
    }

    getInviteInfoApi(token)
      .then((data) => {
        setInviteInfo(data);
        if (data.email) {
          const defaultUsername = data.email.split("@")[0];
          setFormData((prev) => ({ ...prev, username: defaultUsername }));
        }
      })
      .catch((err: any) => {
        setTokenError(err.message || "Invalid or expired invitation token.");
      })
      .finally(() => {
        setLoadingToken(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.password !== formData.confirm_password) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!token) return;

    setSubmitting(true);
    try {
      await acceptInviteApi(token, {
        username: formData.username,
        full_name: formData.full_name || undefined,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2500);
    } catch (err: any) {
      setFormError(err.message || "Failed to accept invite.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-medium">Validating invitation token...</p>
      </div>
    );
  }

  if (tokenError || (inviteInfo && !inviteInfo.is_valid)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200/80 shadow-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid or Expired Invite</h2>
        <p className="text-sm text-slate-600 mb-6">
          {tokenError || "This invitation link has expired or has already been used. Please ask your administrator to resend a new invite."}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-emerald-200/80 shadow-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Aboard!</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your account for <strong className="text-slate-900">{inviteInfo?.organization_name}</strong> has been activated successfully. Redirecting you to login...
        </p>
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Accept Invitation</h2>
        <p className="text-sm text-slate-500 mt-1">
          Join <span className="font-semibold text-blue-600">{inviteInfo?.organization_name}</span> on Issue Tracker
        </p>
      </div>

      <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
        <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-xs">
          <span className="text-slate-500 block">Invited Email:</span>
          <span className="font-semibold text-slate-900">{inviteInfo?.email}</span>
        </div>
      </div>

      {formError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Jane Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Choose Username *
          </label>
          <div className="relative">
            <UserCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="janedoe"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Set Password *
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 mt-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Activating Account...
            </>
          ) : (
            "Complete Account Setup"
          )}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600 text-sm font-medium">Loading invitation...</p>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}