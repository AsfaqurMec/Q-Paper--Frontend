import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, message: "Unauthenticated", data: null }, { status: 401 });
  return NextResponse.json({ success: true, message: "OK", data: user });
}
