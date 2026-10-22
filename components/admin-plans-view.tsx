"use client";

import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Edit,
  Eye,
  FileDown,
  FileText,
  Infinity as InfinityIcon,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  X,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientApi } from "@/lib/client-api";
import { useAppModal } from "@/components/modal-provider";
import { formatBnNumber } from "@/lib/utils";
import type { Plan } from "@/lib/api-types";

const DURATION_PRESETS = [
  { label: "১৫ দিন", days: 15, text: "১৫ দিন" },
  { label: "৩০ দিন (১ মাস)", days: 30, text: "৩০ দিন" },
  { label: "৩ মাস", days: 90, text: "৩ মাস (৯০ দিন)" },
  { label: "৬ মাস", days: 180, text: "৬ মাস (১৮০ দিন)" },
  { label: "১ বছর", days: 365, text: "১ বছর (৩৬৫ দিন)" },
  { label: "লাইফটাইম", days: 0, text: "লাইফটাইম" }
];

interface PlanFormData {
  code: string;
  name: string;
  price: number;
  interval: string;
  duration: string;
  durationDays: number;
  paperLimit: number;
  questionLimit: number;
  totalQuestionsLimit: number;
  allowDocx: boolean;
  importQuestion: boolean;
  watermark: boolean;
  questionBank: boolean;
  branding: boolean;
  randomGenerator: boolean;
  multipleVersions: boolean;
  description: string;
  isActive: boolean;
}

const DEFAULT_FORM_DATA: PlanFormData = {
  code: "",
  name: "",
  price: 500,
  interval: "month",
  duration: "৩০ দিন",
  durationDays: 30,
  paperLimit: 1000,
  questionLimit: 100,
  totalQuestionsLimit: 5000,
  allowDocx: false,
  importQuestion: false,
  watermark: false,
  questionBank: true,
  branding: true,
  randomGenerator: true,
  multipleVersions: true,
  description: "",
  isActive: true
};

