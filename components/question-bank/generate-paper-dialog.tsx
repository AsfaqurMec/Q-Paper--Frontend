"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";
import { extractChapterNumber } from "@/lib/utils";
import type { ClassHierarchy, Paper, UserSession } from "@/lib/api-types";

type GeneratePaperDialogProps = {
  open: boolean;
  user: UserSession;
  onClose: () => void;
  preselectedClass?: string;
  preselectedSubject?: string;
  preselectedChapter?: string;
  preselectedType?: string;
};

const GENERATION_STEPS = [
  {
    titleBn: "সিলেবাস ও অধ্যায় ম্যাপিং",
    titleEn: "Validating Syllabus & Hierarchy",
    desc: "নির্বাচিত বিষয় ও অধ্যায়ের মান বণ্টন বিন্যাস করা হচ্ছে..."
  },
  {
    titleBn: "জাতীয় প্রশ্নব্যাংক থেকে প্রশ্ন নির্বাচন",
    titleEn: "Querying Question Bank Database",
    desc: "বোর্ড ও শীর্ষ প্রতিষ্ঠানের প্রশ্নসমূহ ফিল্টার করা হচ্ছে..."
  },
  {
    titleBn: "তত্ত্বীয় ও গাণিতিক অনুপাত সমন্বয়",
    titleEn: "Balancing Theory vs Math Distribution",
    desc: "নির্ধারিত অনুপাত অনুসারে সুনির্দিষ্ট প্রশ্ন বাছাই করা হচ্ছে..."
  },
  {
    titleBn: "প্রশ্নপত্র লেআউট ও চূড়ান্ত সংকলন",
    titleEn: "Formatting Layout & Preparing Paper",
    desc: "সেকশন হেডিং ও প্রিন্ট লেআউট প্রস্তুত করে এডিটরে যুক্ত করা হচ্ছে..."
  }
];

