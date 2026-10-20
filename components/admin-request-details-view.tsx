"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileCheck2,
  Lock,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { clientApi } from "@/lib/client-api";
import type { PaymentRequest, AdminUser } from "@/lib/api-types";

export function AdminRequestDetailsView({
  initialRequest,
  userStats
}: {
  initialRequest: PaymentRequest;
  userStats?: { user?: AdminUser | null; paperCount?: number };
}) {
  const router = useRouter();
  const [request, setRequest] = useState<PaymentRequest>(initialRequest);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState(request.adminNote || "");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const targetUser = userStats?.user || request.user || null;
  const paperCount = userStats?.paperCount ?? request.userPaperCount ?? 0;

  function copyTrxId() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(request.transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleApprove() {
    try {
      setProcessing(true);
      const res = await clientApi.adminApprovePaymentRequest(request.id, adminNote);
      setRequest((prev) => ({
        ...prev,
        status: "approved",
        adminNote,
        reviewedAt: new Date().toISOString()
      }));
      setFeedback({
        type: "success",
        text: `পেমেন্ট সফলভাবে নিশ্চিত করা হয়েছে এবং ব্যবহারকারীকে ${request.planName} প্ল্যানে সক্রিয় (Activated) করা হয়েছে!`
      });
      setApproveModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "অনুমোদন ব্যর্থ হয়েছে" });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    try {
      setProcessing(true);
      await clientApi.adminRejectPaymentRequest(request.id, rejectReason || "Rejected by administrator");
      setRequest((prev) => ({
        ...prev,
        status: "rejected",
        adminNote: rejectReason,
        reviewedAt: new Date().toISOString()
      }));
      setFeedback({ type: "success", text: "পেমেন্ট রিকোয়েস্ট বাতিল (Rejected) করা হয়েছে।" });
      setRejectModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "বাতিল করতে সমস্যা হয়েছে" });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-12">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ইউজার ম্যানেজমেন্ট ও রিকোয়েস্ট তালিকায় ফিরে যান
          </Link>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              পেমেন্ট রিকোয়েস্ট বিবরণী #{request.id}
            </h1>
            {request.status === "approved" ? (
              <Badge className="bg-emerald-600 text-white text-xs">অনুমোদিত ও সক্রিয়</Badge>
            ) : request.status === "rejected" ? (
              <Badge variant="destructive" className="text-xs">বাতিলকৃত</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-500/50 text-xs animate-pulse">
                অপেক্ষমান (Pending)
              </Badge>
            )}
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs"
              onClick={() => setRejectModalOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              বাতিল করুন
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
              onClick={() => setApproveModalOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              অনুমোদন ও এক্টিভেট করুন
            </Button>
          </div>
        )}
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{feedback.text}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STATUS BANNER */}
      {request.status === "approved" ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-sm">পেমেন্ট অনুমোদিত এবং ব্যবহারকারীর একাউন্ট সক্রিয় করা হয়েছে</p>
            <p>
              অনুমোদনের তারিখ: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString("bn-BD") : "N/A"}
              {request.adminNote ? ` • এডমিন নোট: "${request.adminNote}"` : ""}
            </p>
          </div>
        </div>
      ) : request.status === "rejected" ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-sm">এই পেমেন্ট রিকোয়েস্টটি বাতিল করা হয়েছে</p>
            <p>
              বাতিলের কারণ: {request.adminNote || "নির্দিষ্ট কোনো কারণ উল্লেখ করা হয়নি"} • তারিখ:{" "}
              {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString("bn-BD") : "N/A"}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-sm">এই রিকোয়েস্টটি বর্তমানে এডমিন অনুমোদনের জন্য অপেক্ষমান</p>
            <p>
              ব্যবহারকারীর প্রদত্ত Transaction ID ({request.transactionId}) যাচাই করে নিচের বাটন থেকে একাউন্ট সক্রিয় করুন।
            </p>
          </div>
        </div>
      )}

      {/* DETAILS GRID */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* 1. User Profile Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              ব্যবহারকারীর তথ্য (User Profile)
            </CardTitle>
            <CardDescription className="text-xs">
              আবেদনকারী গ্রাহকের মৌলিক তথ্য ও বর্তমান সাবস্ক্রিপশন:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border">
              <div>
                <span className="text-muted-foreground block text-[11px]">ইউজার নাম:</span>
                <span className="font-bold text-foreground text-sm">{request.userName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">ইমেইল:</span>
                <span className="font-medium text-foreground">{request.userEmail}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">বর্তমান প্যাকেজ:</span>
                <Badge variant="outline" className="text-[11px] font-semibold mt-0.5">
                  {(targetUser?.plan || request.planCode || "FREE").toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">মোট তৈরি করা প্রশ্নপত্র:</span>
                <span className="font-bold text-foreground">{paperCount}টি</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">ইউজার আইডি:</span>
                <span className="font-mono text-[10px] text-muted-foreground">{request.userId}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">নিবন্ধনের তারিখ:</span>
                <span className="text-muted-foreground">
                  {targetUser?.createdAt ? new Date(targetUser.createdAt).toLocaleDateString("bn-BD") : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Package & Order Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              আবেদনকৃত প্যাকেজ বিবরণ (Requested Package)
            </CardTitle>
            <CardDescription className="text-xs">
              যে প্যাকেজের জন্য পেমেন্ট প্রদান করা হয়েছে:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border">
              <div>
                <span className="text-muted-foreground block text-[11px]">প্যাকেজের নাম:</span>
                <Badge
                  className={
                    request.planCode === "ultra"
                      ? "bg-purple-600 text-white text-xs font-bold mt-1"
                      : "bg-blue-600 text-white text-xs font-bold mt-1"
                  }
                >
                  {request.planName}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">পরিশোধিত মূল্য:</span>
                <span className="text-xl font-black text-foreground">৳{request.amount} টাকা</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">বিলিং সাইকেল:</span>
                <span className="font-medium text-foreground">মাসিক (Monthly)</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">প্যাকেজ কোড:</span>
                <span className="font-mono text-muted-foreground">{request.planCode}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. PAYMENT & TRANSACTION VERIFICATION CARD */}
      <Card className="border-primary/30 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              পেমেন্ট ও ট্রানজেকশন তথ্য (Payment & Transaction Verification)
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {request.paymentOptionTitle}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            লেনদেনের বিস্তারিত যাচাইকরণ ডাটা:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 p-4 rounded-xl bg-muted/30 border text-xs">
            {/* Gateway & Account */}
            <div>
              <p className="text-muted-foreground text-[11px]">পেমেন্ট মেথড</p>
              <p className="font-bold text-foreground text-sm">{request.paymentOptionTitle}</p>
              <p className="text-muted-foreground text-[11px]">{request.paymentOptionSubtitle}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-[11px]">প্রাপক অ্যাকাউন্ট নম্বর (আমাদের নম্বর)</p>
              <p className="font-mono font-bold text-foreground text-sm tracking-wider">
                {request.paymentOptionNumber}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-[11px]">রিকোয়েস্ট জমা দেওয়ার সময়</p>
              <p className="font-medium text-foreground">
                {request.createdAt ? new Date(request.createdAt).toLocaleString("bn-BD") : "N/A"}
              </p>
            </div>

            {/* Transaction ID Highlight */}
            <div className="sm:col-span-2 p-3 rounded-lg bg-background border ring-1 ring-primary/20">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                Transaction ID (TrxID)
              </p>
              <div className="flex items-center justify-between gap-3 mt-1">
                <span className="font-mono text-lg font-black text-primary tracking-widest select-all">
                  {request.transactionId}
                </span>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={copyTrxId}>
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>কপি TrxID</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sender Number */}
            <div className="p-3 rounded-lg bg-background border">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                প্রেরকের মোবাইল নম্বর
              </p>
              <p className="font-mono text-sm font-bold text-foreground mt-1">
                {request.senderNumber || <span className="text-muted-foreground/60">উল্লেখ নেই</span>}
              </p>
            </div>
          </div>

          {/* Customer Note */}
          {request.customerNote && (
            <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-1">
              <p className="font-semibold text-muted-foreground">গ্রাহকের মন্তব্য (Customer Note):</p>
              <p className="text-foreground leading-relaxed">{request.customerNote}</p>
            </div>
          )}

          {/* ADMIN CONFIRMATION ACTION BOX */}
          {request.status === "pending" && (
            <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    পেমেন্ট অনুমোদন ও প্যাকেজ সক্রিয়করণ
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    &quot;অনুমোদন ও এক্টিভেট করুন&quot; বাটনে চাপ দিলে ব্যবহারকারীর প্যাকেজ অবিলম্বে {request.planName}-এ উন্নীত হবে।
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                  onClick={() => setApproveModalOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  অনুমোদন ও এক্টিভেট করুন
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* APPROVAL MODAL */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              পেমেন্ট নিশ্চিত ও ইউজার সক্রিয়করণ
            </DialogTitle>
            <DialogDescription className="text-xs">
              ব্যবহারকারী {request.userName} ({request.userEmail})-কে {request.planName} প্যাকেজে উন্নীত করতে নিশ্চিত করুন:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">প্যাকেজ:</span>
                <span className="font-bold text-primary">{request.planName} (৳{request.amount})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TrxID:</span>
                <span className="font-mono font-bold text-foreground">{request.transactionId}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">এডমিন নোট / মন্তব্য (ঐচ্ছিক):</label>
              <Input
                placeholder="যেমন: Checked and verified via statement"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="text-xs bg-background"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setApproveModalOpen(false)}>
                বাতিল
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={processing}
                onClick={handleApprove}
              >
                {processing ? "সক্রিয় হচ্ছে..." : "নিশ্চিত ও এক্টিভেট করুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              রিকোয়েস্ট বাতিলকরণ
            </DialogTitle>
            <DialogDescription className="text-xs">
              এই রিকোয়েস্টটি বাতিল করার কারণ লিখুন:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">বাতিলের কারণ:</label>
              <Textarea
                placeholder="যেমন: TrxID টি ভুল বা ম্যাচ করছে না।"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs bg-background min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
                ফিরে যান
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={processing}
                onClick={handleReject}
              >
                {processing ? "বাতিল হচ্ছে..." : "রিকোয়েস্ট বাতিল করুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
