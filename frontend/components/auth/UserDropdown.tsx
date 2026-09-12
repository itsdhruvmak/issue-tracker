"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Shield, ChevronDown, CheckCircle2, LayoutDashboard, Building2 } from "lucide-react";

export default function UserDropdown() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const initial = (user.full_name || user.username || "U").charAt(0).toUpperCase();
  const isInternalAdmin = user.role === "internal_admin" || user.role === "admin";
  const isClientUser = user.role === "org_admin" || user.role === "client_member";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors focus:outline-none cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
          {initial}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
            {user.username}
            {user.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
          </div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {user.role}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user.full_name || user.username}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Shield className="w-3 h-3" />
              <span className="capitalize">{user.role}</span>
            </div>
          </div>

          <div className="py-1">
            {isInternalAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                Admin Panel
              </Link>
            )}

            {isClientUser && (
              <Link
                href="/client-dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                Client Dashboard
              </Link>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