export function AdminPlansView({
  initialPlans = []
}: {
  initialPlans?: Plan[];
}) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(DEFAULT_FORM_DATA);
  const [formError, setFormError] = useState<string | null>(null);

  const { showAlert, showConfirm } = useAppModal();

  const loadPlans = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await clientApi.adminGetPlans();
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (err: any) {
      console.error("Failed to load plans:", err);
      if (!silent) {
        showAlert({
          title: "ত্রুটি",
          message: err?.message || "প্ল্যান তালিকা লোড করতে ব্যর্থ হয়েছে",
          type: "error"
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialPlans.length) {
      loadPlans();
    }
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingCode(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setIsEditing(true);
    setEditingCode(plan.code);
    setFormData({
      code: plan.code,
      name: plan.name,
      price: plan.price,
      interval: plan.interval || "month",
      duration: plan.duration || (plan.price === 0 ? "লাইফটাইম" : "৩০ দিন"),
      durationDays: typeof plan.durationDays === "number" ? plan.durationDays : (plan.price === 0 ? 0 : 30),
      paperLimit: plan.paperLimit,
      questionLimit: plan.questionLimit,
      totalQuestionsLimit: plan.totalQuestionsLimit,
      allowDocx: Array.isArray(plan.exports) ? plan.exports.includes("docx") : false,
      importQuestion: Boolean(plan.importQuestion),
      watermark: Boolean(plan.watermark),
      questionBank: plan.questionBank !== false,
      branding: plan.branding !== false,
      randomGenerator: plan.randomGenerator !== false,
      multipleVersions: plan.multipleVersions !== false,
      description: plan.description || "",
      isActive: plan.isActive !== false
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleApplyPreset = (preset: { label: string; days: number; text: string }) => {
    setFormData((prev) => ({
      ...prev,
      duration: preset.text,
      durationDays: preset.days,
      interval: preset.days === 0 ? "lifetime" : preset.days >= 365 ? "year" : "month"
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    if (!trimmedName) {
      setFormError("প্যাকেজের নাম লিখুন");
      return;
    }

    if (!isEditing && !trimmedCode) {
      setFormError("প্যাকেজের কোড (Identifier) লিখুন (যেমন: starter, custom)");
      return;
    }

    const payload: Partial<Plan> = {
      code: isEditing ? (editingCode as string) : trimmedCode,
      name: trimmedName,
      price: Math.max(0, Number(formData.price) || 0),
      interval: formData.interval || "month",
      duration: formData.duration?.trim() || "৩০ দিন",
      durationDays: Number(formData.durationDays) || 0,
      paperLimit: Math.max(1, Number(formData.paperLimit) || 1),
      questionLimit: Math.max(1, Number(formData.questionLimit) || 1),
      totalQuestionsLimit: Math.max(1, Number(formData.totalQuestionsLimit) || 1),
      exports: formData.allowDocx ? ["pdf", "docx"] : ["pdf"],
      importQuestion: formData.importQuestion,
      watermark: formData.watermark,
      questionBank: formData.questionBank,
      branding: formData.branding,
      randomGenerator: formData.randomGenerator,
      multipleVersions: formData.multipleVersions,
      description: formData.description?.trim() || "",
      isActive: formData.isActive
    };

    setSaving(true);
    try {
      if (isEditing && editingCode) {
        await clientApi.adminUpdatePlan(editingCode, payload);
        showAlert({
          title: "সফল",
          message: `"${trimmedName}" প্যাকেজটি সফলভাবে আপডেট করা হয়েছে!`,
          type: "success"
        });
      } else {
        await clientApi.adminCreatePlan(payload);
        showAlert({
          title: "সফল",
          message: `নতুন প্যাকেজ "${trimmedName}" সফলভাবে তৈরি করা হয়েছে!`,
          type: "success"
        });
      }
      setModalOpen(false);
      await loadPlans(true);
    } catch (err: any) {
      console.error("Save plan error:", err);
      setFormError(err?.message || "প্যাকেজ সংরক্ষণ করতে ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = (plan: Plan) => {
    if (plan.code === "free") {
      showAlert({
        title: "নিষেধাজ্ঞা",
        message: "ডিফল্ট Free প্ল্যানটি সিস্টেমের মূল অংশ, এটি মুছে ফেলা যাবে না।",
        type: "warning"
      });
      return;
    }

    showConfirm({
      title: "প্যাকেজ মুছে ফেলুন",
      message: `আপনি কি নিশ্চিতভাবে "${plan.name}" (${plan.code}) প্যাকেজটি মুছে ফেলতে চান?`,
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clientApi.adminDeletePlan(plan.code);
          showAlert({
            title: "সফল",
            message: "প্যাকেজটি সফলভাবে মুছে ফেলা হয়েছে",
            type: "success"
          });
          await loadPlans(true);
        } catch (err: any) {
          showAlert({
            title: "ত্রুটি",
            message: err?.message || "প্যাকেজ মুছতে ব্যর্থ হয়েছে",
            type: "error"
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card border p-4 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <BadgeDollarSign className="h-5 w-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              প্যাকেজ ও সাবস্ক্রিপশন প্ল্যান ব্যবস্থাপনা (Plans)
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            প্রতিটি প্যাকেজের মূল্য, মেয়াদ (Duration), প্রশ্নপত্র ও প্রশ্ন সংখ্যা কোটা এবং অ্যাক্সেস পারমিশন রিয়েল-টাইমে ডেটাবেস থেকে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPlans(false)}
            disabled={loading}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="h-9 gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            নতুন প্যাকেজ তৈরি করুন
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isFree = plan.code === "free";
          const isDiamond = plan.code === "diamond";
          const isUltra = plan.code === "ultra";
          const isPro = plan.code === "pro";
          const isSmall = plan.code === "small";

          let borderClass = "border-border";
          if (isDiamond) borderClass = "border-cyan-500/60 ring-1 ring-cyan-500/20";
          else if (isUltra) borderClass = "border-purple-500/60 ring-1 ring-purple-500/20";
          else if (isPro) borderClass = "border-blue-500/60 ring-1 ring-blue-500/20";
          else if (isSmall) borderClass = "border-emerald-500/60 ring-1 ring-emerald-500/20";

          return (
            <Card
              key={plan.code}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${borderClass} bg-card flex flex-col justify-between`}
            >
              <div>
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-extrabold text-foreground capitalize">
                          {plan.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] px-1.5 py-0 uppercase bg-muted/60"
                        >
                          {plan.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {plan.description || "সাবস্ক্রিপশন প্যাকেজ"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {plan.isActive === false && (
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                          নিষ্ক্রিয়
                        </Badge>
                      )}
                      {isDiamond ? (
                        <Crown className="h-5 w-5 text-cyan-600 shrink-0" />
                      ) : isUltra ? (
                        <Sparkles className="h-5 w-5 text-purple-600 shrink-0" />
                      ) : isPro ? (
                        <Zap className="h-5 w-5 text-blue-600 shrink-0" />
                      ) : null}
                    </div>
                  </div>

                  {/* Price & Duration Row */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-foreground">
                        ৳{formatBnNumber(plan.price)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {plan.price === 0 ? "/ ফ্রি" : ` / ${plan.interval === "month" ? "মাসিক" : plan.interval}`}
                      </span>
                    </div>

                    {/* DURATION BADGE */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold shadow-2xs">
                      <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span>মেয়াদ: {plan.duration || (plan.price === 0 ? "লাইফটাইম" : "৩০ দিন")}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-4 space-y-3.5 text-xs">
                  {/* Quotas Box */}
                  <div className="rounded-xl bg-muted/40 p-3 space-y-2 border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">প্রশ্নপত্র কোটা:</span>
                      <span className="font-bold text-foreground">
                        {plan.paperLimit >= 999999 ? (
                          <span className="inline-flex items-center gap-1 text-cyan-600">
                            <InfinityIcon className="h-3 w-3" /> আনলিমিটেড
                          </span>
                        ) : (
                          `${formatBnNumber(plan.paperLimit)} টি`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">প্রতি পেপারে প্রশ্ন:</span>
                      <span className="font-bold text-foreground">
                        {plan.questionLimit >= 999999 ? (
                          <span className="inline-flex items-center gap-1 text-cyan-600">
                            <InfinityIcon className="h-3 w-3" /> আনলিমিটেড
                          </span>
                        ) : (
                          `${formatBnNumber(plan.questionLimit)} টি`
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">লাইব্রেরি কোটা:</span>
                      <span className="font-bold text-foreground">
                        {plan.totalQuestionsLimit >= 999999 ? (
                          <span className="inline-flex items-center gap-1 text-cyan-600">
                            <InfinityIcon className="h-3 w-3" /> আনলিমিটেড
                          </span>
                        ) : (
                          `${formatBnNumber(plan.totalQuestionsLimit)} টি`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checkmarks */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>PDF এক্সপোর্ট</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {plan.exports?.includes("docx") ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <span className="font-semibold text-purple-700 dark:text-purple-300">Word (DOCX)</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-40" />
                          <span className="text-muted-foreground line-through">Word (DOCX)</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {plan.importQuestion ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <span className="font-semibold text-purple-700 dark:text-purple-300">প্রশ্ন ইমপোর্ট</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-40" />
                          <span className="text-muted-foreground line-through">প্রশ্ন ইমপোর্ট</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {plan.watermark ? (
                        <>
                          <X className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="text-amber-700 dark:text-amber-400">ওয়াটারমার্ক যুক্ত</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>ওয়াটারমার্ক মুক্ত</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {plan.branding ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>প্রতিষ্ঠান ব্র্যান্ডিং</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-40" />
                          <span className="text-muted-foreground line-through">ব্র্যান্ডিং</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {plan.multipleVersions ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>৪-সেট প্রশ্ন ও ওএমআর</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-40" />
                          <span className="text-muted-foreground line-through">৪-সেট ওএমআর</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-2 border-t bg-muted/10 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(plan)}
                  className="h-8 flex-1 gap-1 text-xs font-semibold border-teal-300/80 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  <Edit className="h-3.5 w-3.5" />
                  সম্পাদনা করুন (Edit)
                </Button>

                {!isFree && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlan(plan)}
                    className="h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="প্যাকেজ মুছে ফেলুন"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* CREATE & EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border bg-card p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                  <BadgeDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {isEditing ? `"${formData.name}" প্যাকেজ সম্পাদনা করুন` : "নতুন প্যাকেজ তৈরি করুন (Create Plan)"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    প্যাকেজের নাম, মূল্য, মেয়াদ (Duration) এবং ফিচার কনফিগার করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <X className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Basic Info: Name, Code, Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    প্যাকেজের নাম (Plan Name) *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="যেমন: Half-Yearly Pro"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    প্যাকেজ কোড (Unique Code) *
                  </label>
                  <Input
                    required
                    disabled={isEditing}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_") })}
                    placeholder="যেমন: half_yearly"
                    className="h-9 text-xs font-mono"
                  />
                  {isEditing && (
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">কোড পরিবর্তনযোগ্য নয়</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    মূল্য (Price in BDT) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">৳</span>
                    <Input
                      type="number"
                      min={0}
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="h-9 pl-7 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* DURATION CONFIGURATION SECTION */}
              <div className="rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/40 dark:bg-teal-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    প্যাকেজের মেয়াদ (Plan Duration) *
                  </label>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400">
                    ইউজারকে প্রদর্শিত হবে ও ভ্যালিডিটি নির্ধারণ করবে
                  </span>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground mr-1 font-medium">দ্রুত নির্বাচন:</span>
                  {DURATION_PRESETS.map((preset) => {
                    const isSelected = formData.duration === preset.text;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-600 shadow-2xs"
                            : "bg-background/80 text-foreground hover:bg-background border-border"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      মেয়াদ টেক্সট (Display Text)
                    </label>
                    <Input
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="যেমন: ৩০ দিন, ৬ মাস, ১ বছর"
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      মেয়াদ দিনের সংখ্যায় (Days Count)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                      placeholder="যেমন: 30, 90, 365 (0 = লাইফটাইম)"
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Limits Configuration */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  ব্যবহারের সীমা ও কোটা (Quotas & Limits)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      প্রশ্নপত্র লিমিট (Papers Limit)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={formData.paperLimit}
                      onChange={(e) => setFormData({ ...formData, paperLimit: Number(e.target.value) })}
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">999999 = আনলিমিটেড</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      প্রতি পেপারে প্রশ্ন সীমা
                    </label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={formData.questionLimit}
                      onChange={(e) => setFormData({ ...formData, questionLimit: Number(e.target.value) })}
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">999999 = আনলিমিটেড</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      মোট প্রশ্ন কোটা (Library Quota)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      required
                      value={formData.totalQuestionsLimit}
                      onChange={(e) => setFormData({ ...formData, totalQuestionsLimit: Number(e.target.value) })}
                      className="h-9 text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">999999 = আনলিমিটেড</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  প্যাকেজের বিবরণ (Description / Tagline)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="যেমন: ব্যক্তিগত শিক্ষক ও ছোট ব্যাচের জন্য সেরা"
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {/* Features & Permissions Toggles */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  ফিচার ও পারমিশন নির্বাচন (Features & Permissions)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border p-3.5 bg-muted/20">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.allowDocx}
                      onChange={(e) => setFormData({ ...formData, allowDocx: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-foreground">Word (.docx) এক্সপোর্ট অনুমতি দিন</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.importQuestion}
                      onChange={(e) => setFormData({ ...formData, importQuestion: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-foreground">ডকুমেন্ট ও ইমেজ থেকে প্রশ্ন ইমপোর্ট</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.questionBank}
                      onChange={(e) => setFormData({ ...formData, questionBank: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-foreground">প্রশ্ন ব্যাংক অ্যাক্সেস (Question Bank)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.branding}
                      onChange={(e) => setFormData({ ...formData, branding: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-foreground">প্রতিষ্ঠান ব্র্যান্ডিং ও লোগো যুক্ত করা</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.multipleVersions}
                      onChange={(e) => setFormData({ ...formData, multipleVersions: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-foreground">৪-সেট প্রশ্ন ও ওএমআর ম্যাট্রিক্স</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.randomGenerator}
                      onChange={(e) => setFormData({ ...formData, randomGenerator: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-foreground">র্যান্ডম প্রশ্ন জেনারেটর (Question Shuffler)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.watermark}
                      onChange={(e) => setFormData({ ...formData, watermark: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-muted-foreground">ওয়াটারমার্ক বাধ্যতামূলক (সাধারণত Free তে প্রযোজ্য)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-bold text-teal-700 dark:text-teal-400">প্যাকেজটি সক্রিয় ও চালু রাখুন</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="h-9 text-xs"
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 gap-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {isEditing ? "আপডেট করুন" : "প্যাকেজ তৈরি করুন"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
