import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, USER_COOKIE, userCookieOptions } from "@/lib/auth";
import type { ApiResponse, UserSession } from "@/lib/api-types";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthenticated", data: null }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  const payload = (await response.json()) as ApiResponse<UserSession>;

  if (response.ok && payload.success && payload.data) {
    cookieStore.set(USER_COOKIE, JSON.stringify(payload.data), userCookieOptions);
  }

  return NextResponse.json(payload, { status: response.status });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthenticated", data: null }, { status: 401 });
  }

  const body = await request.json();
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as ApiResponse<UserSession>;

  if (response.ok && payload.success && payload.data) {
    cookieStore.set(USER_COOKIE, JSON.stringify(payload.data), userCookieOptions);
  }

  return NextResponse.json(payload, { status: response.status });
}
