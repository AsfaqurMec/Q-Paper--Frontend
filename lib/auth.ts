import { cookies } from "next/headers";
import type { UserSession } from "@/lib/api-types";

export const ACCESS_COOKIE = "examcraft_access";
export const REFRESH_COOKIE = "examcraft_refresh";
export const USER_COOKIE = "examcraft_user";

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getSessionUser(): Promise<UserSession | null> {
  const raw = (await cookies()).get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export const userCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30
};
