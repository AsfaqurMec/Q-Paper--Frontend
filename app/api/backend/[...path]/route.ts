import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
  authCookieOptions,
  refreshCookieOptions,
  userCookieOptions
} from "@/lib/auth";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const cookieStore = await cookies();
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  let token = cookieStore.get(ACCESS_COOKIE)?.value || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined);

  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required", data: null }, { status: 401 });
  }

  const { path } = await context.params;
  const url = new URL(request.url);
  const cleanPath = path[0] === "api" ? path.slice(1) : path;
  const backendUrl = `${API_URL}/api/${cleanPath.join("/")}${url.search}`;

  try {
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

    const cookieDeviceId = cookieStore.get("qpaper_device_id")?.value;
    const deviceId = request.headers.get("x-device-id") || cookieDeviceId;
    const deviceFp = request.headers.get("x-device-fingerprint");
    const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    const proxyHeaders: Record<string, string> = {
      "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      Authorization: `Bearer ${token}`
    };
    if (deviceId) proxyHeaders["x-device-id"] = deviceId;
    if (deviceFp) proxyHeaders["x-device-fingerprint"] = deviceFp;
    if (forwardedFor) proxyHeaders["x-forwarded-for"] = forwardedFor;
    if (userAgent) proxyHeaders["user-agent"] = userAgent;

    let response = await fetch(backendUrl, {
      method: request.method,
      headers: proxyHeaders,
      body,
      cache: "no-store"
    });

    // Seamless automatic token rotation if access token expired (15m TTL)
    if (response.status === 401) {
      const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
          });
          const refreshPayload = await refreshRes.json();
          if (refreshRes.ok && refreshPayload.success && refreshPayload.data?.accessToken) {
            cookieStore.set(ACCESS_COOKIE, refreshPayload.data.accessToken, authCookieOptions);
            cookieStore.set(REFRESH_COOKIE, refreshPayload.data.refreshToken, refreshCookieOptions);
            if (refreshPayload.data.user) {
              cookieStore.set(USER_COOKIE, JSON.stringify(refreshPayload.data.user), userCookieOptions);
            }
            proxyHeaders.Authorization = `Bearer ${refreshPayload.data.accessToken}`;
            response = await fetch(backendUrl, {
              method: request.method,
              headers: proxyHeaders,
              body,
              cache: "no-store"
            });
          }
        } catch (refreshErr) {
          console.warn("[Proxy] Automatic session refresh failed:", refreshErr);
        }
      }
    }

    const headers = new Headers();
    const headerKeysToForward = [
      "content-type",
      "content-disposition",
      "cache-control"
    ];
    for (const key of headerKeysToForward) {
      const val = response.headers.get(key);
      if (val) headers.set(key, val);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Proxy] Error forwarding to ${backendUrl}:`, errorMessage);
    const clientMessage =
      process.env.NODE_ENV === "production"
        ? "Backend service communication failed. Please try again later."
        : `Backend service communication failed: ${errorMessage}`;
    return NextResponse.json(
      {
        success: false,
        message: clientMessage,
        data: null
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
