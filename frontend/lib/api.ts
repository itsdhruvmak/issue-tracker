import { Issue, IssueCreate, Attachment } from "@/types/issue";
import {
  User,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  VerifyOTPPayload,
  ResendOTPPayload,
  UpdateUserPayload,
} from "@/types/auth";
import {
  Organization,
  OrganizationCreatePayload,
  InvitePublicInfo,
  InviteAcceptPayload,
  InviteResponse,
} from "@/types/organization";
import { ClientIssue, ClientIssueCreatePayload } from "@/types/client_issue";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Helper fetch wrapper with Bearer token injection & auto-refresh retry
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, attempt to refresh token once and retry
  if (res.status === 401 && getRefreshToken()) {
    try {
      const newTokens = await refreshTokensApi();
      setTokens(newTokens);
      headers.set("Authorization", `Bearer ${newTokens.access_token}`);
      res = await fetch(url, { ...options, headers });
    } catch {
      clearTokens();
    }
  }

  return res;
}

// ── Auth Endpoints ────────────────────────────────────────────────────────────

export async function loginApi(payload: LoginPayload): Promise<AuthTokens> {
  const formData = new URLSearchParams();
  formData.append("username", payload.username);
  formData.append("password", payload.password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid login credentials");
  }

  const tokens: AuthTokens = await res.json();
  setTokens(tokens);
  return tokens;
}

export async function registerApi(payload: RegisterPayload): Promise<User> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to register account");
  }

  return res.json();
}

export async function verifyOTPApi(payload: VerifyOTPPayload): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid verification OTP");
  }

  return res.json();
}

export async function resendOTPApi(payload: ResendOTPPayload): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to resend OTP");
  }

  return res.json();
}

export async function refreshTokensApi(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh token expired");
  return res.json();
}

export async function getMeApi(): Promise<User> {
  const res = await fetchWithAuth(`${API_URL}/auth/me`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function updateMeApi(payload: UpdateUserPayload): Promise<User> {
  const res = await fetchWithAuth(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function logoutApi(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await fetchWithAuth(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => { });
  }
  clearTokens();
}

// ── Admin & Organization Endpoints ──────────────────────────────────────────────

export async function getAdminUsersApi(): Promise<User[]> {
  const res = await fetchWithAuth(`${API_URL}/admin/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load user list");
  return res.json();
}

export async function updateUserRoleApi(userId: number, role: string): Promise<User> {
  const res = await fetchWithAuth(`${API_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

export async function updateUserStatusApi(userId: number, is_active: boolean): Promise<User> {
  const res = await fetchWithAuth(`${API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) throw new Error("Failed to update user status");
  return res.json();
}

export async function createOrganizationApi(payload: OrganizationCreatePayload): Promise<Organization> {
  const res = await fetchWithAuth(`${API_URL}/admin/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create organization");
  }
  return res.json();
}

export async function getOrganizationsApi(): Promise<Organization[]> {
  const res = await fetchWithAuth(`${API_URL}/admin/organizations`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch organizations");
  return res.json();
}

export async function inviteOrgAdminApi(orgId: number, email: string): Promise<InviteResponse> {
  const res = await fetchWithAuth(`${API_URL}/admin/organizations/${orgId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate org_admin invite");
  }
  return res.json();
}

// ── Public Invites Endpoints ──────────────────────────────────────────────────

export async function getInviteInfoApi(token: string): Promise<InvitePublicInfo> {
  const res = await fetch(`${API_URL}/invites/${token}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid or expired invite token");
  }
  return res.json();
}

export async function acceptInviteApi(token: string, payload: InviteAcceptPayload): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/invites/${token}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to accept invitation");
  }
  return res.json();
}

// ── Client Team Management Endpoints ─────────────────────────────────────────

export async function getClientTeamApi(): Promise<User[]> {
  const res = await fetchWithAuth(`${API_URL}/client/team`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch team members");
  return res.json();
}

export async function inviteTeammateApi(email: string): Promise<InviteResponse> {
  const res = await fetchWithAuth(`${API_URL}/client/team/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to invite teammate");
  }
  return res.json();
}

export async function removeTeammateApi(userId: number): Promise<void> {
  const res = await fetchWithAuth(`${API_URL}/client/team/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove teammate");
}

// ── Client Issues Endpoints ───────────────────────────────────────────────────

export async function getClientIssuesApi(): Promise<ClientIssue[]> {
  const res = await fetchWithAuth(`${API_URL}/client/issues`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch organization issues");
  return res.json();
}

export async function createClientIssueApi(payload: ClientIssueCreatePayload): Promise<ClientIssue> {
  const res = await fetchWithAuth(`${API_URL}/client/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to log client issue");
  }
  return res.json();
}

// ── Issues & Attachments Endpoints ─────────────────────────────────────────────

export async function getIssues(): Promise<Issue[]> {
  const res = await fetchWithAuth(`${API_URL}/issues/`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Failed to fetch issues");
  }
  return res.json();
}

export async function getIssue(id: number): Promise<Issue> {
  const res = await fetchWithAuth(`${API_URL}/issues/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch issue");
  return res.json();
}

export async function createIssue(issue: IssueCreate): Promise<Issue> {
  const res = await fetchWithAuth(`${API_URL}/issues/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(issue),
  });
  if (!res.ok) throw new Error("Failed to create issue");
  return res.json();
}

export async function updateIssue(id: number, issue: Partial<IssueCreate>): Promise<Issue> {
  const res = await fetchWithAuth(`${API_URL}/issues/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(issue),
  });
  if (!res.ok) throw new Error("Failed to update issue");
  return res.json();
}

export async function deleteIssue(id: number): Promise<void> {
  const res = await fetchWithAuth(`${API_URL}/issues/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete issue");
}

export async function uploadAttachments(issueId: number, files: File[]): Promise<Attachment[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetchWithAuth(`${API_URL}/issues/${issueId}/attachments`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload attachments");
  return res.json();
}

export async function getAttachments(issueId: number): Promise<Attachment[]> {
  const res = await fetchWithAuth(`${API_URL}/issues/${issueId}/attachments`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch attachments");
  return res.json();
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  const res = await fetchWithAuth(`${API_URL}/issues/attachments/${attachmentId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete attachment");
}


export async function uploadClientAttachmentsApi(issueId: number, files: File[]): Promise<Attachment[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetchWithAuth(`${API_URL}/client/issues/${issueId}/attachments`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload attachments");
  }
  return res.json();
}

