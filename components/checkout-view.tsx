"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Lock,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
  ArrowLeft,
  Clock,
  AlertCircle,
  BookOpen,
  Crown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientApi } from "@/lib/client-api";
import type { PaymentOption, PaymentRequest, UserSession } from "@/lib/api-types";

type PlanDetail = {
  code: "small" | "pro" | "ultra" | "diamond";
  name: string;
  price: number;
  interval: string;
  badge: string;
  features: string[];
};

const PLAN_DATA: Record<"small" | "pro" | "ultra" | "diamond", PlanDetail> = {
  small: {
    code: "small",
    name: "Small Package",
    price: 100,
    interval: "মাসিক (Monthly)",
    badge: "একক শিক্ষক ও টিউটর",
    features: [
      "সর্বোচ্চ ১০০টি প্রশ্নপত্র তৈরি (100 Papers quota)",
      "মোট ৩,৫০০টি প্রশ্ন তৈরির লাইব্রেরি কোটা",
      "PDF এক্সপোর্ট সুবিধা (High-Res PDF Export)",
      "প্রশ্ন ব্যাংক ও ৪-সেট ওএমআর প্রশ্ন জেনারেশন",
      "কোনো ওয়াটারমার্ক থাকবে না (Watermark Free)",
      "ডিভাইস যাচাইকরণ ও নিরাপদ অ্যাক্সেস"
    ]
  },
  pro: {
    code: "pro",
    name: "Pro Package",
    price: 500,
    interval: "মাসিক (Monthly)",
    badge: "ব্যক্তিগত শিক্ষক ও কোচিং",
    features: [
      "সর্বোচ্চ ২,০০০টি প্রশ্নপত্র তৈরি (2,000 Papers quota)",
      "মোট ৭,০০০টি প্রশ্ন তৈরির লাইব্রেরি কোটা",
      "PDF এক্সপোর্ট সুবিধা (PDF export)",
      "প্রশ্ন ব্যাংক ও ৪-সেট ওএমআর প্রশ্ন জেনারেশন",
      "কোনো ওয়াটারমার্ক থাকবে না (Watermark Free)",
      "ডিভাইস যাচাইকরণ ও নিরাপদ অ্যাক্সেস"
    ]
  },
  ultra: {
    code: "ultra",
    name: "Ultra Package",
    price: 1000,
    interval: "মাসিক (Monthly)",
    badge: "অল-ইন-ওয়ান সম্পূর্ণ সমাধান",
    features: [
      "সর্বোচ্চ ৫,০০০টি প্রশ্নপত্র তৈরি (5,000 Papers quota)",
      "মোট ১৫,০০০টি প্রশ্ন তৈরির বৃহৎ কোটা",
      "PDF ও Word (DOCS) উভয় ফরম্যাটে এক্সপোর্ট",
      "AI ও ছবি/ডকুমেন্ট থেকে সরাসরি প্রশ্ন ইমপোর্ট (Import ON)",
      "স্কুল/কোচিং সেন্টারের নিজস্ব লোগো ও ব্র্যান্ডিং",
      "প্রশ্ন ব্যাংক, ৪-সেট প্রশ্ন ও আনলিমিটেড সংস্করণ",
      "২৪/৭ প্রায়োরিটি কাস্টমার সাপোর্ট"
    ]
  },
  diamond: {
    code: "diamond",
    name: "Diamond Package",
    price: 3500,
    interval: "মাসিক (Monthly)",
    badge: "আনলিমিটেড সুপার প্যাকেজ",
    features: [
      "সম্পূর্ণ আনলিমিটেড প্রশ্নপত্র তৈরি (Unlimited Papers)",
      "সম্পূর্ণ আনলিমিটেড প্রশ্ন তৈরির লাইব্রেরি কোটা (Unlimited Questions)",
      "PDF ও Word (DOCS) উভয় ফরম্যাটে এক্সপোর্ট",
      "AI ও ছবি/ডকুমেন্ট থেকে সরাসরি প্রশ্ন ইমপোর্ট (Import ON)",
      "স্কুল/কোচিং সেন্টারের নিজস্ব লোগো ও ফুল ব্র্যান্ডিং",
      "প্রশ্ন ব্যাংক, ৪-সেট প্রশ্ন ও ওএমআর শিট জেনারেশন",
      "২৪/৭ ডেডিকেটেড ভিআইপি কাস্টমার সাপোর্ট"
    ]
  }
};

