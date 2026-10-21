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
      <Button
        className="w-full h-11 rounded-xl font-bold bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 cursor-default shadow-xs flex items-center justify-center gap-1.5"
        variant="outline"
        disabled
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>বর্তমান সক্রিয় প্যাকেজ</span>
      </Button>
    );
  }

  if (planCode === "free") {
    return (
      <Button className="w-full h-11 rounded-xl font-medium" variant="outline" disabled>
        ফ্রি ট্রায়াল (Free Tier)
      </Button>
    );
  }

  const normalizedCode = planCode === "standard" ? "pro" : planCode;
  const isDiamond = normalizedCode === "diamond";
  const isUltra = normalizedCode === "ultra";
  const isSmall = normalizedCode === "small";

  const buttonStyle = isDiamond
    ? "bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md shadow-cyan-600/25 active:scale-[0.98]"
    : isUltra
    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 active:scale-[0.98]"
    : isSmall
    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98]"
    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98]";

  const buttonLabel = isDiamond
    ? "Diamond প্যাকেজ নিন"
    : isUltra
    ? "Ultra প্যাকেজ নিন"
    : isSmall
    ? "Small প্যাকেজ নিন"
    : "Pro প্যাকেজ নিন";

  return (
    <Button
      asChild
      className={`w-full h-11 rounded-xl gap-2 font-bold text-sm tracking-wide shadow-sm transition-all group cursor-pointer ${buttonStyle}`}
    >
      <Link href={`/dashboard/checkout?plan=${normalizedCode}`}>
        <ShoppingCart className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
        <span>{buttonLabel}</span>
        <ArrowRight className="h-4 w-4 ml-auto shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}
