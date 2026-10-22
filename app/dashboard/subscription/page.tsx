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
  HelpCircle,
  FileDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, fetchPlans, DEFAULT_PLANS } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { PlanActionButton } from "@/components/plan-action-button";
import { formatBnNumber } from "@/lib/utils";
import type { Plan } from "@/lib/api-types";

export default async function SubscriptionPage() {
  const [dbPlans, currentUser, myRequests] = await Promise.all([
    fetchPlans(),
    getSessionUser(),
    api.myPaymentRequests().catch(() => [])
  ]);

  const activePlanCode = currentUser?.plan || "free";
  const pendingRequest = myRequests.find((r) => r.status === "pending");

  // If backend plans are returned from DB, use them; fallback to schema defaults if empty
  const planList = Array.isArray(dbPlans) && dbPlans.length > 0 ? dbPlans : DEFAULT_PLANS;

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
            আপনার শিক্ষাপ্রতিষ্ঠান বা কোচিং সেন্টারের প্রয়োজন অনুযায়ী সেরা প্যাকেজটি বেছে নিন। প্রতিটি লিমিট ও পারমিশন সিস্টেমের ব্যাকএন্ডে রিয়েল-টাইমে ডেটাবেস থেকে সংরক্ষিত থাকে।
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border text-xs text-muted-foreground shrink-0 font-medium self-start md:self-end">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>১০০% নিরাপদ ও ইনস্ট্যান্ট ভেরিফিকেশন</span>
        </div>
      </div>

      {/* DYNAMIC PRICING CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 items-stretch">
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
              className={`relative rounded-3xl p-5 sm:p-6 lg:p-5 flex flex-col justify-between transition-all duration-300 ${
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
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black px-4 py-0.5 rounded-full shadow-md flex items-center gap-1.5 z-10">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>বর্তমান প্যাকেজ</span>
                </div>
              ) : isSmall ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>সেরা ভ্যালু</span>
                </div>
              ) : isPro ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
                  <Zap className="w-3.5 h-3.5" />
                  <span>জনপ্রিয় চয়েস</span>
                </div>
              ) : isUltra ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold px-3.5 py-0.5 rounded-full shadow-sm z-10">
                  কোচিংয়ের পছন্দ
                </div>
              ) : isDiamond ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
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
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md">
                      {plan.interval === "month" ? "মাসিক" : plan.interval}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 min-h-[32px] leading-relaxed">
                    {isFree && "সফটওয়্যার পরীক্ষা ও ফ্রি ট্রায়াল"}
                    {isSmall && "ব্যক্তিগত শিক্ষক ও ছোট ব্যাচের জন্য সেরা"}
                    {isPro && "মাঝারি কোচিং ও পূর্ণাঙ্গ শিক্ষাপ্রতিষ্ঠান"}
                    {isUltra && "বড় কোচিং ও ওয়ার্ড (.docx) এক্সপোর্ট"}
                    {isDiamond && "সম্পূর্ণ আনলিমিটেড পেপার ও প্রশ্ন, ভিআইপি"}
                  </p>
                </div>

                {/* Price Block */}
                <div className="flex items-baseline gap-1 my-4 pb-4 border-b border-border/60">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                    ৳{formatBnNumber(plan.price)}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    / {plan.price === 0 ? "ফ্রি ট্রায়াল" : plan.interval === "month" ? "মাসিক" : "মেয়াদ"}
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
                  {/* 1. Watermark */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {plan.watermark ? "ওয়াটারমার্ক সহ প্রিভিউ" : "কোনো ওয়াটারমার্ক নেই (ক্লিন PDF)"}
                    </span>
                  </div>

                  {/* 2. Question Bank */}
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

                  {/* 3. Random Generator */}
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

                  {/* 4. Branding */}
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

                  {/* 5. Multiple Versions */}
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

                  {/* 6. Exports */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-semibold text-foreground">
                      {plan.exports.includes("docx")
                        ? "PDF এবং MS Word (.docx) উভয় এক্সপোর্ট"
                        : "প্রিন্ট-রেডি এ৪ PDF এক্সপোর্ট"}
                    </span>
                  </div>

                  {/* 7. AI Question Import */}
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
                      {plan.importQuestion ? "AI প্রশ্ন ইমপোর্ট (ছবি, PDF, Word)" : "AI প্রশ্ন ইমপোর্ট সুবিধা বন্ধ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="pt-4 border-t border-border/40">
                <PlanActionButton planCode={plan.code} current={isCurrent} />
              </div>
            </div>
          );
        })}
      </div>

      {/* DYNAMIC FEATURE COMPARISON TABLE */}
      <div className="rounded-3xl border bg-card p-5 sm:p-7 shadow-xs space-y-5">
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
                {planList.map((p) => {
                  let colorClass = "text-foreground font-semibold";
                  if (p.code === "small") colorClass = "text-emerald-600 font-bold";
                  if (p.code === "pro") colorClass = "text-blue-600 font-bold";
                  if (p.code === "ultra") colorClass = "text-purple-600 font-bold";
                  if (p.code === "diamond") colorClass = "text-cyan-600 font-bold";

                  return (
                    <th key={p.code} className={`py-3 px-3 ${colorClass}`}>
                      {p.name} (৳{formatBnNumber(p.price)}{p.price > 0 ? "/মা" : ""})
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y text-muted-foreground">
              {/* Paper Limit Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">প্রশ্নপত্র লিমিট (Papers Limit)</td>
                {planList.map((p) => (
                  <td key={p.code} className="py-3 px-3">
                    {p.paperLimit >= 999999 ? (
                      <span className="font-bold text-cyan-600 flex items-center gap-1">
                        <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                      </span>
                    ) : (
                      `${formatBnNumber(p.paperLimit)}টি প্রশ্নপত্র`
                    )}
                  </td>
                ))}
              </tr>

              {/* Questions Limit Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">মোট প্রশ্ন সংখ্যা (Questions Limit)</td>
                {planList.map((p) => (
                  <td key={p.code} className="py-3 px-3">
                    {p.totalQuestionsLimit >= 999999 ? (
                      <span className="font-bold text-cyan-600 flex items-center gap-1">
                        <InfinityIcon className="h-3.5 w-3.5" /> আনলিমিটেড
                      </span>
                    ) : (
                      `${formatBnNumber(p.totalQuestionsLimit)}টি (${formatBnNumber(p.questionLimit)}/পত্র)`
                    )}
                  </td>
                ))}
              </tr>

              {/* Export Formats Row */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-foreground">এক্সপোর্ট ফরম্যাট</td>
                {planList.map((p) => {
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
                {planList.map((p) => (
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
                {planList.map((p) => (
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
                {planList.map((p) => (
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
                {planList.map((p) => (
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
      <div className="rounded-3xl border bg-card p-5 sm:p-7 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
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
