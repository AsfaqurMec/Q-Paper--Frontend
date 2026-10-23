"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Edit,
  ExternalLink,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
  Zap,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { clientApi } from "@/lib/client-api";
import { useAppModal } from "@/components/modal-provider";
import type { AdminUser, PaymentOption, PaymentRequest, PaymentRequestStatus } from "@/lib/api-types";

export function AdminUserManagementView({
  initialUsers,
  initialRequests = [],
  initialOptions = []
}: {
  initialUsers: AdminUser[];
  initialRequests?: PaymentRequest[];
  initialOptions?: PaymentOption[];
}) {
  const [activeSubTab, setActiveSubTab] = useState<"requests" | "users" | "options">(
    initialRequests.some((r) => r.status === "pending") ? "requests" : "requests"
  );

  // --- Payment Requests State ---
  const [requests, setRequests] = useState<PaymentRequest[]>(initialRequests);
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [requestSearch, setRequestSearch] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequestForAction, setSelectedRequestForAction] = useState<PaymentRequest | null>(null);
  const [actionModalType, setActionModalType] = useState<"approve" | "reject" | "details" | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- Registered Users State ---
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState<string>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");

  // --- Payment Options State ---
  const [options, setOptions] = useState<PaymentOption[]>(initialOptions);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<PaymentOption | null>(null);
  const [optionFormTitle, setOptionFormTitle] = useState("");
  const [optionFormSubtitle, setOptionFormSubtitle] = useState("");
  const [optionFormNumber, setOptionFormNumber] = useState("");
  const [optionFormInstruction, setOptionFormInstruction] = useState("");
  const [optionFormIsActive, setOptionFormIsActive] = useState(true);
  const [optionSubmitting, setOptionSubmitting] = useState(false);

  // Notification Toast / Message
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function copyText(text: string, id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  // Confirm & Activate User
  async function handleApproveRequest(req: PaymentRequest) {
    try {
      setProcessingRequestId(req.id);
      const res = await clientApi.adminApprovePaymentRequest(req.id, approvalNote);

      // Update in requests state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: "approved" as PaymentRequestStatus, adminNote: approvalNote, reviewedAt: new Date().toISOString() }
            : r
        )
      );

      // Update in users state as well
      const upgradedPlan = req.planCode === "standard" ? "pro" : req.planCode;
      setUsers((prev) =>
        prev.map((u) => (u.id === req.userId ? { ...u, plan: upgradedPlan, verified: true } : u))
      );

      showMessage("success", `পেমেন্ট নিশ্চিত করা হয়েছে এবং ব্যবহারকারী ${req.userName}-কে ${req.planName}-এ সক্রিয় (Activated) করা হয়েছে!`);
      setActionModalType(null);
      setSelectedRequestForAction(null);
      setApprovalNote("");
    } catch (err: any) {
      showMessage("error", err?.message || "অনুমোদন ব্যর্থ হয়েছে");
    } finally {
      setProcessingRequestId(null);
    }
  }

  // Reject Request
  async function handleRejectRequest(req: PaymentRequest) {
    try {
      setProcessingRequestId(req.id);
      await clientApi.adminRejectPaymentRequest(req.id, rejectReason || "Rejected by administrator");

      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: "rejected" as PaymentRequestStatus, adminNote: rejectReason, reviewedAt: new Date().toISOString() }
            : r
        )
      );

      showMessage("success", `রিকোয়েস্ট বাতিল (Rejected) করা হয়েছে।`);
      setActionModalType(null);
      setSelectedRequestForAction(null);
      setRejectReason("");
    } catch (err: any) {
      showMessage("error", err?.message || "বাতিল করতে সমস্যা হয়েছে");
    } finally {
      setProcessingRequestId(null);
    }
  }

  // Save Payment Option (Create / Edit)
  async function handleSaveOption(e: React.FormEvent) {
    e.preventDefault();
    if (!optionFormTitle.trim() || !optionFormSubtitle.trim() || !optionFormNumber.trim()) {
      showMessage("error", "Title, Subtitle এবং Number সবগুলো ফিল্ড পূরণ করুন।");
      return;
    }

    try {
      setOptionSubmitting(true);
      if (editingOption) {
        const updated = await clientApi.adminUpdatePaymentOption(editingOption.id, {
          title: optionFormTitle,
          subtitle: optionFormSubtitle,
          number: optionFormNumber,
          instruction: optionFormInstruction,
          isActive: optionFormIsActive
        });
        setOptions((prev) => prev.map((o) => (o.id === editingOption.id ? updated : o)));
        showMessage("success", "পেমেন্ট অপশন আপডেট করা হয়েছে।");
      } else {
        const created = await clientApi.adminCreatePaymentOption({
          title: optionFormTitle,
          subtitle: optionFormSubtitle,
          number: optionFormNumber,
          instruction: optionFormInstruction,
          isActive: optionFormIsActive
        });
        setOptions((prev) => [created, ...prev]);
        showMessage("success", "নতুন পেমেন্ট অপশন সফলভাবে তৈরি হয়েছে।");
      }

      setOptionModalOpen(false);
      setEditingOption(null);
      setOptionFormTitle("");
      setOptionFormSubtitle("");
      setOptionFormNumber("");
      setOptionFormInstruction("");
      setOptionFormIsActive(true);
    } catch (err: any) {
      showMessage("error", err?.message || "পেমেন্ট অপশন সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setOptionSubmitting(false);
    }
  }

  const { showAlert, showConfirm } = useAppModal();

  // Delete Payment Option
  function handleDeleteOption(id: string) {
    showConfirm({
      title: "পেমেন্ট অপশন মুছে ফেলুন (Delete Payment Option)",
      message: "আপনি কি নিশ্চিতভাবে এই পেমেন্ট অপশনটি মুছে ফেলতে চান?",
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clientApi.adminDeletePaymentOption(id);
          setOptions((prev) => prev.filter((o) => o.id !== id));
          showMessage("success", "পেমেন্ট অপশন মুছে ফেলা হয়েছে।");
        } catch (err: any) {
          showMessage("error", err?.message || "মুছে ফেলতে সমস্যা হয়েছে");
        }
      }
    });
  }

  // Open Create Option Modal
  function openCreateOptionModal() {
    setEditingOption(null);
    setOptionFormTitle("");
    setOptionFormSubtitle("");
    setOptionFormNumber("");
    setOptionFormInstruction("");
    setOptionFormIsActive(true);
    setOptionModalOpen(true);
  }

  // Open Edit Option Modal
  function openEditOptionModal(opt: PaymentOption) {
    setEditingOption(opt);
    setOptionFormTitle(opt.title);
    setOptionFormSubtitle(opt.subtitle);
    setOptionFormNumber(opt.number);
    setOptionFormInstruction(opt.instruction || "");
    setOptionFormIsActive(opt.isActive);
    setOptionModalOpen(true);
  }

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = requestFilter === "all" || r.status === requestFilter;
    const matchesSearch =
      !requestSearch ||
      r.userName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.transactionId.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (r.senderNumber && r.senderNumber.includes(requestSearch));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesPlan = userPlanFilter === "all" || u.plan === userPlanFilter;
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesPlan && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setMessage(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">মোট নিবন্ধিত ইউজার</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>{users.length}</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            সিস্টেমে সর্বমোট নিবন্ধিত শিক্ষক ও ব্যবহারকারী
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? "border-amber-500/50 bg-amber-500/[0.03] ring-1 ring-amber-500/30" : ""}>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              পেন্ডিং পেমেন্ট রিকোয়েস্ট
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-amber-600">
              <span>{pendingCount}</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>অনুমোদনের জন্য অপেক্ষমান</span>
            {pendingCount > 0 && (
              <Badge className="bg-amber-600 text-white text-[10px] animate-pulse">যাচাই প্রয়োজন</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">সক্রিয় প্রিমিয়াম সাবস্ক্রাইবার</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-foreground">
              <span>{users.filter((u) => u.plan === "pro" || u.plan === "ultra" || u.plan === "standard").length}</span>
              <Zap className="h-5 w-5 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Pro: {users.filter((u) => u.plan === "pro" || u.plan === "standard").length} • Ultra: {users.filter((u) => u.plan === "ultra").length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">পেমেন্ট গেটওয়ে অপশন</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-foreground">
              <span>{options.length}</span>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>সক্রিয়: {options.filter((o) => o.isActive).length}টি</span>
            <Button size="sm" variant="ghost" className="h-6 text-[11px] p-0 text-primary" onClick={openCreateOptionModal}>
              + নতুন যোগ করুন
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
          <Button
            variant={activeSubTab === "requests" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("requests")}
            className="gap-2 text-xs"
          >
            <Clock className="h-3.5 w-3.5" />
            পেন্ডিং রিকোয়েস্ট ও অনুমোদন (Requests)
            {pendingCount > 0 && (
              <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4">
                {pendingCount}
              </Badge>
            )}
          </Button>

          <Button
            variant={activeSubTab === "users" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("users")}
            className="gap-2 text-xs"
          >
            <Users className="h-3.5 w-3.5" />
            সকল নিবন্ধিত ইউজার ({users.length})
          </Button>

          <Button
            variant={activeSubTab === "options" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveSubTab("options")}
            className="gap-2 text-xs"
          >
            <CreditCard className="h-3.5 w-3.5" />
            পেমেন্ট অপশন কনফিগারেশন ({options.length})
          </Button>
        </div>

        {activeSubTab === "options" && (
          <Button size="sm" onClick={openCreateOptionModal} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="h-3.5 w-3.5" />
            পেমেন্ট অপশন তৈরি করুন
          </Button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. PENDING REQUESTS TABLE & MANAGEMENT                         */}
      {/* ============================================================== */}
      {activeSubTab === "requests" && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  পেন্ডিং সাবস্ক্রিপশন ও পেমেন্ট রিকোয়েস্ট টেবিল
                </CardTitle>
                <CardDescription className="text-xs">
                  ব্যবহারকারীদের প্রেরিত প্যাকেজ আপগ্রেড রিকোয়েস্ট যাচাই করুন এবং অনুমোদন করে ইউজার একাউন্ট সক্রিয় করুন।
                </CardDescription>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setRequestFilter("pending")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    requestFilter === "pending"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  পেন্ডিং ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter("approved")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    requestFilter === "approved"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  অনুমোদিত ({requests.filter((r) => r.status === "approved").length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter("rejected")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    requestFilter === "rejected"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  বাতিল ({requests.filter((r) => r.status === "rejected").length})
                </button>
                <button
                  type="button"
                  onClick={() => setRequestFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    requestFilter === "all"
                      ? "bg-background text-foreground shadow-xs ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  সবগুলো ({requests.length})
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="pt-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="ইউজার নাম, ইমেইল বা TrxID দিয়ে খুঁজুন..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                <p>কোনো রিকোয়েস্ট পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs min-w-[760px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground bg-muted/20">
                      <th className="py-3 px-3 font-medium">ইউজার বিবরণ</th>
                      <th className="py-3 px-3 font-medium">আবেদনকৃত প্যাকেজ</th>
                      <th className="py-3 px-3 font-medium">পেমেন্ট গেটওয়ে</th>
                      <th className="py-3 px-3 font-medium">Transaction ID (TrxID)</th>
                      <th className="py-3 px-3 font-medium">প্রেরকের নম্বর</th>
                      <th className="py-3 px-3 font-medium">তারিখ ও সময়</th>
                      <th className="py-3 px-3 font-medium">স্ট্যাটাস</th>
                      <th className="py-3 px-3 font-medium text-right">পদক্ষেপ (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-muted-foreground">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        {/* User Info */}
                        <td className="py-3 px-3">
                          <p className="font-semibold text-foreground text-sm">{req.userName}</p>
                          <p className="text-muted-foreground text-[11px]">{req.userEmail}</p>
                          <span className="font-mono text-[10px] text-muted-foreground/80">ID: {req.id}</span>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={
                                req.planCode === "diamond"
                                  ? "bg-cyan-600 text-white text-[10px]"
                                  : req.planCode === "ultra"
                                  ? "bg-purple-600 text-white text-[10px]"
                                  : "bg-blue-600 text-white text-[10px]"
                              }
                            >
                              {req.planName}
                            </Badge>
                            <span className="font-bold text-foreground text-xs">৳{req.amount}</span>
                          </div>
                        </td>

                        {/* Payment Gateway */}
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{req.paymentOptionTitle}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{req.paymentOptionNumber}</p>
                        </td>

                        {/* Transaction ID */}
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 border font-mono font-bold text-foreground text-xs">
                            <span>{req.transactionId}</span>
                            <button
                              type="button"
                              onClick={() => copyText(req.transactionId, req.id)}
                              className="text-muted-foreground hover:text-foreground"
                              title="কপি করুন"
                            >
                              {copiedId === req.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Sender Phone */}
                        <td className="py-3 px-3 font-mono text-xs">
                          {req.senderNumber || <span className="text-muted-foreground/60">—</span>}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-[11px]">
                          {req.createdAt ? new Date(req.createdAt).toLocaleString("bn-BD") : "N/A"}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {req.status === "approved" ? (
                            <Badge className="bg-emerald-600 text-white text-[10px]">অনুমোদিত ও সক্রিয়</Badge>
                          ) : req.status === "rejected" ? (
                            <Badge variant="destructive" className="text-[10px]">বাতিলকৃত</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/50 text-[10px] animate-pulse">
                              অপেক্ষমান (Pending)
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details Page Link */}
                            <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                              <Link href={`/admin/users/requests/${req.id}`}>
                                <Eye className="h-3 w-3" />
                                বিস্তারিত
                              </Link>
                            </Button>

                            {/* Approve & Activate Button */}
                            {req.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  disabled={processingRequestId === req.id}
                                  onClick={() => {
                                    setSelectedRequestForAction(req);
                                    setActionModalType("approve");
                                  }}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  সক্রিয় করুন
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-xs"
                                  disabled={processingRequestId === req.id}
                                  onClick={() => {
                                    setSelectedRequestForAction(req);
                                    setActionModalType("reject");
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 2. REGISTERED USERS MANAGEMENT TABLE                           */}
      {/* ============================================================== */}
      {activeSubTab === "users" && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  সকল নিবন্ধিত ব্যবহারকারী তালিকা (User Management)
                </CardTitle>
                <CardDescription className="text-xs">
                  ব্যবহারকারীদের রোল, প্যাকেজ এবং বিস্তারিত একাউন্ট তথ্য পরিচালনা করুন।
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="নাম বা ইমেইল খুঁজুন..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 text-xs h-8 bg-background w-48"
                  />
                </div>

                <select
                  value={userPlanFilter}
                  onChange={(e) => setUserPlanFilter(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="all">সকল প্যাকেজ</option>
                  <option value="free">Free</option>
                  <option value="small">Small</option>
                  <option value="pro">Pro</option>
                  <option value="ultra">Ultra</option>
                  <option value="diamond">Diamond</option>
                </select>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="all">সকল রোল</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs min-w-[660px]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground bg-muted/20">
                    <th className="py-3 px-3 font-medium">নাম ও ইমেইল</th>
                    <th className="py-3 px-3 font-medium">রোল (Role)</th>
                    <th className="py-3 px-3 font-medium">প্যাকেজ (Plan)</th>
                    <th className="py-3 px-3 font-medium">প্রশ্নপত্র সংখ্যা</th>
                    <th className="py-3 px-3 font-medium">নিবন্ধন তারিখ</th>
                    <th className="py-3 px-3 font-medium text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-foreground text-sm">{u.name}</p>
                        <p className="text-muted-foreground text-[11px]">{u.email}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">
                           {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={u.plan}
                          onChange={async (e) => {
                            const newPlan = e.target.value as any;
                            try {
                              await clientApi.adminUpdateUserPlan(u.id, newPlan);
                              setUsers((prev) => prev.map((usr) => (usr.id === u.id ? { ...usr, plan: newPlan } : usr)));
                              showMessage("success", `${u.name}-এর প্ল্যান ${newPlan.toUpperCase()}-এ পরিবর্তন করা হয়েছে`);
                            } catch (err: any) {
                              showMessage("error", err?.message || "প্ল্যান পরিবর্তন ব্যর্থ");
                            }
                          }}
                          className="h-7 rounded border bg-background px-2 text-xs font-semibold"
                        >
                          <option value="free">FREE</option>
                          <option value="small">SMALL</option>
                          <option value="pro">PRO</option>
                          <option value="ultra">ULTRA</option>
                          <option value="diamond">DIAMOND</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{u.paperCount}টি</td>
                      <td className="py-3 px-3 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("bn-BD") : "N/A"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              const newRole = u.role === "admin" ? "user" : "admin";
                              showConfirm({
                                title: "রোল পরিবর্তন (Change Role)",
                                message: `আপনি কি নিশ্চিতভাবে এই রোল পরিবর্তন করতে চান? (${newRole.toUpperCase()})`,
                                confirmText: "পরিবর্তন করুন",
                                cancelText: "বাতিল",
                                onConfirm: async () => {
                                  try {
                                    await clientApi.adminUpdateUserRole(u.id, newRole);
                                    setUsers((prev) => prev.map((usr) => (usr.id === u.id ? { ...usr, role: newRole } : usr)));
                                    showMessage("success", `রোল পরিবর্তন সম্পন্ন: ${newRole.toUpperCase()}`);
                                  } catch (err: any) {
                                    showMessage("error", err?.message || "রোল পরিবর্তন ব্যর্থ");
                                  }
                                }
                              });
                            }}
                          >
                            রোল টগল
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 3. PAYMENT OPTIONS MANAGEMENT                                  */}
      {/* ============================================================== */}
      {activeSubTab === "options" && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  পেমেন্ট অপশন কনফিগারেশন (Payment Options Management)
                </CardTitle>
                <CardDescription className="text-xs">
                  ব্যবহারকারীদের চেকআউট পেজে প্রদর্শিত পেমেন্ট গেটওয়ে, অ্যাকাউন্ট নম্বর ও নির্দেশনাসমূহ ম্যানেজ করুন।
                </CardDescription>
              </div>
              <Button size="sm" onClick={openCreateOptionModal} className="gap-1.5 text-xs bg-primary text-primary-foreground">
                <Plus className="h-3.5 w-3.5" />
                নতুন পেমেন্ট মেথড তৈরি করুন
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {options.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm space-y-3">
                <p>কোনো পেমেন্ট অপশন যোগ করা নেই।</p>
                <Button size="sm" onClick={openCreateOptionModal} variant="outline" className="text-xs">
                  প্রথম অপশন যোগ করুন
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {options.map((opt) => (
                  <Card key={opt.id} className={`border relative ${!opt.isActive ? "opacity-60 bg-muted/20" : "bg-card"}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-1.5">
                            {opt.title}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">{opt.subtitle}</CardDescription>
                        </div>
                        <Badge variant={opt.isActive ? "default" : "outline"} className="text-[10px]">
                          {opt.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="p-2.5 rounded bg-muted/50 border flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-foreground tracking-wider">{opt.number}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-[10px]"
                          onClick={() => copyText(opt.number, opt.id)}
                        >
                          {copiedId === opt.id ? "কপি হয়েছে" : "কপি"}
                        </Button>
                      </div>

                      {opt.instruction && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {opt.instruction}
                        </p>
                      )}

                      <div className="pt-2 border-t flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => openEditOptionModal(opt)}
                        >
                          <Edit className="h-3 w-3" />
                          সম্পাদনা
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleDeleteOption(opt.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* APPROVAL CONFIRMATION MODAL                                    */}
      {/* ============================================================== */}
      <Dialog
        open={actionModalType === "approve"}
        onOpenChange={(open) => {
          if (!open) {
            setActionModalType(null);
            setSelectedRequestForAction(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              পেমেন্ট নিশ্চিত ও ইউজার সক্রিয়করণ
            </DialogTitle>
            <DialogDescription className="text-xs">
              আপনি কি নিশ্চিতভাবে এই ব্যবহারকারীর পেমেন্ট অনুমোদন করতে চান?
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForAction && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ইউজার নাম:</span>
                  <span className="font-semibold text-foreground">{selectedRequestForAction.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ইমেইল:</span>
                  <span className="font-medium text-foreground">{selectedRequestForAction.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">আবেদনকৃত প্যাকেজ:</span>
                  <span className="font-bold text-primary">{selectedRequestForAction.planName} (৳{selectedRequestForAction.amount})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono font-bold text-foreground">{selectedRequestForAction.transactionId}</span>
                </div>
                {selectedRequestForAction.senderNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">প্রেরকের নম্বর:</span>
                    <span className="font-mono text-foreground">{selectedRequestForAction.senderNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">এডমিন নোট / মন্তব্য (ঐচ্ছিক):</label>
                <Input
                  placeholder="যেমন: Verified via bKash statement"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="text-xs bg-background"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                অনুমোদন করার সাথে সাথে ব্যবহারকারীর একাউন্ট প্ল্যান <strong>{selectedRequestForAction.planName}</strong>-এ উন্নীত হবে এবং সে সম্পূর্ণ কোটা ও ফিচার উপভোগ করতে পারবে।
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActionModalType(null)}>
                  বাতিল
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  disabled={processingRequestId === selectedRequestForAction.id}
                  onClick={() => handleApproveRequest(selectedRequestForAction)}
                >
                  {processingRequestId === selectedRequestForAction.id ? "সক্রিয় করা হচ্ছে..." : "নিশ্চিত ও এক্টিভেট করুন"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* REJECTION MODAL                                                */}
      {/* ============================================================== */}
      <Dialog
        open={actionModalType === "reject"}
        onOpenChange={(open) => {
          if (!open) {
            setActionModalType(null);
            setSelectedRequestForAction(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              রিকোয়েস্ট বাতিলকরণ (Reject Request)
            </DialogTitle>
            <DialogDescription className="text-xs">
              অকার্যকর Transaction ID বা ভুল তথ্যের কারণে রিকোয়েস্ট বাতিল করতে পারেন।
            </DialogDescription>
          </DialogHeader>

          {selectedRequestForAction && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">বাতিলের কারণ (Reason):</label>
                <Textarea
                  placeholder="যেমন: ভুল Transaction ID প্রদান করা হয়েছে অথবা একাউন্টে টাকা পৌঁছায়নি।"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs bg-background min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActionModalType(null)}>
                  ফিরে যান
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={processingRequestId === selectedRequestForAction.id}
                  onClick={() => handleRejectRequest(selectedRequestForAction)}
                >
                  {processingRequestId === selectedRequestForAction.id ? "বাতিল হচ্ছে..." : "রিকোয়েস্ট বাতিল করুন"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* CREATE / EDIT PAYMENT OPTION MODAL                             */}
      {/* ============================================================== */}
      <Dialog open={optionModalOpen} onOpenChange={setOptionModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {editingOption ? "পেমেন্ট অপশন সম্পাদনা" : "নতুন পেমেন্ট অপশন তৈরি করুন"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              চেকআউটে ব্যবহারকারীদের জন্য পেমেন্ট মেথড কনফিগার করুন:
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOption} className="space-y-3.5 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Title (শিরোনাম) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={optionFormTitle}
                onChange={(e) => setOptionFormTitle(e.target.value)}
                placeholder="যেমন: bKash (Personal), Nagad, Rocket"
                className="text-xs bg-background"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Subtitle (উপশিরোনাম) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={optionFormSubtitle}
                onChange={(e) => setOptionFormSubtitle(e.target.value)}
                placeholder="যেমন: Send Money to this personal number, Merchant Pay"
                className="text-xs bg-background"
              />
            </div>

            {/* Number */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">
                Number (অ্যাকাউন্ট বা মোবাইল নম্বর) <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={optionFormNumber}
                onChange={(e) => setOptionFormNumber(e.target.value)}
                placeholder="যেমন: 01700-123456"
                className="font-mono text-xs bg-background"
              />
            </div>

            {/* Instruction */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground">নির্দেশনা (ঐচ্ছিক):</label>
              <Textarea
                value={optionFormInstruction}
                onChange={(e) => setOptionFormInstruction(e.target.value)}
                placeholder="যেমন: অ্যাপ থেকে Send Money করুন এবং TrxID প্রদান করুন..."
                className="text-xs bg-background min-h-[60px]"
              />
            </div>

            {/* Is Active Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="optActiveCheckbox"
                checked={optionFormIsActive}
                onChange={(e) => setOptionFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <label htmlFor="optActiveCheckbox" className="font-medium text-foreground cursor-pointer">
                এই অপশনটি চেকআউটে সক্রিয় রাখুন (Active)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setOptionModalOpen(false)}>
                বাতিল
              </Button>
              <Button type="submit" size="sm" variant="primary" disabled={optionSubmitting}>
                {optionSubmitting ? "সংরক্ষণ হচ্ছে..." : editingOption ? "আপডেট করুন" : "তৈরি করুন"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
