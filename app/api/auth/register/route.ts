import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE, authCookieOptions, refreshCookieOptions, userCookieOptions } from "@/lib/auth";
import type { ApiResponse, AuthPayload } from "@/lib/api-types";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export async function POST(request: Request) {
  const body = await request.json();
  const cookieDeviceId = (await cookies()).get("qpaper_device_id")?.value;
  const deviceId = request.headers.get("x-device-id") || cookieDeviceId;
  const deviceFp = request.headers.get("x-device-fingerprint");
  const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (deviceId) forwardHeaders["x-device-id"] = deviceId;
  if (deviceFp) forwardHeaders["x-device-fingerprint"] = deviceFp;
  if (forwardedFor) forwardHeaders["x-forwarded-for"] = forwardedFor;
  if (userAgent) forwardHeaders["user-agent"] = userAgent;

  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: forwardHeaders,
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as ApiResponse<AuthPayload>;

  if (!response.ok || !payload.success) {
    return NextResponse.json(payload, { status: response.status });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, payload.data.accessToken, authCookieOptions);
  cookieStore.set(REFRESH_COOKIE, payload.data.refreshToken, refreshCookieOptions);
  cookieStore.set(USER_COOKIE, JSON.stringify(payload.data.user), userCookieOptions);

  return NextResponse.json({ success: true, message: "Account created", data: payload.data.user }, { status: 201 });
}
