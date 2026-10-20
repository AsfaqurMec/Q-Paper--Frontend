import Link from "next/link";
import { Check, X, Shield, Sparkles, Zap, Lock, Clock, ArrowRight, Crown } from "lucide-react";
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {pendingRequest && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">আপনার একটি পেমেন্ট রিকোয়েস্ট যাচাইয়ের অপেক্ষায় আছে</p>
              <p className="text-muted-foreground mt-0.5">
                প্যাকেজ: {pendingRequest.planName} • TrxID: {pendingRequest.transactionId} • এডমিন যাচাই শেষে অতি দ্রুত আপনার অ্যাকাউন্ট সক্রিয় করবে।
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-800 dark:text-amber-300 h-8 gap-1.5 shrink-0">
            <Link href="/dashboard/checkout">
              চেকআউটে দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/30 font-semibold">
            সাবস্ক্রিপশন প্যাকেজ
          </Badge>
          <span className="text-xs text-muted-foreground">মাসিক প্ল্যান ও অনুমোদন</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          প্যাকেজ ও মূল্য তালিকা (Monthly Pricing)
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-muted-foreground">
          আপনার শিক্ষাপ্রতিষ্ঠান বা কোচিং সেন্টারের প্রয়োজন অনুযায়ী সেরা প্যাকেজটি বেছে নিন। প্রতিটি লিমিট ও পারমিশন সিস্টেমের ব্যাকএন্ডে সুরক্ষিতভাবে যাচাই করা হয়।
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* FREE PLAN */}
        <Card className={`relative flex flex-col ${activePlanCode === "free" ? "border-primary/50 shadow-sm" : ""}`}>
          {activePlanCode === "free" && (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs font-semibold">বর্তমান প্যাকেজ</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Free</CardTitle>
              <Badge variant="outline" className="text-xs">ফ্রি ট্রায়াল</Badge>
            </div>
            <CardDescription className="text-xs">নতুন শিক্ষকদের জন্য পরীক্ষামূলক প্যাকেজ</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-3xl font-bold">
              ৳০
              <span className="text-xs font-normal text-muted-foreground">/মাসিক</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>২টি প্রশ্নপত্র</strong> তৈরি করার সুবিধা</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রতি প্রশ্নে সর্বোচ্চ <strong>৩০টি প্রশ্ন</strong> (Max 30 per paper)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>শুধুমাত্র <strong>PDF এক্সপোর্ট</strong> (PDF export only)</span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>প্রশ্ন ইমপোর্ট ফিচার বন্ধ (Import feature OFF)</span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>DOCS (Word) এক্সপোর্ট সুবিধা নেই</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground pt-2 border-t">
                <Shield className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>ডিভাইস ভেরিফিকেশন: লিমিট শেষ হলে একই ডিভাইস থেকে অন্য একাউন্ট দিয়ে ফ্রি সুবিধা নেওয়া যাবে না</span>
              </div>
            </div>
            <PlanActionButton planCode="free" current={activePlanCode === "free"} />
          </CardContent>
        </Card>

        {/* SMALL PLAN */}
        <Card className={`relative flex flex-col border-emerald-500/30 ${activePlanCode === "small" ? "border-emerald-600 shadow-md ring-1 ring-emerald-500/20" : ""}`}>
          {activePlanCode === "small" ? (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-emerald-600 text-white text-xs font-semibold">বর্তমান প্যাকেজ</Badge>
            </div>
          ) : (
            <div className="absolute -top-3 right-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-xs font-semibold">নতুন</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-emerald-600" />
                Small
              </CardTitle>
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600">৳১০০/মাস</Badge>
            </div>
            <CardDescription className="text-xs">একক শিক্ষক ও প্রাইভেট টিউটরদের জন্য</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-3xl font-bold text-foreground">
              ৳১০০
              <span className="text-xs font-normal text-muted-foreground">/মাসিক</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>সর্বোচ্চ <strong>১০০টি প্রশ্নপত্র</strong> তৈরি (100 Papers)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>মোট <strong>৩,৫০০টি প্রশ্ন</strong> তৈরির কোটা (3,500 Questions)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রতি প্রশ্নে সর্বোচ্চ <strong>৫০টি প্রশ্ন</strong></span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>শুধুমাত্র <strong>PDF এক্সপোর্ট</strong> (PDF export only)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রশ্ন ব্যাংক ও ৪-সেট ওএমআর প্রশ্ন তৈরির সুবিধা</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>কোনো ওয়াটারমার্ক নেই (No Watermark)</span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>প্রশ্ন ইমপোর্ট ফিচার বন্ধ (Import feature OFF)</span>
              </div>
            </div>
            <PlanActionButton planCode="small" current={activePlanCode === "small"} />
          </CardContent>
        </Card>

        {/* PRO PLAN */}
        <Card className={`relative flex flex-col border-blue-500/30 ${activePlanCode === "pro" || activePlanCode === "standard" ? "border-primary shadow-md ring-1 ring-primary/20" : ""}`}>
          {(activePlanCode === "pro" || activePlanCode === "standard") ? (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs font-semibold">বর্তমান প্যাকেজ</Badge>
            </div>
          ) : (
            <div className="absolute -top-3 right-4">
              <Badge variant="secondary" className="text-xs font-semibold">জনপ্রিয়</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Pro
              </CardTitle>
              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-600">৳৫০০/মাস</Badge>
            </div>
            <CardDescription className="text-xs">ব্যক্তিগত শিক্ষক ও কোচিং সেন্টারের জন্য</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-3xl font-bold text-foreground">
              ৳৫০০
              <span className="text-xs font-normal text-muted-foreground">/মাসিক</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>সর্বোচ্চ <strong>২,০০০টি প্রশ্নপত্র</strong> তৈরি (2,000 Papers)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>মোট <strong>৭,০০০টি প্রশ্ন</strong> তৈরির কোটা (7,000 Questions)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>শুধুমাত্র <strong>PDF এক্সপোর্ট</strong> (PDF export only)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রশ্ন ব্যাংক ও ৪-সেট ওএমআর প্রশ্ন তৈরির সুবিধা</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>কোনো ওয়াটারমার্ক নেই (No Watermark)</span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>প্রশ্ন ইমপোর্ট ফিচার বন্ধ (Import feature OFF)</span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>DOCS (Word) এক্সপোর্ট সুবিধা নেই</span>
              </div>
            </div>
            <PlanActionButton planCode="pro" current={activePlanCode === "pro" || activePlanCode === "standard"} />
          </CardContent>
        </Card>

        {/* ULTRA PLAN */}
        <Card className={`relative flex flex-col border-purple-500/40 bg-gradient-to-b from-purple-500/[0.03] to-transparent ${activePlanCode === "ultra" ? "border-purple-600 shadow-lg ring-2 ring-purple-500/30" : ""}`}>
          {activePlanCode === "ultra" ? (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-purple-600 text-white text-xs font-semibold">বর্তমান প্যাকেজ</Badge>
            </div>
          ) : (
            <div className="absolute -top-3 right-4">
              <Badge className="bg-purple-600 text-white text-xs font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> অল-ইন-ওয়ান
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                <Sparkles className="h-5 w-5" />
                Ultra
              </CardTitle>
              <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-600">৳১০০০/মাস</Badge>
            </div>
            <CardDescription className="text-xs">স্কুল, কলেজ ও বৃহৎ প্রতিষ্ঠানের সম্পূর্ণ সমাধান</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-3xl font-bold text-foreground">
              ৳১,০০০
              <span className="text-xs font-normal text-muted-foreground">/মাসিক</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-purple-600 font-bold shrink-0 mt-0.5" />
                <span>সর্বোচ্চ <strong>৫,০০০টি প্রশ্নপত্র</strong> তৈরি (5,000 Papers)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-purple-600 font-bold shrink-0 mt-0.5" />
                <span>মোট <strong>১৫,০০০টি প্রশ্ন</strong> তৈরির কোটা (15,000 Questions)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-purple-600 font-bold shrink-0 mt-0.5" />
                <span><strong>PDF ও DOCS (Word) উভয় ফরম্যাটেই</strong> এক্সপোর্ট (Both PDF & Docs export)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-purple-600 font-bold shrink-0 mt-0.5" />
                <span><strong>প্রশ্ন ইমপোর্ট ফিচার চালু (Import Feature ON)</strong>: ছবি, PDF ও Word থেকে সরাসরি AI প্রশ্ন এক্সট্রাক্ট</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রতিষ্ঠান ব্র্যান্ডিং (লোগো, হেডার ও পূর্ণ কাস্টমাইজেশন)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রশ্ন ব্যাংক, ওএমআর ৪-সেট ও আনলিমিটেড ভার্সন জেনারেটর</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>অগ্রাধিকার সাপোর্ট (Priority Support)</span>
              </div>
            </div>
            <PlanActionButton planCode="ultra" current={activePlanCode === "ultra"} />
          </CardContent>
        </Card>

        {/* DIAMOND PLAN */}
        <Card className={`relative flex flex-col border-cyan-500/40 bg-gradient-to-b from-cyan-500/[0.04] to-transparent ${activePlanCode === "diamond" ? "border-cyan-600 shadow-xl ring-2 ring-cyan-500/40" : ""}`}>
          {activePlanCode === "diamond" ? (
            <div className="absolute -top-3 left-4">
              <Badge className="bg-cyan-600 text-white text-xs font-semibold">বর্তমান প্যাকেজ</Badge>
            </div>
          ) : (
            <div className="absolute -top-3 right-4">
              <Badge className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs">
                <Crown className="h-3 w-3" /> আনলিমিটেড
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400">
                <Crown className="h-5 w-5" />
                Diamond
              </CardTitle>
              <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-600">৳৩৫০০/মাস</Badge>
            </div>
            <CardDescription className="text-xs">সম্পূর্ণ আনলিমিটেড পেপার ও প্রশ্ন তৈরির আল্টিমেট প্ল্যান</CardDescription>
            <div className="mt-3 flex items-baseline gap-1 text-3xl font-bold text-foreground">
              ৳৩,৫০০
              <span className="text-xs font-normal text-muted-foreground">/মাসিক</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-cyan-600 font-bold shrink-0 mt-0.5" />
                <span><strong>আনলিমিটেড প্রশ্নপত্র</strong> তৈরি (Unlimited Papers)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-cyan-600 font-bold shrink-0 mt-0.5" />
                <span><strong>আনলিমিটেড প্রশ্ন</strong> তৈরির সুবিধা (Unlimited Questions)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-cyan-600 font-bold shrink-0 mt-0.5" />
                <span><strong>PDF ও DOCS (Word) উভয় ফরম্যাটেই</strong> এক্সপোর্ট (Both PDF & Docs export)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-cyan-600 font-bold shrink-0 mt-0.5" />
                <span><strong>প্রশ্ন ইমপোর্ট ফিচার চালু (Import Feature ON)</strong>: ছবি, PDF ও Word থেকে সরাসরি AI প্রশ্ন এক্সট্রাক্ট</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রতিষ্ঠান ব্র্যান্ডিং (লোগো, হেডার ও পূর্ণ কাস্টমাইজেশন)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>প্রশ্ন ব্যাংক, ওএমআর ৪-সেট ও আনলিমিটেড ভার্সন জেনারেটর</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>২৪/৭ ভিআইপি অগ্রাধিকার সাপোর্ট (VIP Priority Support)</span>
              </div>
            </div>
            <PlanActionButton planCode="diamond" current={activePlanCode === "diamond"} />
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison Table */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold">প্যাকেজ ভিত্তিক ফিচার তুলনা (Feature Matrix)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[750px]">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2.5 font-medium">ফিচারসমূহ</th>
                <th className="py-2.5 font-semibold text-foreground">Free (৳০)</th>
                <th className="py-2.5 font-semibold text-emerald-600">Small (৳১০০/মা)</th>
                <th className="py-2.5 font-semibold text-blue-600">Pro (৳৫০০/মা)</th>
                <th className="py-2.5 font-semibold text-purple-600">Ultra (৳১০০০/মা)</th>
                <th className="py-2.5 font-semibold text-cyan-600">Diamond (৳৩৫০০/মা)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-muted-foreground">
              <tr>
                <td className="py-3 font-medium text-foreground">প্রশ্নপত্র লিমিট (Papers Limit)</td>
                <td className="py-3">২টি প্রশ্নপত্র (2 Papers)</td>
                <td className="py-3 font-semibold text-emerald-700 dark:text-emerald-400">১০০টি প্রশ্নপত্র</td>
                <td className="py-3 font-semibold text-foreground">২,০০০টি প্রশ্নপত্র</td>
                <td className="py-3 font-semibold text-purple-700 dark:text-purple-300">৫,০০০টি প্রশ্নপত্র</td>
                <td className="py-3 font-bold text-cyan-600">আনলিমিটেড (Unlimited)</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-foreground">মোট প্রশ্ন সংখ্যা (Questions Limit)</td>
                <td className="py-3">সর্বোচ্চ ৩০ প্রশ্ন/পত্র (৬০টি মোট)</td>
                <td className="py-3 font-semibold text-emerald-700 dark:text-emerald-400">৩,৫০০টি প্রশ্ন (৫০/পত্র)</td>
                <td className="py-3 font-semibold text-foreground">৭,০০০টি প্রশ্ন</td>
                <td className="py-3 font-semibold text-purple-700 dark:text-purple-300">১৫,০০০টি প্রশ্ন</td>
                <td className="py-3 font-bold text-cyan-600">আনলিমিটেড (Unlimited)</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-foreground">এক্সপোর্ট ফরম্যাট</td>
                <td className="py-3">শুধুমাত্র PDF</td>
                <td className="py-3">শুধুমাত্র PDF</td>
                <td className="py-3">শুধুমাত্র PDF</td>
                <td className="py-3 font-semibold text-emerald-600">PDF & DOCS (উভয়ই)</td>
                <td className="py-3 font-semibold text-emerald-600">PDF & DOCS (উভয়ই)</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-foreground">প্রশ্ন ইমপোর্ট (AI & OCR)</td>
                <td className="py-3 text-rose-500 font-medium">বন্ধ (OFF)</td>
                <td className="py-3 text-rose-500 font-medium">বন্ধ (OFF)</td>
                <td className="py-3 text-rose-500 font-medium">বন্ধ (OFF)</td>
                <td className="py-3 font-semibold text-emerald-600">চালু (ON)</td>
                <td className="py-3 font-semibold text-emerald-600">চালু (ON)</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-foreground">ওয়াটারমার্ক মুক্ত প্রিন্ট</td>
                <td className="py-3">ওয়াটারমার্ক থাকবে</td>
                <td className="py-3 text-emerald-600">হ্যাঁ (মুক্ত)</td>
                <td className="py-3 text-emerald-600">হ্যাঁ (মুক্ত)</td>
                <td className="py-3 text-emerald-600">হ্যাঁ (মুক্ত)</td>
                <td className="py-3 text-emerald-600">হ্যাঁ (মুক্ত)</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-foreground">ডিভাইস সীমা সুরক্ষা</td>
                <td className="py-3 text-amber-600 font-medium">প্রতি ডিভাইসে সর্বোচ্চ ২টি</td>
                <td className="py-3 text-foreground">কোটা প্রযোজ্য</td>
                <td className="py-3 text-foreground">কোটা প্রযোজ্য</td>
                <td className="py-3 text-foreground">কোটা প্রযোজ্য</td>
                <td className="py-3 font-semibold text-cyan-600">ফুল আনলিমিটেড অ্যাক্সেস</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
