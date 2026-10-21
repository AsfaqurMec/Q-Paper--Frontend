import Link from "next/link";
import {
  Check,
  X,
  Shield,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Crown,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Infinity as InfinityIcon,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { PlanActionButton } from "@/components/plan-action-button";
import type { Plan } from "@/lib/api-types";

const DEFAULT_FALLBACK_PLANS: Plan[] = [
  {
    code: "free",
    name: "Free",
    price: 0,
    interval: "month",
    paperLimit: 2,
    questionLimit: 30,
    totalQuestionsLimit: 60,
    exports: ["pdf"],
    importQuestion: false,
    watermark: true,
    questionBank: false,
    branding: false,
    randomGenerator: false,
    multipleVersions: false
  },
  {
    code: "small",
    name: "Small",
    price: 100,
    interval: "month",
    paperLimit: 100,
    questionLimit: 50,
    totalQuestionsLimit: 3500,
    exports: ["pdf"],
    importQuestion: false,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  },
  {
    code: "pro",
    name: "Pro",
    price: 500,
    interval: "month",
    paperLimit: 2000,
    questionLimit: 200,
    totalQuestionsLimit: 7000,
    exports: ["pdf"],
    importQuestion: false,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  },
  {
    code: "ultra",
    name: "Ultra",
    price: 1000,
    interval: "month",
    paperLimit: 5000,
    questionLimit: 500,
    totalQuestionsLimit: 15000,
    exports: ["pdf", "docx"],
    importQuestion: true,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  },
  {
    code: "diamond",
    name: "Diamond",
    price: 3500,
    interval: "month",
    paperLimit: 999999,
    questionLimit: 999999,
    totalQuestionsLimit: 999999,
    exports: ["pdf", "docx"],
    importQuestion: true,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  }
];

interface PlanMeta {
  subtitle: string;
  badge?: string;
  popular?: boolean;
  colorTheme: "slate" | "emerald" | "blue" | "purple" | "cyan";
  icon: any;
}

const PLAN_META_MAP: Record<string, PlanMeta> = {
  free: {
    subtitle: "নতুন শিক্ষকদের জন্য পরীক্ষামূলক প্যাকেজ",
    badge: "ফ্রি ট্রায়াল",
    colorTheme: "slate",
    icon: Shield
  },
  small: {
    subtitle: "একক শিক্ষক ও প্রাইভেট টিউটরদের জন্য",
    badge: "সেরা ভ্যালু • বাজেট ফ্রেন্ডলি",
    colorTheme: "emerald",
    icon: Zap
  },
  pro: {
    subtitle: "মাঝারি কোচিং ও পূর্ণাঙ্গ শিক্ষাপ্রতিষ্ঠান",
    badge: "জনপ্রিয় চয়েস",
    popular: true,
    colorTheme: "blue",
    icon: Sparkles
  },
  ultra: {
    subtitle: "স্কুল, কলেজ ও ওয়ার্ড (.docx) এক্সপোর্ট",
    badge: "অল-ইন-ওয়ান সমাধান",
    colorTheme: "purple",
    icon: Layers
  },
  diamond: {
    subtitle: "সম্পূর্ণ আনলিমিটেড পেপার ও ভিআইপি সাপোর্ট",
    badge: "আনলিমিটেড সুপার",
    colorTheme: "cyan",
    icon: Crown
  }
};

export default async function SubscriptionPage() {
  const [dbPlans, currentUser, myRequests] = await Promise.all([
    api.plans().catch(() => []),
    getSessionUser(),
    api.myPaymentRequests().catch(() => [])
  ]);

  const activePlanCode = currentUser?.plan || "free";
  const pendingRequest = myRequests.find((r) => r.status === "pending");

  // Merge DB plans with fallback to guarantee all 5 plans exist and maintain correct order
  const order = ["free", "small", "pro", "ultra", "diamond"];
  const displayPlans: Plan[] = order.map((code) => {
    const found = dbPlans.find((p) => p.code === code);
    if (found) return found;
    return DEFAULT_FALLBACK_PLANS.find((p) => p.code === code)!;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* PENDING PAYMENT NOTICE */}
      {pendingRequest && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm">আপনার একটি পেমেন্ট রিকোয়েস্ট যাচাইয়ের অপেক্ষায় আছে</p>
              <p className="text-muted-foreground mt-0.5">
                প্যাকেজ: <span className="font-semibold text-foreground">{pendingRequest.planName}</span> • TrxID:{" "}
                <span className="font-mono font-semibold text-foreground">{pendingRequest.transactionId}</span> • এডমিন যাচাই শেষে অতি দ্রুত আপনার অ্যাকাউন্ট সক্রিয় করবে।
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 h-8 gap-1.5 shrink-0 rounded-lg font-semibold">
            <Link href="/dashboard/checkout">
              চেকআউটে দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30 font-bold px-2.5 py-0.5">
              সাবস্ক্রিপশন প্যাকেজ
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">সরাসরি ডেটাবেস হতে পরিচালিত প্ল্যান ও লিমিট</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            প্যাকেজ ও মূল্য তালিকা
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            আপনার শিক্ষাপ্রতিষ্ঠান বা কোচিং সেন্টারের প্রয়োজন অনুযায়ী সেরা প্যাকেজটি বেছে নিন। প্রতিটি লিমিট ও পারমিশন সিস্টেমের ব্যাকএন্ডে রিয়েল-টাইমে সংরক্ষিত থাকে।
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border text-xs text-muted-foreground shrink-0 font-medium self-start md:self-end">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>১০০% নিরাপদ ও ইনস্ট্যান্ট ভেরিফিকেশন</span>
        </div>
      </div>

      {/* DYNAMIC PRICING CARDS GRID */}
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-stretch">
        {displayPlans.map((plan) => {
          const isCurrent = activePlanCode === plan.code || (plan.code === "pro" && activePlanCode === "standard");
          const meta = PLAN_META_MAP[plan.code] || {
            subtitle: "স্ট্যান্ডার্ড সুবিধা",
            colorTheme: "slate" as const,
            icon: Shield
          };
          const IconComponent = meta.icon;

          // Compute themed classes
          let cardBorderBg = "border-border/80 hover:border-border hover:shadow-md bg-card";
          let badgeClass = "text-muted-foreground border-border/80 bg-muted/30";
          let quotaBoxClass = "bg-muted/40 border-border/60";
          let quotaHighlight = "text-foreground font-bold";
          let iconBg = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

          if (meta.colorTheme === "emerald") {
            cardBorderBg = isCurrent
              ? "border-emerald-600 shadow-lg ring-2 ring-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.04] to-card"
              : "border-emerald-500/40 hover:border-emerald-500/80 shadow-xs hover:shadow-md bg-gradient-to-b from-emerald-500/[0.04] to-card";
            badgeClass = "text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30";
            quotaBoxClass = "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30";
            quotaHighlight = "text-emerald-700 dark:text-emerald-400 font-extrabold";
            iconBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
          } else if (meta.colorTheme === "blue") {
            cardBorderBg = isCurrent
              ? "border-blue-600 shadow-xl ring-2 ring-blue-500/25 bg-gradient-to-b from-blue-500/[0.05] to-card"
              : "border-blue-500/50 hover:border-blue-500 shadow-md hover:shadow-xl ring-1 ring-blue-500/20 bg-gradient-to-b from-blue-500/[0.05] to-card";
            badgeClass = "text-blue-700 dark:text-blue-400 border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/30";
            quotaBoxClass = "bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/30";
            quotaHighlight = "text-blue-700 dark:text-blue-400 font-extrabold";
            iconBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
          } else if (meta.colorTheme === "purple") {
            cardBorderBg = isCurrent
              ? "border-purple-600 shadow-xl ring-2 ring-purple-500/30 bg-gradient-to-b from-purple-500/[0.05] to-card"
              : "border-purple-500/40 hover:border-purple-500/80 shadow-xs hover:shadow-md bg-gradient-to-b from-purple-500/[0.05] to-card";
            badgeClass = "text-purple-700 dark:text-purple-400 border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/30";
            quotaBoxClass = "bg-purple-50/60 dark:bg-purple-950/20 border-purple-500/30";
            quotaHighlight = "text-purple-700 dark:text-purple-400 font-extrabold";
            iconBg = "bg-purple-500/10 text-purple-600 dark:text-purple-400";
          } else if (meta.colorTheme === "cyan") {
            cardBorderBg = isCurrent
              ? "border-cyan-500 shadow-xl ring-2 ring-cyan-500/40 bg-gradient-to-b from-cyan-500/[0.08] via-cyan-500/[0.02] to-card"
              : "border-cyan-500/50 hover:border-cyan-400 shadow-md hover:shadow-xl ring-1 ring-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.08] via-cyan-500/[0.02] to-card";
            badgeClass = "text-cyan-700 dark:text-cyan-300 border-cyan-500/50 bg-cyan-50/60 dark:bg-cyan-950/40";
            quotaBoxClass = "bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-500/40";
            quotaHighlight = "text-cyan-700 dark:text-cyan-300 font-extrabold";
            iconBg = "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300";
          }

          const hasUnlimitedPapers = plan.paperLimit >= 999999;
          const hasUnlimitedTotalQuestions = plan.totalQuestionsLimit >= 999999;
          const hasUnlimitedPaperQuestions = plan.questionLimit >= 999999;
          const hasDocx = plan.exports?.includes("docx");

          return (
            <div
              key={plan.code}
              className={`relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 border ${cardBorderBg}`}
            >
              {/* TOP STATUS BADGES */}
              {isCurrent ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>বর্তমান প্যাকেজ</span>
                </div>
              ) : meta.popular ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10">
                  <Zap className="w-3 h-3" />
                  <span>{meta.badge || "জনপ্রিয় চয়েস"}</span>
                </div>
              ) : plan.code === "diamond" ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
                  <Crown className="w-3 h-3" />
                  <span>{meta.badge || "আনলিমিটেড সুপার"}</span>
                </div>
              ) : null}

              <div>
                {/* Header: Title & Sub-badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold ${iconBg}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{plan.name}</h3>
                  </div>
                  {meta.badge && !isCurrent && !meta.popular && plan.code !== "diamond" && (
                    <Badge variant="outline" className={`text-[11px] font-semibold ${badgeClass}`}>
                      {meta.badge}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2 min-h-[32px] leading-relaxed">
                  {meta.subtitle}
                </p>

                {/* Price Display */}
                <div className="mt-3 pb-4 border-b border-border/60 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    ৳{plan.price.toLocaleString("bn-BD")}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {plan.price === 0 ? "/ফ্রি ট্রায়াল" : "/মাসিক"}
                  </span>
                </div>

                {/* Quota Highlights Box */}
                <div className={`my-4 rounded-xl p-3 border space-y-2 text-xs ${quotaBoxClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">প্রশ্নপত্র লিমিট:</span>
                    <span className={quotaHighlight}>
                      {hasUnlimitedPapers ? (
                        <span className="inline-flex items-center gap-1">
                          <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                        </span>
                      ) : (
                        `${plan.paperLimit.toLocaleString("bn-BD")}টি পেপার`
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">মোট প্রশ্ন কোটা:</span>
                    <span className={quotaHighlight}>
                      {hasUnlimitedTotalQuestions ? (
                        <span className="inline-flex items-center gap-1">
                          <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                        </span>
                      ) : (
                        `${plan.totalQuestionsLimit.toLocaleString("bn-BD")}টি প্রশ্ন`
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <span className="text-muted-foreground">প্রতি পেপারে:</span>
                    <span className="font-medium text-foreground">
                      {hasUnlimitedPaperQuestions ? "আনলিমিটেড প্রশ্ন" : `সর্বোচ্চ ${plan.questionLimit.toLocaleString("bn-BD")}টি`}
                    </span>
                  </div>
                </div>

                {/* Dynamic Feature Checklist from DB Record */}
                <div className="space-y-2.5 text-xs text-foreground/90">
                  {/* Paper Quota Feature */}
                  <div className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>
                      {hasUnlimitedPapers ? (
                        <strong>সম্পূর্ণ আনলিমিটেড প্রশ্নপত্র</strong>
                      ) : (
                        <><strong>{plan.paperLimit.toLocaleString("bn-BD")}টি প্রশ্নপত্র</strong> তৈরির সুবিধা</>
                      )}
                    </span>
                  </div>

                  {/* Total Questions Feature */}
                  <div className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span>
                      {hasUnlimitedTotalQuestions ? (
                        <strong>আনলিমিটেড প্রশ্ন তৈরির লাইব্রেরি</strong>
                      ) : (
                        <>মোট <strong>{plan.totalQuestionsLimit.toLocaleString("bn-BD")}টি প্রশ্ন</strong> তৈরির কোটা</>
                      )}
                    </span>
                  </div>

                  {/* Watermark Feature */}
                  <div className="flex items-start gap-2">
                    {!plan.watermark ? (
                      <>
                        <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span><strong>কোনো ওয়াটারমার্ক নেই</strong> (Clean PDF)</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <HelpCircle className="h-3 w-3" />
                        </div>
                        <span className="text-muted-foreground">ওয়াটারমার্ক সহ PDF এক্সপোর্ট</span>
                      </>
                    )}
                  </div>

                  {/* Export Format Feature */}
                  <div className="flex items-start gap-2">
                    {hasDocx ? (
                      <>
                        <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span><strong>PDF ও DOCS (Word) উভয়</strong> এক্সপোর্ট</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span>উচ্চ মানের <strong>PDF এক্সপোর্ট</strong></span>
                      </>
                    )}
                  </div>

                  {/* Import Question Feature (AI & OCR) */}
                  <div className={`flex items-start gap-2 ${plan.importQuestion ? "" : "text-muted-foreground"}`}>
                    {plan.importQuestion ? (
                      <>
                        <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span><strong>AI প্রশ্ন ইমপোর্ট:</strong> ছবি, PDF ও Word হতে অটো প্রশ্ন</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span>প্রশ্ন ইমপোর্ট (AI & OCR) বন্ধ</span>
                      </>
                    )}
                  </div>

                  {/* Word Export Missing Check for lower tiers */}
                  {!hasDocx && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Word (.docx) এক্সপোর্ট নেই</span>
                    </div>
                  )}

                  {/* Branding Feature */}
                  {plan.branding ? (
                    <div className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>
                        {plan.code === "diamond" ? (
                          <strong>প্রতিষ্ঠান ব্র্যান্ডিং (লোগো ও ফুল নিয়ন্ত্রণ)</strong>
                        ) : (
                          <>প্রতিষ্ঠানের নিজস্ব <strong>নাম ও লোগো ব্র্যান্ডিং</strong></>
                        )}
                      </span>
                    </div>
                  ) : null}

                  {/* Question Bank & Multiple Versions */}
                  {plan.questionBank && (
                    <div className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>প্রশ্ন ব্যাংক ও ৪-সেট ওএমআর প্রশ্ন জেনারেশন</span>
                    </div>
                  )}

                  {/* Diamond VIP Support Highlight */}
                  {plan.code === "diamond" && (
                    <div className="flex items-start gap-2">
                      <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span><strong>২৪/৭ ভিআইপি অগ্রাধিকার</strong> কাস্টমার সাপোর্ট</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-6 pt-4 border-t border-border/40">
                <PlanActionButton planCode={plan.code} current={isCurrent} />
              </div>
            </div>
          );
        })}
      </div>

      {/* DYNAMIC FEATURE COMPARISON TABLE */}
      <div className="rounded-2xl sm:rounded-3xl border bg-card p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              প্যাকেজ ভিত্তিক ফিচার তুলনা (Feature Matrix)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              সকল প্যাকেজের তুলনামূলক সুবিধা ও কোটা তালিকা (সরাসরি ডেটাবেস থেকে রেন্ডারকৃত)
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-xs font-semibold">
            স্বচ্ছ মূল্য তালিকা
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[750px]">
            <thead>
              <tr className="border-b text-left text-muted-foreground bg-muted/20">
                <th className="py-3 px-3 font-semibold text-foreground">ফিচারসমূহ</th>
                {displayPlans.map((p) => {
                  const meta = PLAN_META_MAP[p.code];
                  let colorClass = "text-foreground font-semibold";
                  if (meta?.colorTheme === "emerald") colorClass = "text-emerald-600 font-bold";
                  if (meta?.colorTheme === "blue") colorClass = "text-blue-600 font-bold";
                  if (meta?.colorTheme === "purple") colorClass = "text-purple-600 font-bold";
                  if (meta?.colorTheme === "cyan") colorClass = "text-cyan-600 font-bold";

                  return (
                    <th key={p.code} className={`py-3 px-3 ${colorClass}`}>
                      {p.name} (৳{p.price.toLocaleString("bn-BD")}{p.price > 0 ? "/মা" : ""})
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y text-muted-foreground">
              {/* Paper Limit Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রশ্নপত্র লিমিট (Papers Limit)</td>
                {displayPlans.map((p) => (
                  <td key={p.code} className="py-3 px-3">
                    {p.paperLimit >= 999999 ? (
                      <span className="font-bold text-cyan-600 flex items-center gap-1">
                        <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                      </span>
                    ) : (
                      `${p.paperLimit.toLocaleString("bn-BD")}টি প্রশ্নপত্র`
                    )}
                  </td>
                ))}
              </tr>

              {/* Questions Limit Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">মোট প্রশ্ন সংখ্যা (Questions Limit)</td>
                {displayPlans.map((p) => (
                  <td key={p.code} className="py-3 px-3">
                    {p.totalQuestionsLimit >= 999999 ? (
                      <span className="font-bold text-cyan-600 flex items-center gap-1">
                        <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                      </span>
                    ) : (
                      `${p.totalQuestionsLimit.toLocaleString("bn-BD")}টি (${p.questionLimit.toLocaleString("bn-BD")}/পত্র)`
                    )}
                  </td>
                ))}
              </tr>

              {/* Export Formats Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">এক্সপোর্ট ফরম্যাট</td>
                {displayPlans.map((p) => {
                  const hasDocx = p.exports?.includes("docx");
                  return (
                    <td key={p.code} className={`py-3 px-3 ${hasDocx ? "font-bold text-emerald-600" : ""}`}>
                      {hasDocx ? "PDF & DOCS (উভয়ই)" : "শুধুমাত্র PDF"}
                    </td>
                  );
                })}
              </tr>

              {/* AI Question Import Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রশ্ন ইমপোর্ট (AI & OCR)</td>
                {displayPlans.map((p) => (
                  <td
                    key={p.code}
                    className={`py-3 px-3 font-semibold ${p.importQuestion ? "text-emerald-600 font-bold" : "text-rose-500"}`}
                  >
                    {p.importQuestion ? "চালু (ON)" : "বন্ধ (OFF)"}
                  </td>
                ))}
              </tr>

              {/* Watermark Free Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">ওয়াটারমার্ক মুক্ত প্রিন্ট</td>
                {displayPlans.map((p) => (
                  <td
                    key={p.code}
                    className={`py-3 px-3 ${!p.watermark ? "text-emerald-600 font-semibold" : "text-rose-500"}`}
                  >
                    {!p.watermark ? "হ্যাঁ (মুক্ত)" : "ওয়াটারমার্ক থাকবে"}
                  </td>
                ))}
              </tr>

              {/* Institutional Branding Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রতিষ্ঠান ব্র্যান্ডিং (লোগো/হেডার)</td>
                {displayPlans.map((p) => (
                  <td
                    key={p.code}
                    className={`py-3 px-3 ${p.branding ? "text-emerald-600 font-semibold" : "text-rose-500"}`}
                  >
                    {p.branding ? (p.code === "diamond" ? "পূর্ণ কাস্টমাইজেশন" : "হ্যাঁ (লোগো ও হেডার)") : "নেই"}
                  </td>
                ))}
              </tr>

              {/* Question Bank & 4-Set OMR Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রশ্ন ব্যাংক ও ৪-সেট ওএমআর</td>
                {displayPlans.map((p) => (
                  <td
                    key={p.code}
                    className={`py-3 px-3 ${p.questionBank ? "text-emerald-600 font-semibold" : "text-rose-500"}`}
                  >
                    {p.questionBank ? "হ্যাঁ (৪-সেট ওএমআর সহ)" : "নেই"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT SECURITY & TRUST BANNER */}
      <div className="rounded-2xl sm:rounded-3xl border bg-card p-5 sm:p-7 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm sm:text-base">
              সহজ, সুরক্ষিত ও তাৎক্ষণিক পেমেন্ট ব্যবস্থা
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              বিকাশ (bKash) ও নগদ (Nagad) এর মাধ্যমে পেমেন্ট সম্পন্ন করে সাথে সাথে আপনার অ্যাকাউন্ট সক্রিয় করুন। যেকোনো প্রয়োজনে সার্বক্ষণিক সাপোর্ট রয়েছে।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            bKash বিকাশ
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            Nagad নগদ
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            Rocket রকেট
          </span>
        </div>
      </div>
    </div>
  );
}
