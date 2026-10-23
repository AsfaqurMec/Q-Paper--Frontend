"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/math-renderer";
import { apiRequest } from "@/lib/client-api";
import { toStandardDigits } from "@/lib/utils";
import { getBengaliClass, getBengaliSubject } from "@/lib/curriculum-bengali";
import type { BankQuestion, ClassHierarchy, Paper, UserSession } from "@/lib/api-types";

type CreatePaperFromSelectedModalProps = {
  open: boolean;
  selectedQuestions: BankQuestion[];
  user: UserSession;
  hierarchy: ClassHierarchy[];
  onClose: () => void;
  onSuccess?: () => void;
};

const EXAM_TYPE_PRESETS = [
  { label: "মডেল টেস্ট (Model Test)", value: "Model Test" },
  { label: "ক্লাস টেস্ট (Class Test)", value: "Class Test" },
  { label: "অর্ধ-বার্ষিক পরীক্ষা (Half-Yearly)", value: "Half-Yearly Exam" },
  { label: "বার্ষিক পরীক্ষা (Annual Exam)", value: "Annual Exam" },
  { label: "প্রাক-নির্বাচনী (Pre-Test)", value: "Pre-Test Exam" },
  { label: "নির্বাচনী পরীক্ষা (Test Exam)", value: "Test Exam" },
  { label: "সাপ্তাহিক কুইজ (Weekly Quiz)", value: "Weekly Quiz" }
];

