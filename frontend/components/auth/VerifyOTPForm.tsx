"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, RotateCw } from "lucide-react";

export default function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const { verifyOTP, resendOTP } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resend OTP Countdown Timer (60s)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Handle countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1); // keep last digit if multiple typed
    setOtpDigits(newOtp);

    // Auto-advance focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }

    if (!email) {
      setError("Email address is required");
      return;
    }

    setLoading(true);

    try {
      const msg = await verifyOTP({ email, otp: otpCode });
      setSuccessMsg(msg);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const msg = await resendOTP({ email });
      setSuccessMsg(msg);
      setTimer(60);
      setCanResend(false);
      setOtpDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h2>
        <p className="text-sm text-slate-500 mt-1">
          We sent a 6-digit OTP code to <br />
          <strong className="text-slate-700">{email || "your email"}</strong>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!emailParam && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
            Enter 6-Digit Verification Code
          </label>
          <div className="flex items-center justify-between gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 text-indigo-900 transition-all shadow-inner"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otpDigits.join("").length !== 6}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying Code...
            </>
          ) : (
            "Verify & Continue"
          )}
        </button>
      </form>

      {/* Resend Timer & Link */}
      <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-5">
        Didn&apos;t receive the code?{" "}
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1 ml-1"
          >
            {resending && <RotateCw className="w-3 h-3 animate-spin" />}
            Resend OTP
          </button>
        ) : (
          <span className="font-semibold text-slate-400">
            Resend in {timer}s
          </span>
        )}
      </div>

      <div className="mt-4 text-center text-xs text-slate-400">
        Back to{" "}
        <Link href="/login" className="font-semibold text-slate-600 hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}
