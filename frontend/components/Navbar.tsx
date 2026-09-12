"use client";

import React from "react";
import Link from "next/link";
import { CheckSquare, PlusCircle, ListTodo, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserDropdown from "@/components/auth/UserDropdown";

export default function Navbar() {
  const { user } = useAuth();
  const isClientUser = user?.role === "org_admin" || user?.role === "client_member";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href={isClientUser ? "/client-dashboard" : "/"}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Issue<span className="text-blue-600">Tracker</span>
          </span>
        </Link>

        {/* Dynamic Navigation Options */}
        <div className="flex items-center gap-3">
          {isClientUser ? (
            /* Client Links */
            <Link
              href="/client-dashboard"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200/60 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Client Dashboard
            </Link>
          ) : (
            /* Internal Team Links */
            <>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ListTodo className="w-4 h-4" />
                All Issues
              </Link>
              <Link
                href="/issues/new"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                New Issue
              </Link>
            </>
          )}

          <div className="h-6 w-[1px] bg-slate-200 mx-1" />

          {/* User Profile / Auth Dropdown */}
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