export function CreatePaperFromSelectedModal({
  open,
  selectedQuestions: initialQuestions,
  user,
  hierarchy,
  onClose,
  onSuccess
}: CreatePaperFromSelectedModalProps) {
  const router = useRouter();

  // Selected questions that can be pruned before creation
  const [questions, setQuestions] = useState<BankQuestion[]>(initialQuestions);
  const [showQuestionList, setShowQuestionList] = useState(false);

  // Sync when initialQuestions changes
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  // Derive initial values from questions
  const derivedClass = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((q) => {
      if (q.className) counts.set(q.className, (counts.get(q.className) || 0) + 1);
    });
    let maxClass = hierarchy[0]?.className || "SSC (Class 9-10)";
    let maxCount = 0;
    counts.forEach((cnt, cls) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxClass = cls;
      }
    });
    return maxClass;
  }, [questions, hierarchy]);

  const derivedSubject = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((q) => {
      const s = q.subject || q.category;
      if (s) counts.set(s, (counts.get(s) || 0) + 1);
    });
    let maxSubj = hierarchy[0]?.subjects[0]?.name || "Physics";
    let maxCount = 0;
    counts.forEach((cnt, subj) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxSubj = subj;
      }
    });
    return maxSubj;
  }, [questions, hierarchy]);

  // Form State
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [examType, setExamType] = useState("Model Test");
  const [customExamType, setCustomExamType] = useState("");
  const [duration, setDuration] = useState("");
  const [customMarks, setCustomMarks] = useState<string>("");
  const [layout, setLayout] = useState<"single" | "split">("split");
  const [cqLayout, setCqLayout] = useState<"single" | "split">("single");
  const [questionsPerPage, setQuestionsPerPage] = useState<number>(10);
  const [optionLabelStyle, setOptionLabelStyle] = useState<"bangla" | "upper-alpha" | "lower-alpha" | "numeric">("bangla");
  const [questionNumberStyle, setQuestionNumberStyle] = useState<"numeric" | "bangla">("numeric");
  const [mcqSectionTitle, setMcqSectionTitle] = useState("ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন");
  const [cqSectionTitle, setCqSectionTitle] = useState("খ-বিভাগ: সৃজনশীল প্রশ্ন");
  const [instructions, setInstructions] = useState("");

  const [activeTab, setActiveTab] = useState<"details" | "layout" | "instructions">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");

  // Available subjects for the selected class
  const availableSubjects = useMemo(() => {
    const cls = hierarchy.find((c) => c.className === className);
    return cls ? cls.subjects : [];
  }, [hierarchy, className]);

  // Question counts & marks breakdown
  const mcqQuestions = useMemo(
    () => questions.filter((q) => (q.type || "mcq") === "mcq" && (!q.subQuestions || q.subQuestions.length === 0)),
    [questions]
  );
  const cqQuestions = useMemo(
    () => questions.filter((q) => q.type === "cq" || (q.subQuestions && q.subQuestions.length > 0)),
    [questions]
  );

  const calculatedTotalMarks = useMemo(() => {
    let sum = 0;
    questions.forEach((q) => {
      const isCq = q.type === "cq" || (q.subQuestions && q.subQuestions.length > 0);
      if (isCq && q.subQuestions && q.subQuestions.length > 0) {
        sum += q.subQuestions.reduce((s, sq) => s + (sq.marks || 0), 0);
      } else {
        sum += q.marks || (isCq ? 10 : 1);
      }
    });
    return sum;
  }, [questions]);

  // Suggested Duration calculation
  const suggestedDuration = useMemo(() => {
    const totalMinutes = mcqQuestions.length * 1 + cqQuestions.length * 20;
    if (totalMinutes <= 0) return "30 minutes";
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} minutes`;
    if (mins === 0) return `${hrs} hour${hrs > 1 ? "s" : ""}`;
    return `${hrs} hr ${mins} min`;
  }, [mcqQuestions.length, cqQuestions.length]);

  // Set default values on open
  useEffect(() => {
    if (open) {
      setError("");
      setIsRedirecting(false);
      setIsSubmitting(false);
      setClassName(derivedClass);
      setSubject(derivedSubject);
      setName(`${getBengaliClass(derivedClass)} ${getBengaliSubject(derivedSubject)} - মডেল টেস্ট`);
      setDuration(suggestedDuration);
      setCustomMarks(String(calculatedTotalMarks));

      // Default instructions
      if (cqQuestions.length === 0) {
        setInstructions(`সবগুলো প্রশ্নের উত্তর দিতে হবে। প্রতিটি প্রশ্নের মান সমান (${mcqQuestions.length}×১ = ${calculatedTotalMarks})।`);
      } else if (mcqQuestions.length === 0) {
        setInstructions(`উদ্দীপকগুলো মনোযোগ সহকারে পড়ে সবগুলো প্রশ্নের উত্তর দাও (${cqQuestions.length}টি সৃজনশীল প্রশ্ন, মোট ${calculatedTotalMarks} নম্বর)।`);
      } else {
        setInstructions(`ক-বিভাগ (বহু-নির্বাচনী): সকল প্রশ্নের উত্তর দাও (${mcqQuestions.length} নম্বর)। খ-বিভাগ (সৃজনশীল): নির্ধারিত প্রশ্নসমূহের উত্তর দাও (${calculatedTotalMarks - mcqQuestions.length} নম্বর)।`);
      }
    }
  }, [open, derivedClass, derivedSubject, suggestedDuration, calculatedTotalMarks, mcqQuestions.length, cqQuestions.length]);

  if (!open) return null;

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  const finalExamType = customExamType.trim() ? customExamType.trim() : examType;

  async function handleCreatePaper(e: React.FormEvent) {
    e.preventDefault();
    if (questions.length === 0) {
      setError("Please select at least 1 question to create a paper.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a name for the question paper.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        bankQuestionIds: questions.map((q) => q.id),
        name: name.trim(),
        className: className.trim() || derivedClass,
        subject: subject.trim() || derivedSubject,
        examType: finalExamType,
        duration: duration.trim() || suggestedDuration,
        totalMarks: Number(toStandardDigits(customMarks)) || calculatedTotalMarks,
        layout,
        cqLayout,
        questionsPerPage: Number(questionsPerPage),
        questionNumberStyle,
        optionLabelStyle,
        instructions: instructions.trim() || undefined,
        mcqSectionTitle: mcqQuestions.length > 0 ? mcqSectionTitle.trim() || undefined : undefined,
        cqSectionTitle: cqQuestions.length > 0 ? cqSectionTitle.trim() || undefined : undefined
      };

      const createdPaper = await apiRequest<Paper>("/api/question-bank/create-paper", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setIsRedirecting(true);
      if (onSuccess) onSuccess();

      // Navigate to the editor for the created paper
      const targetEditorType = cqQuestions.length > 0 && mcqQuestions.length === 0 ? "cq" : "mcq";
      router.push(`/dashboard/papers/${createdPaper.id}/questions/${targetEditorType}`);
      router.refresh();

      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
        setIsRedirecting(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question paper.");
      setIsSubmitting(false);
      setIsRedirecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl xl:max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 sm:py-4 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight text-foreground">
                  Create Question Paper
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-primary">
                  {questions.length} Selected
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                Configure exam settings and layout before generating your printable question paper
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isRedirecting}
            className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Overview Pills Card */}
        <div className="shrink-0 border-b bg-muted/30 px-3.5 sm:px-6 py-2.5 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border bg-card px-2.5 py-1 font-semibold text-foreground shadow-2xs">
                📝 {questions.length} Questions Total
              </span>
              <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 font-medium text-blue-700 dark:text-blue-300">
                {mcqQuestions.length} MCQs ({mcqQuestions.length} marks)
              </span>
              {cqQuestions.length > 0 && (
                <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-medium text-purple-700 dark:text-purple-300">
                  {cqQuestions.length} CQs ({calculatedTotalMarks - mcqQuestions.length} marks)
                </span>
              )}
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                🎯 {calculatedTotalMarks} Total Marks
              </span>
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Est. {suggestedDuration}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowQuestionList((v) => !v)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{showQuestionList ? "Hide Questions List" : `Review Questions (${questions.length})`}</span>
              {showQuestionList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Expandable Selected Questions Preview */}
          {showQuestionList && (
            <div className="mt-3 max-h-48 overflow-y-auto custom-scrollbar rounded-xl border bg-card p-2 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              {questions.map((q, idx) => {
                const isCq = q.type === "cq" || Boolean(q.subQuestions && q.subQuestions.length > 0);
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-muted-foreground shrink-0">{idx + 1}.</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase shrink-0 ${
                          isCq
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {isCq ? "CQ" : "MCQ"}
                      </span>
                      <div className="truncate text-foreground font-medium">
                        <MathRenderer text={q.title} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted-foreground">{q.marks || (isCq ? 10 : 1)} marks</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remove question from paper"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 flex items-center border-b px-3.5 sm:px-6 bg-card overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            <span>১. পরীক্ষার তথ্য (Exam Details)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("layout")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "layout"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns className="h-4 w-4" />
            <span>২. প্রিন্ট ও লেআউট (Layout & Style)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("instructions")}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "instructions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>৩. নির্দেশনা ও সেকশন (Instructions)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <form id="create-paper-from-selected-form" onSubmit={handleCreatePaper} className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Paper Title */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1">
                  <span>প্রশ্নপত্রের নাম (Paper Title) *</span>
                  <span className="text-[11px] text-muted-foreground">Appears at top of header</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. নবম শ্রেণি পদার্থবিজ্ঞান ১ম অধ্যায় মডেল টেস্ট"
                  className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Class & Subject */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    শ্রেণি / শিক্ষাস্তর *
                  </label>
                  {hierarchy.length > 0 ? (
                    <select
                      value={className}
                      onChange={(e) => {
                        setClassName(e.target.value);
                        const cls = hierarchy.find((c) => c.className === e.target.value);
                        if (cls && cls.subjects.length > 0) {
                          setSubject(cls.subjects[0].name);
                        }
                      }}
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                    >
                      {hierarchy.map((c) => (
                        <option key={c.className} value={c.className}>
                          {c.nameBn || getBengaliClass(c.className)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. SSC (Class 9-10)"
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    বিষয় *
                  </label>
                  {availableSubjects.length > 0 ? (
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                    >
                      {availableSubjects.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.nameBn || getBengaliSubject(s.name)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Physics"
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                    />
                  )}
                </div>
              </div>

              {/* Exam Type */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  পরীক্ষার ধরন (Exam Type)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {EXAM_TYPE_PRESETS.map((preset) => {
                    const isSelected = examType === preset.value && !customExamType;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setExamType(preset.value);
                          setCustomExamType("");
                        }}
                        className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold border-primary shadow-xs"
                            : "bg-background text-muted-foreground hover:bg-muted border-border"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customExamType}
                  onChange={(e) => setCustomExamType(e.target.value)}
                  placeholder="বা অন্য কোনো কাস্টম পরীক্ষার নাম লিখুন (e.g. ১ম টিউটোরিয়াল পরীক্ষা)..."
                  className="h-8 w-full rounded-md border bg-background px-3 text-xs"
                />
              </div>

              {/* Duration & Total Marks */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">সময়কাল (Exam Duration) *</label>
                    <span className="text-[10px] text-muted-foreground">Auto: {suggestedDuration}</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 45 minutes / ১ ঘণ্টা ৩০ মিনিট"
                    className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {["30 minutes", "45 minutes", "1 hour", "1 hour 30 min", "2 hours", "3 hours"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">মোট নম্বর (Total Marks) *</label>
                    <span className="text-[10px] text-muted-foreground">Sum of questions: {calculatedTotalMarks}</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={customMarks}
                    onChange={(e) => setCustomMarks(toStandardDigits(e.target.value))}
                    onBlur={() => {
                      if (!customMarks) {
                        setCustomMarks(String(calculatedTotalMarks));
                      }
                    }}
                    placeholder="e.g. 30"
                    className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT & STYLES */}
          {activeTab === "layout" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Paper Layout (Split vs Single) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    MCQ কলাম লেআউট (Layout)
                  </label>
                  <select
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as "single" | "split")}
                    className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                  >
                    <option value="split">দ্বি-কলাম (Split 2 Columns) — স্ট্যান্ডার্ড পরীক্ষার রূপ</option>
                    <option value="single">এক কলাম (Single Column Full Width)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    বাংলাদেশি স্ট্যান্ডার্ড বোর্ড ও স্কুল পরীক্ষার প্রশ্নে ২-কলাম স্প্লিট ব্যবহৃত হয়।
                  </p>
                </div>

                {cqQuestions.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      সৃজনশীল প্রশ্ন লেআউট (CQ Layout)
                    </label>
                    <select
                      value={cqLayout}
                      onChange={(e) => setCqLayout(e.target.value as "single" | "split")}
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                    >
                      <option value="single">এক কলাম (Full Width — সৃজনশীলের জন্য সেরা)</option>
                      <option value="split">দ্বি-কলাম (2 Columns)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      সৃজনশীলের উদ্দীপক ও ৪টি উপ-প্রশ্নের জন্য ফুল উইডথ লেআউট সুপারিশকৃত।
                    </p>
                  </div>
                )}
              </div>

              {/* Questions per page */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    প্রতি পৃষ্ঠায় প্রশ্নের সংখ্যা (Questions Per Page)
                  </label>
                  <select
                    value={questionsPerPage}
                    onChange={(e) => setQuestionsPerPage(Number(e.target.value))}
                    className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                  >
                    <option value="0">Auto Adjust (উচ্চতা অনুযায়ী স্বয়ংক্রিয় ফিট)</option>
                    <option value="5">৫ টি প্রশ্ন প্রতি পৃষ্ঠায়</option>
                    <option value="8">৮ টি প্রশ্ন প্রতি পৃষ্ঠায়</option>
                    <option value="10">১০ টি প্রশ্ন (সুপারিশকৃত NCTB স্ট্যান্ডার্ড)</option>
                    <option value="12">১২ টি প্রশ্ন প্রতি পৃষ্ঠায়</option>
                    <option value="15">১৫ টি প্রশ্ন প্রতি পৃষ্ঠায়</option>
                    <option value="20">২০ টি প্রশ্ন প্রতি পৃষ্ঠায়</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    প্রশ্ন ক্রমিক নম্বর স্টাইল (Question Numbering)
                  </label>
                  <select
                    value={questionNumberStyle}
                    onChange={(e) => setQuestionNumberStyle(e.target.value as "numeric" | "bangla")}
                    className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                  >
                    <option value="numeric">1, 2, 3... (ইংরেজি সংখ্যা)</option>
                    <option value="bangla">১, ২, ৩... (বাংলা সংখ্যা)</option>
                  </select>
                </div>
              </div>

              {/* MCQ Options Label Style */}
              {mcqQuestions.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    MCQ অপশন লেবেল স্টাইল (Option Labels)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "bangla", label: "(ক), (খ), (গ), (ঘ)", desc: "Bangla NCTB" },
                      { id: "upper-alpha", label: "(A), (B), (C), (D)", desc: "English Upper" },
                      { id: "lower-alpha", label: "(a), (b), (c), (d)", desc: "English Lower" },
                      { id: "numeric", label: "(1), (2), (3), (4)", desc: "Numeric" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOptionLabelStyle(opt.id as any)}
                        className={`rounded-lg border p-2.5 text-left transition-all ${
                          optionLabelStyle === opt.id
                            ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSTRUCTIONS & SECTIONS */}
          {activeTab === "instructions" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Section Headings */}
              {(mcqQuestions.length > 0 || cqQuestions.length > 0) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {mcqQuestions.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        MCQ সেকশন হেডিং (Section Heading)
                      </label>
                      <input
                        type="text"
                        value={mcqSectionTitle}
                        onChange={(e) => setMcqSectionTitle(e.target.value)}
                        placeholder="ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন"
                        className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                      />
                    </div>
                  )}

                  {cqQuestions.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        CQ সেকশন হেডিং (Section Heading)
                      </label>
                      <input
                        type="text"
                        value={cqSectionTitle}
                        onChange={(e) => setCqSectionTitle(e.target.value)}
                        placeholder="খ-বিভাগ: সৃজনশীল প্রশ্ন"
                        className="h-9 w-full rounded-md border bg-background px-3 text-xs font-medium"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* General Instructions Textarea */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  পরীক্ষার্থীদের সাধারণ নির্দেশনা (General Instructions)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  placeholder="পরীক্ষার্থীদের জন্য প্রয়োজনীয় নির্দেশনা লিখুন..."
                  className="w-full rounded-md border bg-background p-3 text-xs leading-relaxed focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 border-t bg-card px-3.5 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || isRedirecting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab !== "details" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(activeTab === "instructions" ? "layout" : "details")}
                disabled={isSubmitting || isRedirecting}
                className="h-9 text-xs"
              >
                Previous Step
              </Button>
            )}

            {activeTab !== "instructions" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(activeTab === "details" ? "layout" : "instructions")}
                disabled={isSubmitting || isRedirecting}
                className="h-9 text-xs"
              >
                Next Step &rarr;
              </Button>
            )}

            <Button
              type="submit"
              form="create-paper-from-selected-form"
              disabled={isSubmitting || isRedirecting || questions.length === 0}
              className="h-9 px-5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 gap-2"
            >
              {isSubmitting || isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>{isRedirecting ? "Opening Paper..." : "Creating Paper..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Question Paper ({questions.length})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
