"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlanActionButton({
  planCode,
  current
}: {
  planCode: "free" | "small" | "pro" | "ultra" | "diamond" | "standard";
  current: boolean;
}) {
  if (current) {
    return (
      <Button className="w-full" variant="outline" disabled>
        <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1.5" />
        বর্তমান সক্রিয় প্যাকেজ (Active)
      </Button>
    );
  }

  if (planCode === "free") {
    return (
      <Button className="w-full" variant="outline" disabled>
        ডিফল্ট ফ্রি প্ল্যান (Free Tier)
      </Button>
    );
  }

  const normalizedCode = planCode === "standard" ? "pro" : planCode;
  const isDiamond = normalizedCode === "diamond";
  const isUltra = normalizedCode === "ultra";
  const isSmall = normalizedCode === "small";

  const buttonStyle = isDiamond
    ? "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white shadow-cyan-500/25"
    : isUltra
    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20"
    : isSmall
    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20";

  const buttonLabel = isDiamond
    ? "প্যাকেজটি কিনুন (Diamond - ৳৩,৫০০)"
    : isUltra
    ? "প্যাকেজটি কিনুন (Ultra - ৳১,০০০)"
    : isSmall
    ? "প্যাকেজটি কিনুন (Small - ৳২৫০)"
    : "প্যাকেজটি কিনুন (Pro - ৳৫০০)";

  return (
    <Button
      asChild
      className={`w-full gap-2 font-medium shadow-sm transition-all cursor-pointer ${buttonStyle}`}
    >
      <Link href={`/dashboard/checkout?plan=${normalizedCode}`}>
        <ShoppingCart className="h-4 w-4" />
        <span>{buttonLabel}</span>
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Link>
    </Button>
  );
}
