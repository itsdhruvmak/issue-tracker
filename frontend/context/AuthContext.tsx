"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, LoginPayload, RegisterPayload, VerifyOTPPayload, ResendOTPPayload } from "@/types/auth";
import {
  getMeApi,
  loginApi,
  registerApi,
  verifyOTPApi,
  resendOTPApi,
  logoutApi,
} from "@/lib/api";
import { getAccessToken, clearTokens } from "@/lib/auth";

export function getRedirectPath(role?: UserRole): string {
  if (!role) return "/";
  if (role === "org_admin" || role === "client_member") {
    return "/client-dashboard";
  }
  if (role === "internal_admin" || role === "admin") {
    return "/admin";
  }
  return "/";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  verifyOTP: (payload: VerifyOTPPayload) => Promise<string>;
  resendOTP: (payload: ResendOTPPayload) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getMeApi();
      setUser(userData);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      await loginApi(payload);
      const currentUser = await getMeApi();
      setUser(currentUser);
      return currentUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    return await registerApi(payload);
  };

  const verifyOTP = async (payload: VerifyOTPPayload) => {
    const res = await verifyOTPApi(payload);
    return res.message;
  };

  const resendOTP = async (payload: ResendOTPPayload) => {
    const res = await resendOTPApi(payload);
    return res.message;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOTP,
        resendOTP,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
