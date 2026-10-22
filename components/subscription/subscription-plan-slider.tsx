"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCircle2
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
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollState = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

    // Calculate which card is currently active / leftmost in view
    const card = sliderRef.current.children[0] as HTMLElement | undefined;
    if (card) {
      const cardWidth = card.offsetWidth + 24; // width + gap
      const newIdx = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(planList.length - 1, Math.max(0, newIdx)));
    }
  }, [planList.length]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    checkScrollState();
    window.addEventListener("resize", checkScrollState);
    return () => window.removeEventListener("resize", checkScrollState);
  }, [checkScrollState]);

  // Scroll to user's active plan initially if it's beyond the first 3
  useEffect(() => {
    if (!sliderRef.current) return;
    const activeIdx = planList.findIndex((p) => p.code === activePlanCode);
    if (activeIdx > 2) {
      scrollToIndex(activeIdx);
    }
  }, [activePlanCode, planList]);

  const getScrollAmount = () => {
    if (!sliderRef.current) return 360;
    const firstCard = sliderRef.current.children[0] as HTMLElement | undefined;
    return firstCard ? firstCard.offsetWidth + 24 : 360;
  };

  const handlePrev = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  };

  const handleNext = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
  };

  const scrollToIndex = (idx: number) => {
    if (!sliderRef.current) return;
    const cards = sliderRef.current.children;
    if (cards[idx]) {
      (cards[idx] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start"
      });
    }
  };

  const currentPlan = planList.find((p) => p.code === activePlanCode) || planList[0];

  return (
    <div className="relative space-y-4">
      {/* TOP CONTROLS & SLIDE HINT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 text-primary font-bold px-2.5 py-0.5 text-xs">
            গ্রিড ভিউ (৩টি কার্ড)
          </Badge>
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            অন্যান্য প্যাকেজ দেখতে স্লাইড করুন
            <span className="inline-block animate-pulse text-primary font-bold">➔</span>
          </span>
        </div>

        {/* PREV / NEXT ARROW BUTTONS & STEP INDICATOR */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-xs font-semibold text-muted-foreground px-2.5 py-1 rounded-lg bg-muted/60 border">
            প্যাকেজ{" "}
            <span className="font-bold text-foreground">
              {formatBnNumber(activeIndex + 1)}-{formatBnNumber(Math.min(activeIndex + 3, planList.length))}
            </span>{" "}
            / {formatBnNumber(planList.length)}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={!canScrollLeft}
            className="h-8 w-8 rounded-lg shadow-xs hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
            aria-label="পূর্ববর্তী প্যাকেজ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!canScrollRight}
            className="h-8 w-8 rounded-lg shadow-xs hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
            aria-label="পরবর্তী প্যাকেজ"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SLIDER CAROUSEL TRACK WITH FLOATING SIDE BUTTONS */}
      <div className="relative group">
        {/* Floating Left Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canScrollLeft}
          className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-background/95 border-2 border-border shadow-xl backdrop-blur flex items-center justify-center text-foreground hover:bg-muted hover:scale-110 active:scale-95 transition-all cursor-pointer ${
            !canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
          aria-label="পূর্ববর্তী প্যাকেজ"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
        </button>

        {/* Floating Right Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canScrollRight}
          className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-background/95 border-2 border-border shadow-xl backdrop-blur flex items-center justify-center text-foreground hover:bg-muted hover:scale-110 active:scale-95 transition-all cursor-pointer ${
            !canScrollRight ? "opacity-0 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
          aria-label="পরবর্তী প্যাকেজ"
        >
          <ChevronRight className="h-6 w-6 stroke-[2.5]" />
        </button>

        {/* THE SCROLLABLE GRID TRACK (3 CARDS VISIBLE ON DESKTOP) */}
        <div
          ref={sliderRef}
          onScroll={checkScrollState}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pt-5 pb-6 px-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-stretch"
        >
          {planList.map((plan) => {
            const isSmall = plan.code === "small";
            const isPro = plan.code === "pro";
            const isUltra = plan.code === "ultra";
            const isDiamond = plan.code === "diamond";
            const isFree = plan.code === "free";
            const isCurrent = activePlanCode === plan.code || (plan.code === "pro" && activePlanCode === "standard");

            return (
              <div
                key={plan.code}
                className={`shrink-0 w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] snap-start relative rounded-3xl p-5 sm:p-6 lg:p-6 flex flex-col justify-between transition-all duration-300 ${
                  isCurrent
                    ? "bg-card border-2 border-emerald-600 shadow-xl ring-4 ring-emerald-500/20 z-10"
                    : isDiamond
                    ? "bg-card border-2 border-cyan-500 shadow-xl shadow-cyan-600/15 ring-2 ring-cyan-500/10 hover:shadow-2xl"
                    : isSmall
                    ? "bg-card border-2 border-emerald-500 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/10 hover:shadow-xl"
                    : isUltra
                    ? "bg-card border-2 border-purple-500/60 shadow-lg hover:border-purple-500 hover:shadow-xl"
                    : isPro
                    ? "bg-card border-2 border-blue-500/60 shadow-lg hover:border-blue-500 hover:shadow-xl"
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl sm:text-2xl font-black text-foreground capitalize">
                        {plan.name}
                      </h3>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2.5 py-0.5 rounded-md">
                        {plan.duration || (plan.price === 0 ? "লাইফটাইম" : "৩০ দিন")}
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
                  <div className="flex items-center justify-between my-4 pb-4 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                        ৳{formatBnNumber(plan.price)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        / {plan.price === 0 ? "ফ্রি ট্রায়াল" : plan.interval === "month" ? "মাসিক" : "মেয়াদ"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      {plan.duration || (plan.price === 0 ? "লাইফটাইম" : "৩০ দিন")}
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
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>প্যাকেজের মেয়াদ:</span>
                      <span className="font-bold text-foreground">
                        {plan.duration || (plan.price === 0 ? "লাইফটাইম" : "৩০ দিন")}
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
                  <div className="space-y-3 text-xs text-foreground/90 mb-6">
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

      {/* BOTTOM DOT INDICATORS & INTERACTIVE PILLS */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border">
          {planList.map((plan, idx) => {
            const isCurrent = activePlanCode === plan.code;
            const isVisible = idx >= activeIndex && idx < activeIndex + 3;

            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isVisible
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={`${plan.name} প্যাকেজে স্ক্রোল করুন`}
              >
                <span className={`h-2 w-2 rounded-full ${isCurrent ? "bg-emerald-400" : isVisible ? "bg-white" : "bg-muted-foreground/40"}`} />
                <span className="capitalize">{plan.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
