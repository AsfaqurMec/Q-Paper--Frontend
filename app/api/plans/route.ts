import { NextResponse } from "next/server";
import { fetchPlans } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await fetchPlans();
    return NextResponse.json({ success: true, message: "OK", data: plans });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to load plans", data: [] },
      { status: 500 }
    );
  }
}
