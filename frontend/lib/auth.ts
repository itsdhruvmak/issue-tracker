import Cookies from "js-cookie";
import { AuthTokens } from "@/types/auth";

const ACCESS_TOKEN_KEY = "it_access_token";
const REFRESH_TOKEN_KEY = "it_refresh_token";

export function getAccessToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return Cookies.get(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || undefined;
}

export function getRefreshToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return Cookies.get(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
}

export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  
  // Set in cookies for 7 days
  Cookies.set(ACCESS_TOKEN_KEY, tokens.access_token, { expires: 1 / 48, sameSite: "lax" }); // ~30 mins
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh_token, { expires: 7, sameSite: "lax" });

  // Backup in localStorage
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
