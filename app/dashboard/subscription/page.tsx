import Link from "next/link";
import {
  Check,
  X,
  Shield,
  Sparkles,
  Zap,
  Lock,
  Clock,
  ArrowRight,
  Crown,
  FileText,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  Layers,
  Infinity as InfinityIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { PlanActionButton } from "@/components/plan-action-button";

export default async function SubscriptionPage() {
  const [plans, currentUser, myRequests] = await Promise.all([
    api.plans().catch(() => []),
    getSessionUser(),
    api.myPaymentRequests().catch(() => [])
  ]);

  const activePlanCode = currentUser?.plan || "free";
  const pendingRequest = myRequests.find((r) => r.status === "pending");

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
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
            <span className="text-xs font-medium text-muted-foreground">মাসিক প্ল্যান ও অনুমোদন</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            প্যাকেজ ও মূল্য তালিকা
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            আপনার শিক্ষাপ্রতিষ্ঠান বা কোচিং সেন্টারের প্রয়োজন অনুযায়ী সেরা প্যাকেজটি বেছে নিন। প্রতিটি লিমিট ও পারমিশন সিস্টেমের ব্যাকএন্ডে সুরক্ষিতভাবে যাচাই করা হয়।
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border text-xs text-muted-foreground shrink-0 font-medium self-start md:self-end">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>১০০% নিরাপদ ও ইনস্ট্যান্ট ভেরিফিকেশন</span>
        </div>
      </div>

      {/* PRICING CARDS GRID */}
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-stretch">
        {/* 1. FREE PLAN */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 border bg-card ${
            activePlanCode === "free"
              ? "border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
              : "border-border/80 hover:border-border hover:shadow-md"
          }`}
        >
          {activePlanCode === "free" && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>বর্তমান প্যাকেজ</span>
            </div>
          )}

          <div>
            {/* Card Top Title & Interval */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Free</h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground border-border/80">
                ফ্রি ট্রায়াল
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2 min-h-[32px] leading-relaxed">
              নতুন শিক্ষকদের জন্য পরীক্ষামূলক প্যাকেজ
            </p>

            {/* Price */}
            <div className="mt-3 pb-4 border-b border-border/60 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">৳০</span>
              <span className="text-xs font-semibold text-muted-foreground">/মাসিক</span>
            </div>

            {/* Quota Mini-Box */}
            <div className="my-4 rounded-xl p-3 bg-muted/40 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">প্রশ্নপত্র লিমিট:</span>
                <span className="font-bold text-foreground">২টি পেপার</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">মোট প্রশ্ন কোটা:</span>
                <span className="font-bold text-foreground">৬০টি প্রশ্ন</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                <span className="text-muted-foreground">প্রতি পেপারে:</span>
                <span className="font-medium text-foreground">সর্বোচ্চ ৩০টি</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 text-xs text-foreground/90">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>২টি প্রশ্নপত্র</strong> তৈরির সুবিধা</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রতি প্রশ্নে সর্বোচ্চ <strong>৩০টি প্রশ্ন</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>ওয়াটারমার্ক সহ <strong>PDF এক্সপোর্ট</strong></span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রশ্ন ইমপোর্ট (AI & OCR) বন্ধ</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Word (.docx) এক্সপোর্ট নেই</span>
              </div>
              <div className="flex items-start gap-1.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>প্রতি ডিভাইসে সর্বোচ্চ ২টি ফ্রি ট্রায়াল</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <PlanActionButton planCode="free" current={activePlanCode === "free"} />
          </div>
        </div>

        {/* 2. SMALL PLAN (৳১০০) */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 border bg-gradient-to-b from-emerald-500/[0.04] to-card ${
            activePlanCode === "small"
              ? "border-emerald-600 shadow-lg ring-2 ring-emerald-500/25"
              : "border-emerald-500/40 hover:border-emerald-500/80 shadow-xs hover:shadow-md"
          }`}
        >
          {activePlanCode === "small" ? (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>বর্তমান প্যাকেজ</span>
            </div>
          ) : (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>সেরা ভ্যালু • নতুন</span>
            </div>
          )}

          <div>
            {/* Card Top Title & Interval */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Small</h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold text-emerald-600 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30">
                ৳১০০/মাস
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2 min-h-[32px] leading-relaxed">
              একক শিক্ষক ও প্রাইভেট টিউটরদের জন্য
            </p>

            {/* Price */}
            <div className="mt-3 pb-4 border-b border-border/60 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">৳১০০</span>
              <span className="text-xs font-semibold text-muted-foreground">/মাসিক</span>
            </div>

            {/* Quota Mini-Box */}
            <div className="my-4 rounded-xl p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">প্রশ্নপত্র লিমিট:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">১০০টি পেপার</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">মোট প্রশ্ন কোটা:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">৩,৫০০টি প্রশ্ন</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20 text-[11px]">
                <span className="text-muted-foreground">প্রতি পেপারে:</span>
                <span className="font-medium text-foreground">সর্বোচ্চ ৫০টি</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 text-xs text-foreground/90">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>১০০টি প্রশ্নপত্র</strong> তৈরি (100 Papers)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>মোট <strong>৩,৫০০টি প্রশ্ন</strong> তৈরির বিশাল কোটা</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>কোনো ওয়াটারমার্ক নেই</strong> (Clean PDF)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>৩,২০০+ প্রশ্ন ব্যাংক</strong> ফুল অ্যাক্সেস</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>৪-সেট ওএমআর</strong> ও র্যান্ডম শাফলার</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রশ্ন ইমপোর্ট (AI & OCR) বন্ধ</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Word (.docx) এক্সপোর্ট নেই</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <PlanActionButton planCode="small" current={activePlanCode === "small"} />
          </div>
        </div>

        {/* 3. PRO PLAN (৳৫০০) */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 border bg-gradient-to-b from-blue-500/[0.04] to-card ${
            activePlanCode === "pro" || activePlanCode === "standard"
              ? "border-blue-600 shadow-lg ring-2 ring-blue-500/25"
              : "border-blue-500/40 hover:border-blue-500/80 shadow-xs hover:shadow-md"
          }`}
        >
          {activePlanCode === "pro" || activePlanCode === "standard" ? (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>বর্তমান প্যাকেজ</span>
            </div>
          ) : (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>জনপ্রিয় চয়েস</span>
            </div>
          )}

          <div>
            {/* Card Top Title & Interval */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Pro</h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold text-blue-600 border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/30">
                ৳৫০০/মাস
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2 min-h-[32px] leading-relaxed">
              মাঝারি কোচিং ও পূর্ণাঙ্গ শিক্ষাপ্রতিষ্ঠান
            </p>

            {/* Price */}
            <div className="mt-3 pb-4 border-b border-border/60 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">৳৫০০</span>
              <span className="text-xs font-semibold text-muted-foreground">/মাসিক</span>
            </div>

            {/* Quota Mini-Box */}
            <div className="my-4 rounded-xl p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">প্রশ্নপত্র লিমিট:</span>
                <span className="font-extrabold text-blue-700 dark:text-blue-400">২,০০০টি পেপার</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">মোট প্রশ্ন কোটা:</span>
                <span className="font-extrabold text-blue-700 dark:text-blue-400">৭,০০০টি প্রশ্ন</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-blue-500/20 text-[11px]">
                <span className="text-muted-foreground">প্রতি পেপারে:</span>
                <span className="font-medium text-foreground">সর্বোচ্চ ২০০টি</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 text-xs text-foreground/90">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>২,০০০টি প্রশ্নপত্র</strong> তৈরি (2,000 Papers)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>মোট <strong>৭,০০০টি প্রশ্ন</strong> তৈরির কোটা</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>কোনো ওয়াটারমার্ক নেই</strong> (Clean Print)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রতিষ্ঠানের নিজস্ব <strong>নাম ও লোগো ব্র্যান্ডিং</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রশ্ন ব্যাংক, ওএমআর ৪-সেট ও আনলিমিটেড ভার্সন</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রশ্ন ইমপোর্ট (AI & OCR) বন্ধ</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Word (.docx) এক্সপোর্ট নেই</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <PlanActionButton planCode="pro" current={activePlanCode === "pro" || activePlanCode === "standard"} />
          </div>
        </div>

        {/* 4. ULTRA PLAN (৳১,০০০) */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 border bg-gradient-to-b from-purple-500/[0.05] to-card ${
            activePlanCode === "ultra"
              ? "border-purple-600 shadow-xl ring-2 ring-purple-500/30"
              : "border-purple-500/40 hover:border-purple-500/80 shadow-xs hover:shadow-md"
          }`}
        >
          {activePlanCode === "ultra" ? (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>বর্তমান প্যাকেজ</span>
            </div>
          ) : (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>অল-ইন-ওয়ান</span>
            </div>
          )}

          <div>
            {/* Card Top Title & Interval */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Ultra</h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold text-purple-600 border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/30">
                ৳১০০০/মাস
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2 min-h-[32px] leading-relaxed">
              স্কুল, কলেজ ও ওয়ার্ড (.docx) এক্সপোর্ট
            </p>

            {/* Price */}
            <div className="mt-3 pb-4 border-b border-border/60 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">৳১,০০০</span>
              <span className="text-xs font-semibold text-muted-foreground">/মাসিক</span>
            </div>

            {/* Quota Mini-Box */}
            <div className="my-4 rounded-xl p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">প্রশ্নপত্র লিমিট:</span>
                <span className="font-extrabold text-purple-700 dark:text-purple-300">৫,০০০টি পেপার</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">মোট প্রশ্ন কোটা:</span>
                <span className="font-extrabold text-purple-700 dark:text-purple-300">১৫,০০০টি প্রশ্ন</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-purple-500/20 text-[11px]">
                <span className="text-muted-foreground">প্রতি পেপারে:</span>
                <span className="font-medium text-foreground">সর্বোচ্চ ৫০০টি</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 text-xs text-foreground/90">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>PDF ও DOCS (Word) উভয়</strong> এক্সপোর্ট</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>AI প্রশ্ন ইমপোর্ট (Import ON):</strong> ছবি, PDF ও Word হতে অটো প্রশ্ন</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>সর্বোচ্চ <strong>৫,০০০টি প্রশ্নপত্র</strong> তৈরি</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>মোট <strong>১৫,০০০টি প্রশ্ন</strong> তৈরির কোটা</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রতিষ্ঠান ব্র্যান্ডিং (লোগো ও হেডার কাস্টমাইজেশন)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রশ্ন ব্যাংক, ওএমআর ৪-সেট ও আনলিমিটেড সংস্করণ</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>অগ্রাধিকার সাপোর্ট (Priority Support)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <PlanActionButton planCode="ultra" current={activePlanCode === "ultra"} />
          </div>
        </div>

        {/* 5. DIAMOND PLAN (৳৩,৫০০) */}
        <div
          className={`relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 border bg-gradient-to-b from-cyan-500/[0.07] via-cyan-500/[0.02] to-card ${
            activePlanCode === "diamond"
              ? "border-cyan-500 shadow-xl ring-2 ring-cyan-500/40"
              : "border-cyan-500/50 hover:border-cyan-400 shadow-md hover:shadow-xl ring-1 ring-cyan-500/20"
          }`}
        >
          {activePlanCode === "diamond" ? (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>বর্তমান প্যাকেজ</span>
            </div>
          ) : (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>আনলিমিটেড সুপার</span>
            </div>
          )}

          <div>
            {/* Card Top Title & Interval */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                  <Crown className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-cyan-800 dark:text-cyan-300">Diamond</h3>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold text-cyan-600 border-cyan-500/50 bg-cyan-50/60 dark:bg-cyan-950/40">
                ৳৩৫০০/মাস
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2 min-h-[32px] leading-relaxed">
              সম্পূর্ণ আনলিমিটেড পেপার ও ভিআইপি সাপোর্ট
            </p>

            {/* Price */}
            <div className="mt-3 pb-4 border-b border-border/60 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">৳৩,৫০০</span>
              <span className="text-xs font-semibold text-muted-foreground">/মাসিক</span>
            </div>

            {/* Quota Mini-Box */}
            <div className="my-4 rounded-xl p-3 bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-500/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">প্রশ্নপত্র লিমিট:</span>
                <span className="font-extrabold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                  <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">মোট প্রশ্ন কোটা:</span>
                <span className="font-extrabold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                  <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-cyan-500/25 text-[11px]">
                <span className="text-muted-foreground">প্রতি পেপারে:</span>
                <span className="font-medium text-cyan-800 dark:text-cyan-200">আনলিমিটেড প্রশ্ন</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 text-xs text-foreground/90">
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>আনলিমিটেড প্রশ্নপত্র</strong> তৈরি (Unlimited Papers)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>আনলিমিটেড প্রশ্ন</strong> তৈরির সুবিধা (Unlimited)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>PDF ও DOCS (Word) উভয়</strong> এক্সপোর্ট</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>AI প্রশ্ন ইমপোর্ট (Import ON):</strong> ছবি, PDF ও Word এক্সট্রাক্ট</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রতিষ্ঠান ব্র্যান্ডিং (লোগো, হেডার ও পূর্ণ নিয়ন্ত্রণ)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>প্রশ্ন ব্যাংক, ওএমআর ৪-সেট ও আনলিমিটেড সংস্করণ</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-4 w-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span><strong>২৪/৭ ভিআইপি অগ্রাধিকার</strong> কাস্টমার সাপোর্ট</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <PlanActionButton planCode="diamond" current={activePlanCode === "diamond"} />
          </div>
        </div>
      </div>

      {/* FEATURE COMPARISON TABLE */}
      <div className="rounded-2xl sm:rounded-3xl border bg-card p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              প্যাকেজ ভিত্তিক ফিচার তুলনা (Feature Matrix)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              সকল প্যাকেজের তুলনামূলক সুবিধা ও কোটা তালিকা
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
                <th className="py-3 px-3 font-semibold text-foreground">Free (৳০)</th>
                <th className="py-3 px-3 font-bold text-emerald-600">Small (৳১০০/মা)</th>
                <th className="py-3 px-3 font-bold text-blue-600">Pro (৳৫০০/মা)</th>
                <th className="py-3 px-3 font-bold text-purple-600">Ultra (৳১০০০/মা)</th>
                <th className="py-3 px-3 font-bold text-cyan-600">Diamond (৳৩৫০০/মা)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-muted-foreground">
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রশ্নপত্র লিমিট (Papers Limit)</td>
                <td className="py-3 px-3">২টি প্রশ্নপত্র</td>
                <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">১০০টি প্রশ্নপত্র</td>
                <td className="py-3 px-3 font-bold text-foreground">২,০০০টি প্রশ্নপত্র</td>
                <td className="py-3 px-3 font-bold text-purple-700 dark:text-purple-300">৫,০০০টি প্রশ্নপত্র</td>
                <td className="py-3 px-3 font-bold text-cyan-600">আনলিমিটেড (Unlimited)</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">মোট প্রশ্ন সংখ্যা (Questions Limit)</td>
                <td className="py-3 px-3">সর্বোচ্চ ৩০/পত্র (৬০ মোট)</td>
                <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">৩,৫০০টি প্রশ্ন (৫০/পত্র)</td>
                <td className="py-3 px-3 font-bold text-foreground">৭,০০০টি প্রশ্ন (২০০/পত্র)</td>
                <td className="py-3 px-3 font-bold text-purple-700 dark:text-purple-300">১৫,০০০টি প্রশ্ন (৫০০/পত্র)</td>
                <td className="py-3 px-3 font-bold text-cyan-600">আনলিমিটেড (Unlimited)</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">এক্সপোর্ট ফরম্যাট</td>
                <td className="py-3 px-3">শুধুমাত্র PDF</td>
                <td className="py-3 px-3">শুধুমাত্র PDF</td>
                <td className="py-3 px-3">শুধুমাত্র PDF</td>
                <td className="py-3 px-3 font-bold text-emerald-600">PDF & DOCS (উভয়ই)</td>
                <td className="py-3 px-3 font-bold text-emerald-600">PDF & DOCS (উভয়ই)</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রশ্ন ইমপোর্ট (AI & OCR)</td>
                <td className="py-3 px-3 text-rose-500 font-semibold">বন্ধ (OFF)</td>
                <td className="py-3 px-3 text-rose-500 font-semibold">বন্ধ (OFF)</td>
                <td className="py-3 px-3 text-rose-500 font-semibold">বন্ধ (OFF)</td>
                <td className="py-3 px-3 font-bold text-emerald-600">চালু (ON)</td>
                <td className="py-3 px-3 font-bold text-emerald-600">চালু (ON)</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">ওয়াটারমার্ক মুক্ত প্রিন্ট</td>
                <td className="py-3 px-3 text-rose-500">ওয়াটারমার্ক থাকবে</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (মুক্ত)</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (মুক্ত)</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (মুক্ত)</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (মুক্ত)</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রতিষ্ঠান ব্র্যান্ডিং (লোগো/হেডার)</td>
                <td className="py-3 px-3 text-rose-500">নেই</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (লোগো ও হেডার)</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (লোগো ও হেডার)</td>
                <td className="py-3 px-3 text-emerald-600 font-semibold">হ্যাঁ (লোগো ও হেডার)</td>
                <td className="py-3 px-3 text-cyan-600 font-bold">পূর্ণ কাস্টমাইজেশন</td>
              </tr>
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">ডিভাইস সীমা সুরক্ষা</td>
                <td className="py-3 px-3 text-amber-600 font-semibold">প্রতি ডিভাইসে সর্বোচ্চ ২টি</td>
                <td className="py-3 px-3 text-foreground">কোটা প্রযোজ্য</td>
                <td className="py-3 px-3 text-foreground">কোটা প্রযোজ্য</td>
                <td className="py-3 px-3 text-foreground">কোটা প্রযোজ্য</td>
                <td className="py-3 px-3 font-bold text-cyan-600">ফুল আনলিমিটেড অ্যাক্সেস</td>
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