export function GeneratePaperDialog({
  open,
  user,
  onClose,
  preselectedClass,
  preselectedSubject,
  preselectedChapter,
  preselectedType
}: GeneratePaperDialogProps) {
  const router = useRouter();
  const isPro = user.plan === "pro" || user.role === "admin";

  const [hierarchy, setHierarchy] = useState<ClassHierarchy[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  const [className, setClassName] = useState(preselectedClass || "নবম-দশম শ্রেণি (SSC)");
  const [subject, setSubject] = useState(preselectedSubject || "পদার্থবিজ্ঞান");
  const [chapter, setChapter] = useState(preselectedChapter || "all");
  const [paperType, setPaperType] = useState<"both" | "mcq" | "cq">(
    preselectedType === "mcq" ? "mcq" : preselectedType === "cq" ? "cq" : "both"
  );
  const [mcqCount, setMcqCount] = useState(25);
  const [mcqTheoryCount, setMcqTheoryCount] = useState(15);
  const [mcqMathCount, setMcqMathCount] = useState(10);

  const [cqCount, setCqCount] = useState(4);
  const [cqTheoryCount, setCqTheoryCount] = useState(2);
  const [cqMathCount, setCqMathCount] = useState(2);

  const [boardOnly, setBoardOnly] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [examType, setExamType] = useState("Model Test");
  const [layout, setLayout] = useState<"single" | "split">("split");
  const [questionsPerPage, setQuestionsPerPage] = useState<number>(10);
  const [customTitle, setCustomTitle] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mcqSectionTitle, setMcqSectionTitle] = useState("");
  const [cqSectionTitle, setCqSectionTitle] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");

  function handleMcqTotalChange(val: number) {
    const total = Math.max(1, Math.min(100, val));
    setMcqCount(total);
    const theory = Math.round(total * 0.6);
    const math = total - theory;
    setMcqTheoryCount(theory);
    setMcqMathCount(math);
  }

  function handleMcqTheoryChange(val: number) {
    const theory = Math.max(0, Math.min(mcqCount, val));
    setMcqTheoryCount(theory);
    setMcqMathCount(mcqCount - theory);
  }

  function handleMcqMathChange(val: number) {
    const math = Math.max(0, Math.min(mcqCount, val));
    setMcqMathCount(math);
    setMcqTheoryCount(mcqCount - math);
  }

  function handleCqTotalChange(val: number) {
    const total = Math.max(1, Math.min(30, val));
    setCqCount(total);
    const theory = Math.round(total / 2);
    const math = total - theory;
    setCqTheoryCount(theory);
    setCqMathCount(math);
  }

  function handleCqTheoryChange(val: number) {
    const theory = Math.max(0, Math.min(cqCount, val));
    setCqTheoryCount(theory);
    setCqMathCount(cqCount - theory);
  }

  function handleCqMathChange(val: number) {
    const math = Math.max(0, Math.min(cqCount, val));
    setCqMathCount(math);
    setCqTheoryCount(cqCount - math);
  }

  // Step ticker while generating
  useEffect(() => {
    if (!isGenerating) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Sync preselected fields whenever the dialog is opened
  useEffect(() => {
    if (!open) return;
    if (preselectedClass && preselectedClass !== "all") {
      setClassName(preselectedClass);
    }
    if (preselectedSubject && preselectedSubject !== "all") {
      setSubject(preselectedSubject);
    }
    if (preselectedChapter && preselectedChapter !== "all") {
      setChapter(preselectedChapter);
    }
    if (preselectedType && preselectedType !== "all") {
      if (preselectedType === "mcq" || preselectedType === "cq") {
        setPaperType(preselectedType);
      } else {
        setPaperType("both");
      }
    }
  }, [open, preselectedClass, preselectedSubject, preselectedChapter, preselectedType]);

  // Load hierarchy on open
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoadingHierarchy(true);
    apiRequest<ClassHierarchy[]>("/api/question-bank/hierarchy")
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setHierarchy(data);
          if (!preselectedClass && data[0]) {
            setClassName(data[0].className);
            if (data[0].subjects[0]) {
              setSubject(data[0].subjects[0].name);
            }
          }
        }
      })
      .catch(() => {
        // Fallback or ignore
      })
      .finally(() => {
        if (isMounted) setLoadingHierarchy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, preselectedClass]);

  // Current available subjects based on selected class
  const availableSubjects = useMemo(() => {
    const cls = hierarchy.find((c) => c.className === className);
    return cls ? cls.subjects : [];
  }, [hierarchy, className]);

  // Current available chapters based on selected subject (sorted naturally)
  const availableChapters = useMemo(() => {
    const subj = availableSubjects.find((s) => s.name === subject);
    if (!subj) return [];
    return [...subj.chapters].sort((a, b) => {
      const numA = extractChapterNumber(a.name);
      const numB = extractChapterNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [availableSubjects, subject]);

  // When class changes, adjust subject
  function handleClassChange(newClass: string) {
    setClassName(newClass);
    const cls = hierarchy.find((c) => c.className === newClass);
    if (cls && cls.subjects.length > 0) {
      setSubject(cls.subjects[0].name);
      setChapter("all");
    }
  }

  // When subject changes, reset chapter
  function handleSubjectChange(newSubj: string) {
    setSubject(newSubj);
    setChapter("all");
  }

  // Auto-calculated title
  const computedTitle = useMemo(() => {
    if (customTitle.trim()) return customTitle;
    const scope = chapter === "all" ? "Full Subject" : chapter.replace(/^Chapter\s+\d+:\s*/i, "");
    return `${className} ${subject} - ${scope} ${examType}`;
  }, [customTitle, className, subject, chapter, examType]);

  // Auto-calculated duration
  const computedDuration = useMemo(() => {
    if (customDuration.trim()) return customDuration;
    let totalMinutes = 0;
    if (paperType === "mcq" || paperType === "both") totalMinutes += mcqCount * 1;
    if (paperType === "cq" || paperType === "both") totalMinutes += cqCount * 20;

    if (totalMinutes <= 0) return "30 minutes";
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} minutes`;
    if (mins === 0) return `${hrs} hour${hrs > 1 ? "s" : ""}`;
    return `${hrs} hr ${mins} min`;
  }, [customDuration, paperType, mcqCount, cqCount]);

  // Total marks calculation
  const totalCalculatedMarks = useMemo(() => {
    let marks = 0;
    if (paperType === "mcq" || paperType === "both") marks += mcqCount * 1;
    if (paperType === "cq" || paperType === "both") marks += cqCount * 10;
    return marks;
  }, [paperType, mcqCount, cqCount]);

  // Total questions count
  const totalQuestionsCount = useMemo(() => {
    let count = 0;
    if (paperType === "mcq" || paperType === "both") count += mcqCount;
    if (paperType === "cq" || paperType === "both") count += cqCount;
    return count;
  }, [paperType, mcqCount, cqCount]);

  if (!open) return null;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    setError("");

    const finalMcqCount = paperType === "cq" ? 0 : Number(mcqCount);
    const finalCqCount = paperType === "mcq" ? 0 : Number(cqCount);

    if (paperType === "mcq" && finalMcqCount <= 0) {
      setError("Please specify at least 1 MCQ.");
      return;
    }
    if (paperType === "cq" && finalCqCount <= 0) {
      setError("Please specify at least 1 Creative Question (CQ).");
      return;
    }
    if (paperType === "both" && finalMcqCount <= 0 && finalCqCount <= 0) {
      setError("Please specify at least 1 MCQ or CQ.");
      return;
    }

    try {
      setIsGenerating(true);
      const selectedCls = hierarchy.find((c) => c.className === className);
      const selectedSubj = selectedCls?.subjects.find((s) => s.name === subject);
      const selectedChap = chapter !== "all" ? selectedSubj?.chapters.find((ch) => ch.name === chapter) : undefined;

      const payload = {
        name: computedTitle,
        classId: selectedCls?.id,
        subjectId: selectedSubj?.id,
        chapterId: selectedChap?.id,
        className,
        subject,
        chapter: chapter === "all" ? undefined : chapter,
        type: paperType,
        mcqCount: finalMcqCount,
        mcqTheoryCount: paperType === "cq" ? 0 : mcqTheoryCount,
        mcqMathCount: paperType === "cq" ? 0 : mcqMathCount,
        cqCount: finalCqCount,
        cqTheoryCount: paperType === "mcq" ? 0 : cqTheoryCount,
        cqMathCount: paperType === "mcq" ? 0 : cqMathCount,
        difficulty,
        examType,
        duration: computedDuration,
        layout,
        questionsPerPage: Number(questionsPerPage),
        instructions: instructions.trim() || undefined,
        mcqSectionTitle: mcqSectionTitle.trim() || undefined,
        cqSectionTitle: cqSectionTitle.trim() || undefined,
        board: selectedBoard !== "all" ? selectedBoard : undefined,
        year: selectedYear !== "all" ? selectedYear : undefined,
        boardOnly: boardOnly || selectedBoard !== "all" ? true : undefined
      };

      const result = await apiRequest<Paper>("/api/question-bank/generate-paper", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Show redirecting state smoothly before navigation
      setIsRedirecting(true);
      const targetEditorType = paperType === "cq" ? "cq" : "mcq";
      router.push(`/dashboard/papers/${result.id}/questions/${targetEditorType}`);
      router.refresh();

      // Close modal gracefully after redirect initiates
      setTimeout(() => {
        onClose();
        setIsGenerating(false);
        setIsRedirecting(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate exam paper.");
      setIsGenerating(false);
      setIsRedirecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 sm:p-4 md:p-6 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl xl:max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b px-3.5 sm:px-6 py-3 sm:py-4 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold tracking-tight text-foreground">Smart Question Paper Generator</h2>
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Crown className="h-3 w-3" /> Pro
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
                Generate a curriculum-aligned exam paper for full subjects or specific chapters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating || isRedirecting}
            className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Not Pro View */}
        {!isPro ? (
          <div className="p-8 space-y-5 text-center flex-1 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 shadow-inner">
              <Crown className="h-8 w-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-foreground">Pro Plan Feature</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The Smart Question Paper Generator automatically pulls randomized MCQs and Creative Questions (CQs) from the national syllabus, formats your paper, and calculates total marks and exam duration in 1 click.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:from-amber-600 hover:to-amber-700">
                <Link href="/dashboard/subscription">
                  <Sparkles className="h-4 w-4 mr-1.5" /> Upgrade to Pro
                </Link>
              </Button>
            </div>
          </div>
        ) : isGenerating || isRedirecting ? (
          /* Loading Screen While Paper is Being Generated */
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Animated glowing centerpiece */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/40">
                <Wand2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-primary shadow">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
            </div>

            {/* Title & Status */}
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {isRedirecting ? "প্রশ্নপত্র তৈরি সম্পন্ন হয়েছে!" : "প্রশ্নপত্র তৈরি করা হচ্ছে..."}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isRedirecting
                  ? "প্রশ্নপত্র সফলভাবে সংরক্ষিত হয়েছে। অবিলম্বে প্রশ্ন এডিটরে নিয়ে যাওয়া হচ্ছে..."
                  : "জাতীয় শিক্ষাক্রমের ডাটাবেজ থেকে প্রশ্ন নির্বাচন ও বিন্যাস করা হচ্ছে..."}
              </p>
            </div>

            {/* Real-time Paper Target Card */}
            <div className="w-full max-w-lg rounded-xl border bg-muted/30 p-4 text-left space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b pb-2 text-xs">
                <span className="font-semibold text-foreground truncate max-w-[260px] sm:max-w-[320px]">
                  {computedTitle}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary font-mono shrink-0">
                  {totalCalculatedMarks} Marks
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">বিষয়:</span> {className} • {subject}
                </div>
                <div>
                  <span className="font-medium text-foreground">সময়:</span> {computedDuration}
                </div>
                <div>
                  <span className="font-medium text-foreground">অধ্যায়:</span>{" "}
                  {chapter === "all" ? "সকল অধ্যায় (Full Subject)" : chapter}
                </div>
                <div>
                  <span className="font-medium text-foreground">প্রশ্ন:</span>{" "}
                  {paperType !== "cq" ? `${mcqCount}টি MCQ` : ""}
                  {paperType === "both" ? " + " : ""}
                  {paperType !== "mcq" ? `${cqCount}টি CQ` : ""}
                </div>
              </div>
            </div>

            {/* Animated Step-by-Step Generation Tracker */}
            <div className="w-full max-w-lg space-y-2 text-left">
              <div className="space-y-2">
                {GENERATION_STEPS.map((st, idx) => {
                  const isDone = loadingStep > idx || isRedirecting;
                  const isCurrent = loadingStep === idx && !isRedirecting;

                  return (
                    <div
                      key={st.titleEn}
                      className={`flex items-start gap-3 rounded-lg border p-2.5 transition-all duration-300 ${
                        isCurrent
                          ? "border-primary bg-primary/5 shadow-xs"
                          : isDone
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border/40 bg-muted/10 opacity-50"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[10px] text-muted-foreground font-semibold">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-xs font-semibold ${
                              isCurrent ? "text-primary" : isDone ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                            }`}
                          >
                            {st.titleBn} <span className="text-[10px] font-normal opacity-75">({st.titleEn})</span>
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-medium text-primary animate-pulse">প্রসেসিং...</span>
                          )}
                          {isDone && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">সম্পন্ন</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{st.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shimmering Progress Bar */}
              <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-500 rounded-full"
                  style={{
                    width: isRedirecting ? "100%" : `${Math.min(95, (loadingStep + 1) * 25)}%`
                  }}
                />
              </div>

              <p className="text-center text-[11px] text-muted-foreground pt-1">
                দয়া করে কিছুক্ষণ অপেক্ষা করুন, প্রক্রিয়া চলাকালীন উইন্ডো বন্ধ করবেন না...
              </p>
            </div>
          </div>
        ) : (
          /* Main Generator Form */
          <form onSubmit={handleGenerate} className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 space-y-4 sm:space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Section 1: Syllabus Scope & Target */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Layers className="h-3.5 w-3.5" />
                    </div>
                    <span>১. পাঠ্যক্রম ও অধ্যায় নির্বাচন (Syllabus Scope & Target)</span>
                  </div>
                  {loadingHierarchy && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> লোড হচ্ছে...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Class */}
                  <div>
                    <label className="text-xs font-medium text-foreground">শ্রেণি / বিভাগ (Class / Level)</label>
                    <select
                      value={className}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      {hierarchy.length > 0 ? (
                        hierarchy.map((cls) => (
                          <option key={cls.className} value={cls.className}>
                            {cls.className} ({cls.totalCount} Qs)
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="SSC (Class 9-10)">SSC (Class 9-10)</option>
                          <option value="HSC (Class 11-12)">HSC (Class 11-12)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-medium text-foreground">বিষয় (Subject)</label>
                    <select
                      value={subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      {availableSubjects.length > 0 ? (
                        availableSubjects.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} ({s.totalCount} Qs)
                          </option>
                        ))
                      ) : (
                        <option value={subject}>{subject}</option>
                      )}
                    </select>
                  </div>

                  {/* Chapter */}
                  <div>
                    <label className="text-xs font-medium text-foreground">অধ্যায় ব্যাপ্তি (Chapter Coverage)</label>
                    <select
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="all">🌟 সকল অধ্যায় (Full Subject Test)</option>
                      {availableChapters.map((ch) => (
                        <option key={ch.name} value={ch.name}>
                          {ch.name} ({ch.mcqCount} MCQ, {ch.cqCount} CQ)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Board Questions Only Switch */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <label htmlFor="board-only-toggle" className="cursor-pointer flex items-center gap-2.5 select-none">
                    <input
                      id="board-only-toggle"
                      type="checkbox"
                      checked={boardOnly}
                      onChange={(e) => setBoardOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <div>
                      <span className="font-semibold text-foreground">📌 শুধু বোর্ড প্রশ্ন ব্যবহার করুন (Board Questions Only)</span>
                      <p className="text-[11px] text-muted-foreground">বিভিন্ন শিক্ষা বোর্ডের বিগত বছরের পরীক্ষার প্রশ্ন থেকে বাছাই করবে</p>
                    </div>
                  </label>
                  {boardOnly && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      বোর্ড প্রশ্ন সক্রিয়
                    </span>
                  )}
                </div>
              </div>

              {/* Section 2: Question Type & Quantities */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <span>২. প্রশ্নের ধরন ও সংখ্যা নির্ধারণ (Question Types & Amounts)</span>
                  </div>
                  {/* Live total badge */}
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted border px-2.5 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                      মোট প্রশ্ন: {totalQuestionsCount}টি
                    </span>
                    <span className="rounded-full bg-primary/15 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary font-mono shadow-2xs">
                      মোট নম্বর: {totalCalculatedMarks}
                    </span>
                  </div>
                </div>

                {/* Segmented Type Selector */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaperType("both")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all shadow-2xs ${
                      paperType === "both"
                        ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <Layers className="h-4 w-4" /> Both (MCQ + CQ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperType("mcq")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all shadow-2xs ${
                      paperType === "mcq"
                        ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <Check className="h-4 w-4" /> Only MCQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperType("cq")}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all shadow-2xs ${
                      paperType === "cq"
                        ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" /> Only CQ (Creative)
                  </button>
                </div>

                {/* Dynamic Counts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* MCQ Count Card */}
                  {(paperType === "mcq" || paperType === "both") && (
                    <div className="space-y-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-foreground">বহুনির্বাচনী প্রশ্ন (MCQ Count)</label>
                          <p className="text-[11px] text-muted-foreground">প্রতিটি প্রশ্নের মান ১</p>
                        </div>
                        <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                          {mcqCount} × ১ = {mcqCount} নম্বর
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={mcqCount}
                          onChange={(e) => handleMcqTotalChange(parseInt(e.target.value, 10) || 1)}
                          className="h-9 w-20 rounded-lg border bg-background px-2 text-center text-xs font-bold font-mono focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {[10, 20, 25, 30, 50].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleMcqTotalChange(val)}
                              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                                mcqCount === val
                                  ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* MCQ Distribution: Theory vs Math */}
                      <div className="mt-2 pt-2.5 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground">মান বণ্টন (Distribution):</span>
                          <span className="text-[11px] text-muted-foreground font-mono font-medium">
                            {mcqTheoryCount} তত্ত্বীয় + {mcqMathCount} গাণিতিক = {mcqCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">📖 তত্ত্বীয়:</span>
                            <input
                              type="number"
                              min="0"
                              max={mcqCount}
                              value={mcqTheoryCount}
                              onChange={(e) => handleMcqTheoryChange(parseInt(e.target.value, 10) || 0)}
                              className="h-7 w-16 rounded-md border bg-background text-center text-xs font-bold font-mono focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">🔢 গাণিতিক:</span>
                            <input
                              type="number"
                              min="0"
                              max={mcqCount}
                              value={mcqMathCount}
                              onChange={(e) => handleMcqMathChange(parseInt(e.target.value, 10) || 0)}
                              className="h-7 w-16 rounded-md border bg-background text-center text-xs font-bold font-mono focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CQ Count Card */}
                  {(paperType === "cq" || paperType === "both") && (
                    <div className="space-y-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-foreground">সৃজনশীল প্রশ্ন (CQ Count)</label>
                          <p className="text-[11px] text-muted-foreground">প্রতিটি প্রশ্নের মান ১০</p>
                        </div>
                        <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                          {cqCount} × ১০ = {cqCount * 10} নম্বর
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={cqCount}
                          onChange={(e) => handleCqTotalChange(parseInt(e.target.value, 10) || 1)}
                          className="h-9 w-20 rounded-lg border bg-background px-2 text-center text-xs font-bold font-mono focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {[2, 4, 5, 8, 10].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleCqTotalChange(val)}
                              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                                cqCount === val
                                  ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CQ Distribution: Theory vs Math */}
                      <div className="mt-2 pt-2.5 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground">মান বণ্টন (Distribution):</span>
                          <span className="text-[11px] text-muted-foreground font-mono font-medium">
                            {cqTheoryCount} তত্ত্বীয় + {cqMathCount} গাণিতিক = {cqCount}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">📖 তত্ত্বীয়:</span>
                            <input
                              type="number"
                              min="0"
                              max={cqCount}
                              value={cqTheoryCount}
                              onChange={(e) => handleCqTheoryChange(parseInt(e.target.value, 10) || 0)}
                              className="h-7 w-16 rounded-md border bg-background text-center text-xs font-bold font-mono focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">🔢 গাণিতিক:</span>
                            <input
                              type="number"
                              min="0"
                              max={cqCount}
                              value={cqMathCount}
                              onChange={(e) => handleCqMathChange(parseInt(e.target.value, 10) || 0)}
                              className="h-7 w-16 rounded-md border bg-background text-center text-xs font-bold font-mono focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Paper Details & Exam Customization */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </div>
                  <span>৩. পরীক্ষার বিবরণ ও কাস্টমাইজেশন (Paper Details & Customization)</span>
                </div>

                {/* Title & Exam Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-medium text-foreground">প্রশ্নপত্রের শিরোনাম (Paper Title)</label>
                    <input
                      type="text"
                      placeholder={computedTitle}
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground">পরীক্ষার ধরন (Exam Type)</label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="Model Test">Model Test (মডেল টেস্ট)</option>
                      <option value="Class Test">Class Test (শ্রেণি পরীক্ষা)</option>
                      <option value="Pre-Test Examination">Pre-Test Examination (প্রাক-নির্বাচনী)</option>
                      <option value="Term Final Exam">Term Final Exam (সাময়িক পরীক্ষা)</option>
                      <option value="Board Final Practice">Board Final Practice (বোর্ড ফাইনাল প্রস্তুতি)</option>
                      <option value="Quick Quiz">Quick Quiz (কুইজ)</option>
                    </select>
                  </div>
                </div>

                {/* Board and Year Selection Box */}
                <div className="rounded-xl border border-amber-300/50 bg-amber-500/5 p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      🏛️ বোর্ড ও পরীক্ষার সাল ফিল্টার (Board & Year Filter)
                    </span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={boardOnly}
                        onChange={(e) => setBoardOnly(e.target.checked)}
                        className="rounded border-border accent-primary h-3.5 w-3.5"
                      />
                      <span className="font-medium text-foreground">বোর্ড প্রশ্ন ফিল্টার সক্রিয় রাখুন</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">নির্দিষ্ট বোর্ড (Specific Board)</label>
                      <select
                        value={selectedBoard}
                        onChange={(e) => {
                          setSelectedBoard(e.target.value);
                          if (e.target.value !== "all") setBoardOnly(true);
                        }}
                        className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">সকল বোর্ড (All Boards)</option>
                        {[
                          "ঢাকা বোর্ড", "রাজশাহী বোর্ড", "চট্টগ্রাম বোর্ড", "কুমিল্লা বোর্ড",
                          "যশোর বোর্ড", "বরিশাল বোর্ড", "সিলেট বোর্ড", "দিনাজপুর বোর্ড",
                          "ময়মনসিংহ বোর্ড", "মাদ্রাসা বোর্ড", "কারিগরি বোর্ড"
                        ].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">পরীক্ষার সাল (Exam Year)</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          if (e.target.value !== "all") setBoardOnly(true);
                        }}
                        className="mt-1 h-9 w-full rounded-lg border bg-background px-2.5 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">সকল সাল (All Years)</option>
                        {["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4 Settings Column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {/* Duration */}
                  <div>
                    <label className="text-xs font-medium text-foreground">সময়কাল (Duration)</label>
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        placeholder={computedDuration}
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="h-10 w-full rounded-lg border bg-background pl-8 pr-3 text-xs shadow-2xs focus:ring-2 focus:ring-primary/20"
                      />
                      <Clock className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="text-xs font-medium text-foreground">কঠিনতার মাত্রা (Difficulty)</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all">Balanced (ভারসাম্যপূর্ণ)</option>
                      <option value="easy">Easy Only (সহজ)</option>
                      <option value="medium">Medium Only (মাঝারি)</option>
                      <option value="hard">Hard Only (কঠিন)</option>
                    </select>
                  </div>

                  {/* Layout */}
                  <div>
                    <label className="text-xs font-medium text-foreground">প্রিন্ট লেআউট (Layout)</label>
                    <select
                      value={layout}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="split">2 Columns (Standard ২-কলাম)</option>
                      <option value="single">1 Column (Full Width ১-কলাম)</option>
                    </select>
                  </div>

                  {/* Questions Per Page */}
                  <div>
                    <label className="text-xs font-medium text-foreground">প্রতি পৃষ্ঠায় প্রশ্ন (Per Page)</label>
                    <select
                      value={questionsPerPage}
                      onChange={(e) => setQuestionsPerPage(Number(e.target.value))}
                      className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-xs font-medium shadow-2xs focus:ring-2 focus:ring-primary/20"
                    >
                      <option value={0}>Auto (পৃষ্ঠা অনুযায়ী ফিট)</option>
                      <option value={5}>৫টি প্রশ্ন</option>
                      <option value={8}>৮টি প্রশ্ন</option>
                      <option value={10}>১০টি প্রশ্ন (Standard)</option>
                      <option value={12}>১২টি প্রশ্ন</option>
                      <option value={15}>১৫টি প্রশ্ন</option>
                      <option value={20}>২০টি প্রশ্ন</option>
                    </select>
                  </div>
                </div>

                {/* Section Headings Customization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {(paperType === "mcq" || paperType === "both") && (
                    <div>
                      <label className="text-xs font-medium text-foreground">MCQ বিভাগ শিরোনাম (Section Heading)</label>
                      <input
                        type="text"
                        placeholder="Default: ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন"
                        value={mcqSectionTitle}
                        onChange={(e) => setMcqSectionTitle(e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs shadow-2xs focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                  {(paperType === "cq" || paperType === "both") && (
                    <div>
                      <label className="text-xs font-medium text-foreground">CQ বিভাগ শিরোনাম (Section Heading)</label>
                      <input
                        type="text"
                        placeholder="Default: খ-বিভাগ: সৃজনশীল প্রশ্ন"
                        value={cqSectionTitle}
                        onChange={(e) => setCqSectionTitle(e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-lg border bg-background px-3 text-xs shadow-2xs focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}
                </div>

                {/* General Exam Instructions */}
                <div>
                  <label className="text-xs font-medium text-foreground">পরীক্ষার সাধারণ নির্দেশনা (General Instructions)</label>
                  <textarea
                    rows={2}
                    placeholder="যেমন: সকল প্রশ্নের মান সমান। প্রশ্নপত্রের কোনো স্থানে দাগ দেয়া যাবে না।"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border bg-background p-2.5 text-xs shadow-2xs focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Fixed Footer */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/40 backdrop-blur-sm px-3.5 sm:px-6 py-3 sm:py-4">
              {/* Paper Summary Pill Strip */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  সারসংক্ষেপ:
                </span>
                <span className="rounded-md bg-background border px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {className} • {subject}
                </span>
                <span className="rounded-md bg-background border px-2 py-0.5 text-[11px] font-medium text-foreground">
                  {totalQuestionsCount}টি প্রশ্ন ({totalCalculatedMarks} নম্বর)
                </span>
                <span className="rounded-md bg-background border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  ⏱️ {computedDuration}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 font-semibold"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Generate &amp; Open Paper
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