export function CheckoutView({
  user,
  initialOptions,
  initialRequests = []
}: {
  user: UserSession;
  initialOptions: PaymentOption[];
  initialRequests?: PaymentRequest[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlanParam = searchParams.get("plan");
  const defaultPlan: "small" | "pro" | "ultra" | "diamond" =
    initialPlanParam === "diamond"
      ? "diamond"
      : initialPlanParam === "ultra"
      ? "ultra"
      : initialPlanParam === "small"
      ? "small"
      : "pro";

  const [selectedPlan, setSelectedPlan] = useState<"small" | "pro" | "ultra" | "diamond">(defaultPlan);
  const [paymentOptions] = useState<PaymentOption[]>(initialOptions);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    initialOptions.length > 0 ? initialOptions[0].id : null
  );

  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<PaymentRequest | null>(null);
  const [myRequests, setMyRequests] = useState<PaymentRequest[]>(initialRequests);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentPlanInfo = PLAN_DATA[selectedPlan];
  const activeOption = paymentOptions.find((opt) => opt.id === selectedOptionId) || null;

  function copyToClipboard(text: string, id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedOptionId) {
      setErrorMsg("অনুগ্রহ করে একটি পেমেন্ট মেথড বেছে নিন (Select a payment method).");
      return;
    }

    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setErrorMsg("অনুগ্রহ করে সঠিক Transaction ID (TrxID) লিখুন (কমপক্ষে ৪ অক্ষর).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await clientApi.submitCheckout({
        planCode: selectedPlan,
        paymentOptionId: selectedOptionId,
        transactionId: transactionId.trim(),
        senderNumber: senderNumber.trim() || undefined,
        customerNote: customerNote.trim() || undefined
      });

      setSubmittedRequest(res);
      setMyRequests((prev) => [res, ...prev]);
    } catch (err: any) {
      setErrorMsg(err?.message || "পেমেন্ট রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            প্যাকেজ তালিকায় ফিরে যান
          </Link>
          <span className="text-muted-foreground text-xs">•</span>
          <Badge variant="outline" className="text-xs text-primary border-primary/30">
            নিরাপদ চেকআউট
          </Badge>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          সাবস্ক্রিপশন চেকআউট (Subscription Checkout)
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
          আপনার পছন্দসই প্যাকেজের পেমেন্ট তথ্য প্রদান করুন। প্রদত্ত নম্বরে টাকা পাঠিয়ে Transaction ID জমা দিলে
          এডমিন যাচাই করে আপনার অ্যাকাউন্টটি প্রো বা আল্ট্রা ফিচারে সক্রিয় করে দেবে।
        </p>
      </div>

      {/* SUCCESS CONFIRMATION RECEIPT */}
      {submittedRequest && (
        <Card className="border-emerald-500/50 bg-emerald-500/[0.04] shadow-md animate-in fade-in zoom-in-95">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-emerald-700 dark:text-emerald-400">
                  পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে!
                </CardTitle>
                <CardDescription className="text-xs">
                  আপনার রিকোয়েস্টটি এডমিন যাচাইয়ের জন্য অপেক্ষমান (Pending Approval)।
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 p-4 rounded-lg bg-card border text-sm">
              <div>
                <p className="text-xs text-muted-foreground">রিকোয়েস্ট আইডি</p>
                <p className="font-mono font-medium text-foreground">{submittedRequest.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">নির্বাচিত প্যাকেজ</p>
                <p className="font-semibold text-primary">{submittedRequest.planName} (৳{submittedRequest.amount})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">পেমেন্ট মেথড</p>
                <p className="font-medium">{submittedRequest.paymentOptionTitle} ({submittedRequest.paymentOptionNumber})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transaction ID (TrxID)</p>
                <p className="font-mono font-bold text-foreground">{submittedRequest.transactionId}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>পরবর্তী ধাপ:</strong> আমাদের এডমিন টিম আপনার ট্রানজেকশন আইডি টি ভেরিফাই করে অবিলম্বে আপনার অ্যাকাউন্টটি <strong>{submittedRequest.planName}</strong> প্যাকেজে উন্নীত করবেন। সক্রিয় হওয়া মাত্রই আপনি সকল নতুন ফিচার ব্যবহার করতে পারবেন।
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild variant="primary">
                <Link href="/dashboard">ড্যাশবোর্ডে প্রবেশ করুন</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/subscription">প্যাকেজ পেজ দেখুন</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSubmittedRequest(null);
                  setTransactionId("");
                  setSenderNumber("");
                  setCustomerNote("");
                }}
              >
                আরেকটি রিকোয়েস্ট জমা দিন
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAIN CHECKOUT FORM & DETAILS */}
      {!submittedRequest && (
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: PACKAGE SELECTION & USER INFO (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Package Selector */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    ১. প্যাকেজ নির্বাচন (Select Plan)
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">মাসিক বিলিং</Badge>
                </div>
                <CardDescription className="text-xs">
                  আপনি কোন প্যাকেজটি নিতে চান তা নির্বাচন করুন:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Switch between Small, Pro, Ultra and Diamond */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("small")}
                    className={`py-2 px-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      selectedPlan === "small"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                    Small (৳২৫০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("pro")}
                    className={`py-2 px-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      selectedPlan === "pro"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 text-blue-500" />
                    Pro (৳৫০০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("ultra")}
                    className={`py-2 px-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      selectedPlan === "ultra"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    Ultra (৳১,০০০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("diamond")}
                    className={`py-2 px-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      selectedPlan === "diamond"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Crown className="h-3.5 w-3.5 text-cyan-500" />
                    Diamond (৳৩,৫০০)
                  </button>
                </div>

                {/* Selected Package Details */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    selectedPlan === "diamond"
                      ? "border-cyan-500/40 bg-cyan-500/[0.03]"
                      : selectedPlan === "ultra"
                      ? "border-purple-500/40 bg-purple-500/[0.03]"
                      : selectedPlan === "pro"
                      ? "border-blue-500/40 bg-blue-500/[0.03]"
                      : "border-emerald-500/40 bg-emerald-500/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-lg text-foreground">{currentPlanInfo.name}</span>
                        <Badge
                          className={
                            selectedPlan === "diamond"
                              ? "bg-cyan-600 text-white text-[10px]"
                              : selectedPlan === "ultra"
                              ? "bg-purple-600 text-white text-[10px]"
                              : selectedPlan === "pro"
                              ? "bg-blue-600 text-white text-[10px]"
                              : "bg-emerald-600 text-white text-[10px]"
                          }
                        >
                          {currentPlanInfo.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{currentPlanInfo.interval}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-foreground">৳{currentPlanInfo.price}</span>
                      <p className="text-[10px] text-muted-foreground">টাকা / মাস</p>
                    </div>
                  </div>

                  {/* Feature checklist */}
                  <div className="mt-4 pt-3 border-t space-y-2 text-xs">
                    <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                      প্যাকেজের প্রধান সুবিধাসমূহ:
                    </p>
                    {currentPlanInfo.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Summary Breakdown */}
                <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>প্যাকেজ মূল্য (Subtotal):</span>
                    <span>৳{currentPlanInfo.price}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>অ্যাক্টিভেশন ফি (Activation Fee):</span>
                    <span className="text-emerald-600 font-medium">ফ্রি (৳০)</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t">
                    <span>মোট পরিশোধযোগ্য (Total Payable):</span>
                    <span className="text-primary text-base">৳{currentPlanInfo.price} টাকা</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Account Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  ২. ব্যবহারকারীর তথ্য (Account Details)
                </CardTitle>
                <CardDescription className="text-xs">
                  এই অ্যাকাউন্টে প্যাকেজটি সক্রিয় হবে:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">শিক্ষক / প্রতিষ্ঠানের নাম</span>
                    <span className="font-semibold text-foreground text-sm">{user.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">ইমেইল এড্রেস</span>
                    <span className="font-medium text-foreground truncate block">{user.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">বর্তমান প্যাকেজ</span>
                    <Badge variant="outline" className="text-[11px] font-semibold mt-0.5">
                      {user.plan?.toUpperCase() || "FREE"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">অ্যাকাউন্ট স্ট্যাটাস</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium mt-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> সক্রিয় (Verified)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: PAYMENT SYSTEM & TRANSACTION SUBMISSION (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="border-primary/30 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    ৩. পেমেন্ট সিস্টেম ও ট্রানজেকশন (Payment System)
                  </CardTitle>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    ম্যানুয়াল ভেরিফিকেশন
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  নিচের যে কোনো একটি মাধ্যমে নির্ধারিত অর্থ পাঠিয়ে ট্রানজেকশন আইডি প্রদান করুন:
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 1. Payment Options Selector */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground block">
                    পেমেন্ট মেথড নির্বাচন করুন (Select Payment Method):
                  </label>

                  {paymentOptions.length === 0 ? (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                      কোনো পেমেন্ট অপশন পাওয়া যায়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {paymentOptions.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setSelectedOptionId(opt.id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm"
                                : "hover:border-primary/50 hover:bg-muted/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                  {opt.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{opt.subtitle}</p>
                              </div>
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2">
                              <span className="font-mono text-sm font-bold text-foreground tracking-wider">
                                {opt.number}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(opt.number, opt.id);
                                }}
                              >
                                {copiedId === opt.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>কপি হয়েছে</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>কপি</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Step-by-Step Instructions for the selected option */}
                {activeOption && (
                  <div className="p-4 rounded-xl bg-muted/40 border space-y-2 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      কীভাবে পেমেন্ট করবেন ({activeOption.title}):
                    </div>
                    {activeOption.instruction ? (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {activeOption.instruction}
                      </p>
                    ) : (
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
                        <li>আপনার {activeOption.title.split(" ")[0]} অ্যাপ বা ডায়াল কোড চালু করুন।</li>
                        <li><strong>{activeOption.subtitle}</strong> অপশন সিলেক্ট করুন।</li>
                        <li>প্রাপকের নম্বর হিসেবে <strong>{activeOption.number}</strong> দিন।</li>
                        <li>টাকার পরিমাণ <strong>৳{currentPlanInfo.price}</strong> লিখুন।</li>
                        <li>লেনদেন সম্পন্ন করার পর প্রাপ্ত <strong>Transaction ID (TrxID)</strong> টি কপি করুন।</li>
                      </ol>
                    )}
                  </div>
                )}

                {/* 3. Transaction ID Form (Requirement: opens when user selects payment option) */}
                {activeOption && (
                  <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm text-foreground">
                        ট্রানজেকশন তথ্য প্রদান করুন (Enter Transaction Details):
                      </h3>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>
                          Transaction ID (TrxID) <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">যেমন: 9B8C7D6A5E</span>
                      </label>
                      <Input
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="পেমেন্ট শেষে প্রাপ্ত ট্রানজেকশন আইডি এখানে লিখুন"
                        className="font-mono text-sm tracking-wide bg-background uppercase placeholder:normal-case placeholder:font-sans"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        SMS অথবা অ্যাপের হিস্ট্রি থেকে ট্রানজেকশন আইডি কপি করে পেস্ট করুন।
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          প্রেরকের মোবাইল নম্বর (Sender Number)
                        </label>
                        <Input
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          placeholder="যেমন: 017XXXXXXXX (ঐচ্ছিক)"
                          className="text-xs bg-background"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          যে নম্বর থেকে টাকা পাঠিয়েছেন তা দিলে দ্রুত যাচাই হবে।
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          অতিরিক্ত মন্তব্য (Note)
                        </label>
                        <Input
                          value={customerNote}
                          onChange={(e) => setCustomerNote(e.target.value)}
                          placeholder="রেফারেন্স বা বিশেষ নির্দেশনা (ঐচ্ছিক)"
                          className="text-xs bg-background"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={submitting || !transactionId.trim()}
                        className="w-full gap-2 font-bold py-6 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        {submitting
                          ? "অনুরোধ পাঠানো হচ্ছে..."
                          : `৳${currentPlanInfo.price} পরিশোধের তথ্য সাবমিট করুন (Submit Request)`}
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" />
                        আপনার তথ্য সুরক্ষিত রাখা হয় এবং এডমিন সরাসরি লেনদেন যাচাই করবেন।
                      </p>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* RECENT / PAST PAYMENT REQUESTS SECTION */}
      {myRequests.length > 0 && (
        <Card className="mt-8 border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              আপনার পূর্ববর্তী পেমেন্ট রিকোয়েস্টসমূহ (My Payment History)
            </CardTitle>
            <CardDescription className="text-xs">
              পূর্বে প্রেরিত পেমেন্ট রিকোয়েস্ট এবং সেগুলোর অনুমোদন স্ট্যাটাস:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2.5 font-medium">রিকোয়েস্ট আইডি</th>
                    <th className="py-2.5 font-medium">প্যাকেজ</th>
                    <th className="py-2.5 font-medium">পরিমাণ</th>
                    <th className="py-2.5 font-medium">পেমেন্ট মেথড</th>
                    <th className="py-2.5 font-medium">Transaction ID</th>
                    <th className="py-2.5 font-medium">তারিখ</th>
                    <th className="py-2.5 font-medium text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground">
                  {myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/20">
                      <td className="py-3 font-mono text-foreground">{req.id}</td>
                      <td className="py-3 font-semibold text-foreground">{req.planName}</td>
                      <td className="py-3 font-medium">৳{req.amount}</td>
                      <td className="py-3">{req.paymentOptionTitle}</td>
                      <td className="py-3 font-mono font-bold text-foreground">{req.transactionId}</td>
                      <td className="py-3">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString("bn-BD") : "N/A"}
                      </td>
                      <td className="py-3 text-right">
                        {req.status === "approved" ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            অনুমোদিত (Approved)
                          </Badge>
                        ) : req.status === "rejected" ? (
                          <Badge variant="destructive" className="text-[10px]">
                            বাতিল (Rejected)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                            অপেক্ষমান (Pending)
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
