"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isInternalAdmin = user?.role === "internal_admin" || user?.role === "admin";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (requireAdmin && !isInternalAdmin) {
        router.push("/");
      }
    }
  }, [isLoading, isAuthenticated, user, requireAdmin, isInternalAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Checking authorization...</span>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !isInternalAdmin)) {
    return null;
  }

  return <>{children}</>;
}
