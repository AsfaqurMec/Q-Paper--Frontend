import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
