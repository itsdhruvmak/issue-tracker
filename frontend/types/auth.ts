export type UserRole =
  | "internal_admin"
  | "internal_member"
  | "org_admin"
  | "client_member"
  | "admin"
  | "member";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  organization_id?: number;
  status?:string; //"pending" | "active"
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  username: string; // FastAPI OAuth2 form uses 'username' for email
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}

export interface VerifyOTPPayload {
  email: string;
  otp: string;
}

export interface ResendOTPPayload {
  email: string;
}

export interface UpdateUserPayload {
  full_name?: string;
  password?: string;
}
