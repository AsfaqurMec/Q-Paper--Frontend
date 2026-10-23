"use client";

import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanActionButton } from "@/components/plan-action-button";
import { formatBnNumber } from "@/lib/utils";
import type { Plan } from "@/lib/api-types";

interface SubscriptionPlanSliderProps {
  planList: Plan[];
  activePlanCode: string;
  mode?: "subscription" | "profile";
}

export function SubscriptionPlanSlider({
  planList,
  activePlanCode,
  mode = "subscription"
}: SubscriptionPlanSliderProps) {
  // Always sort plans strictly ascending according to price (0 -> 100 -> 500 -> 1000 -> 3500)
  const sortedPlans = [...planList].sort(
    (a, b) => Number(a.price || 0) - Number(b.price || 0)
  );

  const currentPlan =
    sortedPlans.find((p) => p.code === activePlanCode) || sortedPlans[0];

  const isFivePlans = sortedPlans.length === 5;

  return (
    <div className="relative space-y-4">
      {/* SECTION SUBHEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary font-bold px-2.5 py-0.5 text-xs">
            গ্রিড ভিউ (৩টি কার্ড প্রতি রো)
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            মূল্য ক্রমানুসারে (ছোট থেকে বড়) সাজানো
          </span>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground px-3 py-1 rounded-lg bg-muted/60 border">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>মোট {formatBnNumber(sortedPlans.length)}টি সাবস্ক্রিপশন প্যাকেজ</span>
        </div>
      </div>

      {/* 3-IN-A-ROW GRID FOR LARGE DEVICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-stretch pt-2">
        {sortedPlans.map((plan, idx) => {
          const isSmall = plan.code === "small";
          const isPro = plan.code === "pro";
          const isUltra = plan.code === "ultra";
          const isDiamond = plan.code === "diamond";
          const isFree = plan.code === "free";
          const isCurrent =
            activePlanCode === plan.code ||
            (plan.code === "pro" && activePlanCode === "standard");

          const durationText =
            plan.duration || (isFree ? "লাইফটাইম" : "৩০ দিন (১ মাস)");

          // On large screens (6 cols), each card takes 2 cols (= 3 cards per row).
          // When 5 plans are present, Card 4 (Ultra) starts at col 2 so row 2 is centered!
          const colSpanClass =
            isFivePlans && idx === 3
              ? "lg:col-span-2 lg:col-start-2"
              : isFivePlans && idx === 4
              ? "lg:col-span-2"
              : "lg:col-span-2";

          return (
            <div
              key={plan.code}
              className={`${colSpanClass} relative rounded-3xl p-5 sm:p-6 lg:p-6 flex flex-col justify-between transition-all duration-300 ${
                isCurrent
                  ? "bg-card border-2 border-emerald-600 shadow-xl ring-4 ring-emerald-500/20 z-10"
                  : isDiamond
                  ? "bg-card border-2 border-cyan-500 shadow-xl shadow-cyan-600/15 ring-2 ring-cyan-500/10 hover:shadow-2xl hover:-translate-y-1"
                  : isSmall
                  ? "bg-card border-2 border-emerald-500 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/10 hover:shadow-xl hover:-translate-y-1"
                  : isUltra
                  ? "bg-card border-2 border-purple-500/60 shadow-lg hover:border-purple-500 hover:shadow-xl hover:-translate-y-1"
                  : isPro
                  ? "bg-card border-2 border-blue-500/60 shadow-lg hover:border-blue-500 hover:shadow-xl hover:-translate-y-1"
                  : "bg-card border border-border shadow-xs hover:border-border/80 hover:shadow-md"
              }`}
            >
              {/* TOP STATUS BADGES */}
              {isCurrent ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black px-4 py-0.5 rounded-full shadow-md flex items-center gap-1.5 z-10 whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>বর্তমান প্যাকেজ</span>
                </div>
              ) : isSmall ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>সেরা ভ্যালু</span>
                </div>
              ) : isPro ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5" />
                  <span>জনপ্রিয় চয়েস</span>
                </div>
              ) : isUltra ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold px-3.5 py-0.5 rounded-full shadow-sm z-10 whitespace-nowrap">
                  কোচিংয়ের পছন্দ
                </div>
              ) : isDiamond ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 whitespace-nowrap">
                  <Crown className="w-3.5 h-3.5" />
                  <span>আনলিমিটেড সুপার</span>
                </div>
              ) : null}

              <div>
                {/* Plan Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-foreground capitalize">
                      {plan.name}
                    </h3>
                    {/* Clear Duration Pill Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{durationText}</span>
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] leading-relaxed">
                    {plan.description || (
                      <>
                        {isFree && "সফটওয়্যার পরীক্ষা ও ফ্রি ট্রায়াল"}
                        {isSmall && "ব্যক্তিগত শিক্ষক ও ছোট ব্যাচের জন্য সেরা"}
                        {isPro && "মাঝারি কোচিং ও পূর্ণাঙ্গ শিক্ষাপ্রতিষ্ঠান"}
                        {isUltra && "বড় কোচিং ও ওয়ার্ড (.docx) এক্সপোর্ট"}
                        {isDiamond && "সম্পূর্ণ আনলিমিটেড পেপার ও প্রশ্ন, ভিআইপি"}
                      </>
                    )}
                  </p>
                </div>

                {/* Price & Duration Block */}
                <div className="flex items-baseline justify-between gap-2 my-4 pb-4 border-b border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                      ৳{formatBnNumber(plan.price)}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isFree ? " / ফ্রি ট্রায়াল" : " / মাস"}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-foreground/80 bg-muted px-2.5 py-1 rounded-md border border-border/60">
                    মেয়াদ: {durationText}
                  </span>
                </div>

                {/* Core Capacity Box from Database */}
                <div
                  className={`rounded-2xl p-4 mb-5 space-y-2.5 border ${
                    isDiamond
                      ? "bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-200/80 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200"
                      : isSmall
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                      : isUltra
                      ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800 text-purple-950 dark:text-purple-200"
                      : isPro
                      ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800 text-blue-950 dark:text-blue-200"
                      : "bg-muted/40 border-border/60 text-foreground"
                  }`}
                >
                  {/* Dedicated Plan Duration Row */}
                  <div className="flex items-center justify-between text-xs font-black pb-2 border-b border-border/50">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      প্যাকেজের মেয়াদ:
                    </span>
                    <span className="font-extrabold text-foreground text-xs sm:text-sm">
                      {durationText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-black">
                    <span>মোট প্রশ্নপত্র:</span>
                    <span
                      className={
                        isDiamond
                          ? "text-cyan-700 dark:text-cyan-300 font-extrabold text-sm"
                          : isSmall
                          ? "text-emerald-700 dark:text-emerald-400 font-extrabold text-sm"
                          : "font-bold text-foreground"
                      }
                    >
                      {plan.paperLimit >= 999999 ? "আনলিমিটেড পেপার" : `${formatBnNumber(plan.paperLimit)} টি পেপার`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-black">
                    <span>সর্বোচ্চ প্রশ্ন লিমিট:</span>
                    <span
                      className={
                        isDiamond
                          ? "text-cyan-700 dark:text-cyan-300 font-extrabold text-sm"
                          : isSmall
                          ? "text-emerald-700 dark:text-emerald-400 font-extrabold text-sm"
                          : "font-bold text-foreground"
                      }
                    >
                      {plan.totalQuestionsLimit >= 999999 ? "আনলিমিটেড কোটা" : `${formatBnNumber(plan.totalQuestionsLimit)} টি`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-1 border-t border-border/40">
                    <span>প্রতি পেপারে সর্বোচ্চ:</span>
                    <span className="font-semibold text-foreground">
                      {plan.questionLimit >= 999999 ? "আনলিমিটেড প্রশ্ন" : `${formatBnNumber(plan.questionLimit)} টি প্রশ্ন`}
                    </span>
                  </div>
                </div>

                {/* Dynamic Feature Checklist from DB */}
                <div className="space-y-2.5 text-xs text-foreground/90 mb-6">
                  {/* Watermark */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {plan.watermark ? "ওয়াটারমার্ক সহ প্রিভিউ" : "কোনো ওয়াটারমার্ক নেই (ক্লিন PDF)"}
                    </span>
                  </div>

                  {/* Question Bank */}
                  <div className="flex items-start gap-2.5">
                    {plan.questionBank ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={plan.questionBank ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                      ৩,২০০+ প্রশ্নব্যাংক ফুল অ্যাক্সেস
                    </span>
                  </div>

                  {/* Random Generator */}
                  <div className="flex items-start gap-2.5">
                    {plan.randomGenerator ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={plan.randomGenerator ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                      অটোমেটিক ৩-ক্লিক র্যান্ডম জেনারেটর
                    </span>
                  </div>

                  {/* Branding */}
                  <div className="flex items-start gap-2.5">
                    {plan.branding ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={plan.branding ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                      প্রতিষ্ঠানের নিজস্ব নাম ও লোগো
                    </span>
                  </div>

                  {/* Multiple Versions */}
                  <div className="flex items-start gap-2.5">
                    {plan.multipleVersions ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={plan.multipleVersions ? "font-medium text-foreground" : "text-muted-foreground line-through"}>
                      ৪ সেট শাফলার (সেট ক, খ, গ, ঘ)
                    </span>
                  </div>

                  {/* Export Formats */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {plan.exports?.includes("docx") ? "PDF এবং MS Word (.docx) উভয় এক্সপোর্ট" : "প্রিন্ট-রেডি এ৪ PDF এক্সপোর্ট"}
                    </span>
                  </div>

                  {/* Question Import */}
                  <div className="flex items-start gap-2.5">
                    {plan.importQuestion ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={plan.importQuestion ? "font-semibold text-foreground" : "text-muted-foreground line-through"}>
                      {plan.importQuestion ? "AI প্রশ্ন ইমপোর্ট (ছবি, PDF, Word)" : "প্রশ্ন ইমপোর্ট (AI & OCR) বন্ধ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="pt-4 border-t border-border/40">
                {mode === "profile" ? (
                  isCurrent ? (
                    <Button variant="outline" className="w-full font-bold cursor-default bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" disabled>
                      <Check className="h-4 w-4 mr-1.5" />
                      সক্রিয় প্যাকেজ
                    </Button>
                  ) : (
                    <Button asChild variant="primary" className="w-full font-bold gap-1.5">
                      <Link href={`/dashboard/checkout?plan=${plan.code}`}>
                        <Sparkles className="h-4 w-4" />
                        {plan.price > currentPlan.price ? "আপগ্রেড করুন" : "প্যাকেজ পরিবর্তন"}
                      </Link>
                    </Button>
                  )
                ) : (
                  <PlanActionButton planCode={plan.code as any} current={isCurrent} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
