import Link from "next/link";
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Infinity as InfinityIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, fetchPlans, DEFAULT_PLANS } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { SubscriptionPlanSlider } from "@/components/subscription/subscription-plan-slider";
import { formatBnNumber } from "@/lib/utils";

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

      {/* 3-CARD GRID WITH SLIDER TO VIEW OTHERS */}
      <SubscriptionPlanSlider planList={planList} activePlanCode={activePlanCode} mode="subscription" />

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
              {/* Duration Row */}
              <tr className="hover:bg-muted/30 transition-colors bg-teal-50/20 dark:bg-teal-950/10">
                <td className="py-3 px-3 font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-teal-600" />
                    প্যাকেজের মেয়াদ (Plan Duration)
                  </span>
                </td>
                {planList.map((p) => (
                  <td key={p.code} className="py-3 px-3 font-bold text-teal-700 dark:text-teal-300">
                    {p.duration || (p.price === 0 ? "লাইফটাইম" : "৩০ দিন")}
                  </td>
                ))}
              </tr>

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
