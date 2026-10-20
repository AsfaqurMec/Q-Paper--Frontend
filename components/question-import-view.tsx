"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  FileCheck,
  FileCode,
  FilePlus2,
  FileQuestion,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MathRenderer } from "@/components/math-renderer";
import { latexToCleanMath } from "@/lib/math-utils";
import { apiRequest } from "@/lib/client-api";
import type { Paper, UserSession } from "@/lib/api-types";

type ImportType = "image" | "pdf" | "docx";

type ParsedQuestion = {
  id: string;
  number?: string | null;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  marks: number | null;
  options: string[];
  correct: number | null;
  type?: "mcq" | "cq" | string;
  subQuestions?: Array<{ id: string; label?: string; text: string; marks: number; answer?: string | null; explanation?: string | null }>;
  explanation?: string | null;
  warnings?: string[];
};

type ParseResponse = {
  questions: ParsedQuestion[];
  warnings: string[];
};

const IMPORT_CONFIG: Record<
  ImportType,
  { label: string; formats: string[]; accept: string; description: string; icon: typeof ImageIcon }
> = {
  image: {
    label: "Images & Scanned Papers",
    formats: ["JPG", "PNG", "WEBP"],
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    description: "Extract questions from scanned exam sheets and textbook photos via OCR + AI.",
    icon: ImageIcon
  },
  pdf: {
    label: "PDF Documents",
    formats: ["PDF"],
    accept: ".pdf,application/pdf",
    description: "Extract exam questions directly from official PDF files and board papers.",
    icon: FileText
  },
  docx: {
    label: "Microsoft Word (DOCX)",
    formats: ["DOCX"],
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Extract questions, formulas, and options from Word documents.",
    icon: FileCode
  }
};

export function QuestionImportView({
  user,
  existingPapers = []
}: {
  user: UserSession;
  existingPapers?: Paper[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUltra = user.plan === "ultra" || user.plan === "diamond" || user.role === "admin";

  // State
  const [importType, setImportType] = useState<ImportType>("pdf");
  const [destinationMode, setDestinationMode] = useState<"new" | "existing">("new");
  const [selectedPaperId, setSelectedPaperId] = useState<string>(existingPapers[0]?.id || "");

  // New paper form
  const [newPaperForm, setNewPaperForm] = useState({
    name: "",
    subject: "Physics",
    className: "SSC (Class 9-10)",
    examType: "Model Test",
    duration: "45 minutes"
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Configure & Upload, 2: Review & Edit, 3: Completed

  // If user is not Ultra/Diamond, show promotional gate
  if (!isUltra) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background p-4 sm:p-6 md:p-10 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Ultra &amp; Diamond Package Feature
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Import Questions with AI &amp; OCR
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl">
                Convert scanned test papers, textbook photos, PDFs, and Word documents into fully structured digital questions in seconds.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 shrink-0 w-full sm:w-auto">
              <div className="text-left md:text-right">
                <span className="text-2xl sm:text-3xl font-black text-foreground">৳1,000+</span>
                <span className="text-xs sm:text-sm text-muted-foreground"> / month</span>
              </div>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-amber-500/20"
              >
                <Link href="/dashboard/subscription">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 border-t border-border/60 pt-6 sm:pt-8">
            <div className="rounded-xl border bg-card/60 p-5 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">PDF &amp; Word Extraction</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Directly upload PDF question sheets or DOCX documents. Our parser automatically separates MCQ options and CQ stems.
              </p>
            </div>

            <div className="rounded-xl border bg-card/60 p-5 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 mb-3">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Scanned Paper OCR</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Snap photos of printed exam papers or textbook chapters. Smart OCR detects Bengali &amp; English text with high precision.
              </p>
            </div>

            <div className="rounded-xl border bg-card/60 p-5 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 mb-3">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">LaTeX Math &amp; Diagrams</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Mathematical equations, fractions, square roots, and diagram figures are preserved and formatted beautifully in KaTeX.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setError(null);
    const selected = Array.from(e.target.files);
    const allowed = IMPORT_CONFIG[importType].formats.map((f) => f.toLowerCase());

    const invalid = selected.find((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      return !allowed.includes(ext);
    });

    if (invalid) {
      setError(`${invalid.name} has an unsupported format. Please select ${allowed.join(", ").toUpperCase()} files.`);
      return;
    }

    setFiles(selected);
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  async function handleStartParsing() {
    if (!files.length) {
      setError("Please select at least one file to import.");
      return;
    }

    if (destinationMode === "new" && !newPaperForm.name.trim()) {
      setError("Please enter a name for the new question paper.");
      return;
    }

    if (destinationMode === "existing" && !selectedPaperId) {
      setError("Please select an existing question paper to import into.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(15);

      const convertedFiles = await Promise.all(
        files.map(async (file, idx) => {
          const dataUrl = await fileToDataUrl(file);
          setProgress(15 + Math.round(((idx + 1) / files.length) * 25));
          return { name: file.name, mimeType: file.type, dataUrl };
        })
      );

      setProgress(45);
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 500);

      let response: ParseResponse;
      try {
        response = await apiRequest<ParseResponse>("/api/question-import/parse", {
          method: "POST",
          body: JSON.stringify({
            importType,
            files: convertedFiles
          })
        });
      } finally {
        clearInterval(timer);
        setProgress(100);
      }

      if (!response.questions || response.questions.length === 0) {
        throw new Error(
          (response.warnings && response.warnings.filter(Boolean).join(" ")) ||
            "No questions could be extracted from the uploaded document. Please ensure questions are clearly legible."
        );
      }

      const cleanQuestions = response.questions.map((q, idx) => ({
        ...q,
        id: q.id || `imp_${idx + 1}`,
        title: latexToCleanMath(q.title || ""),
        subtitle: q.subtitle ? latexToCleanMath(q.subtitle) : "",
        options: (q.options || []).map((opt) => latexToCleanMath(opt)),
        explanation: q.explanation ? latexToCleanMath(q.explanation) : "",
        subQuestions: q.subQuestions?.map((sq) => ({
          ...sq,
          text: latexToCleanMath(sq.text || ""),
          answer: sq.answer ? latexToCleanMath(sq.answer) : "",
          explanation: sq.explanation ? latexToCleanMath(sq.explanation) : ""
        }))
      }));

      setParsedQuestions(cleanQuestions);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse questions.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleRemoveQuestion(idxToRemove: number) {
    setParsedQuestions((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  }

  function handleUpdateQuestion(idx: number, patch: Partial<ParsedQuestion>) {
    setParsedQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function handleOptionChange(qIdx: number, optIdx: number, val: string) {
    setParsedQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  }

  async function handleFinalizeImport() {
    if (!parsedQuestions.length) {
      setError("No questions left to import.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let targetPaperId = selectedPaperId;

      // 1. If creating a new paper, create it first
      if (destinationMode === "new") {
        const totalMarks = parsedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
        const created = await apiRequest<Paper>("/api/papers", {
          method: "POST",
          body: JSON.stringify({
            name: newPaperForm.name.trim(),
            subject: newPaperForm.subject,
            className: newPaperForm.className,
            examType: newPaperForm.examType,
            duration: newPaperForm.duration,
            totalMarks: totalMarks || 30,
            instructions: "Answer all questions. Each carries equal marks.",
            layout: "split",
            questionsPerPage: 10
          })
        });
        targetPaperId = created.id;
      }

      // 2. Format questions for paper storage
      const formattedQuestions = parsedQuestions.map((q, idx) => {
        const isCq = q.type === "cq" || Boolean(q.subQuestions && q.subQuestions.length > 0);
        const options = (q.options || []).map((opt, optIdx) => ({
          id: `opt_${idx}_${optIdx}`,
          label: String.fromCharCode(65 + optIdx),
          text: opt,
          isCorrect: q.correct === optIdx
        }));

        const subQuestions = isCq && q.subQuestions?.length
          ? q.subQuestions.map((sq, sqIdx) => ({
              id: sq.id || `sq_${idx}_${sqIdx}`,
              label: sq.label || String.fromCharCode(97 + sqIdx),
              text: sq.text,
              marks: Number(sq.marks) || 1,
              answer: sq.answer || undefined,
              explanation: sq.explanation || undefined
            }))
          : undefined;

        const marks = q.marks
          ? Number(q.marks)
          : subQuestions?.length
            ? subQuestions.reduce((sum, sq) => sum + sq.marks, 0)
            : 1;

        return {
          id: `q_${Date.now()}_${idx}`,
          number: `${idx + 1}`,
          title: q.title,
          subtitle: q.subtitle || undefined,
          imageUrl: q.imageUrl || undefined,
          marks,
          type: (isCq ? "cq" : "mcq") as "mcq" | "cq",
          options: isCq ? [] : options,
          subQuestions,
          explanation: q.explanation || undefined
        };
      });

      // 3. Save to paper
      // If adding to existing paper, merge with existing questions
      if (destinationMode === "existing") {
        const existing = await apiRequest<Paper>(`/api/papers/${targetPaperId}`);
        const merged = [...(existing.questions || []), ...formattedQuestions];
        await apiRequest(`/api/papers/${targetPaperId}/questions`, {
          method: "PUT",
          body: JSON.stringify({ questions: merged })
        });
      } else {
        await apiRequest(`/api/papers/${targetPaperId}/questions`, {
          method: "PUT",
          body: JSON.stringify({ questions: formattedQuestions })
        });
      }

      setStep(3);
      // Redirect to editor
      setTimeout(() => {
        router.push(`/dashboard/papers/${targetPaperId}/questions` as Route);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save questions to paper.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Import Questions</h1>
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Ultra
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automated AI &amp; OCR document ingestion for PDF, DOCX, and scanned image papers.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`flex items-center justify-center h-6 w-6 rounded-full font-bold ${
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </span>
          <span className="font-medium text-foreground">Upload</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span
            className={`flex items-center justify-center h-6 w-6 rounded-full font-bold ${
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </span>
          <span className="font-medium text-foreground">Review</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span
            className={`flex items-center justify-center h-6 w-6 rounded-full font-bold ${
              step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </span>
          <span className="font-medium text-foreground">Done</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Step 1: Upload & Configuration */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Destination & Options */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">1. Destination Paper</CardTitle>
                <CardDescription className="text-xs">
                  Where should the imported questions be saved?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestinationMode("new")}
                    className={`rounded-lg border p-2.5 text-left text-xs font-medium transition ${
                      destinationMode === "new"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Plus className="h-4 w-4 mb-1" />
                    New Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestinationMode("existing")}
                    disabled={existingPapers.length === 0}
                    className={`rounded-lg border p-2.5 text-left text-xs font-medium transition ${
                      destinationMode === "existing"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border hover:bg-muted disabled:opacity-50"
                    }`}
                  >
                    <FileCheck className="h-4 w-4 mb-1" />
                    Existing Paper
                  </button>
                </div>

                {destinationMode === "new" ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Paper Name *</label>
                      <input
                        type="text"
                        value={newPaperForm.name}
                        onChange={(e) => setNewPaperForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. SSC Physics Model Test 2026"
                        className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                      <input
                        type="text"
                        value={newPaperForm.subject}
                        onChange={(e) => setNewPaperForm((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="Physics"
                        className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Class</label>
                      <input
                        type="text"
                        value={newPaperForm.className}
                        onChange={(e) => setNewPaperForm((prev) => ({ ...prev, className: e.target.value }))}
                        placeholder="SSC (Class 9-10)"
                        className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-muted-foreground">Select Saved Paper</label>
                    <select
                      value={selectedPaperId}
                      onChange={(e) => setSelectedPaperId(e.target.value)}
                      className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {existingPapers.map((paper) => (
                        <option key={paper.id} value={paper.id}>
                          {paper.name} ({paper.questions.length} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Type Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">2. Source Document Type</CardTitle>
                <CardDescription className="text-xs">
                  Choose the format of your source questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Object.keys(IMPORT_CONFIG) as ImportType[]).map((typeKey) => {
                  const cfg = IMPORT_CONFIG[typeKey];
                  const Icon = cfg.icon;
                  const isSelected = importType === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => {
                        setImportType(typeKey);
                        setFiles([]);
                        setError(null);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-md ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{cfg.label}</p>
                          <p className="text-[10px] text-muted-foreground">{cfg.formats.join(", ")}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: File Dropzone & Parsing Action */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-base font-semibold">3. Upload &amp; Extract</CardTitle>
                <CardDescription className="text-xs">
                  {IMPORT_CONFIG[importType].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                {/* Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-h-[220px] rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition flex flex-col items-center justify-center p-4 sm:p-6 text-center cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={importType === "image"}
                    accept={IMPORT_CONFIG[importType].accept}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Click to browse or drag &amp; drop {IMPORT_CONFIG[importType].label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Supports {IMPORT_CONFIG[importType].formats.join(", ")} up to 15MB each.
                  </p>

                  {files.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {files.map((file, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium border shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-[180px]">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isProcessing && (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        AI &amp; OCR Engine Parsing Document...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    size="lg"
                    onClick={handleStartParsing}
                    disabled={isProcessing || files.length === 0}
                    className="w-full sm:w-auto gap-2 font-semibold shadow-md min-w-[180px]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Extract Questions
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Review & Edit Parsed Questions */}
      {step === 2 && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Successfully Extracted {parsedQuestions.length} Questions
              </h2>
              <p className="text-xs text-muted-foreground">
                Review the parsed questions below. You can edit text, toggle correct answers, or discard any unwanted questions before saving.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="flex-1 sm:flex-none">
                Back to Upload
              </Button>
              <Button
                size="sm"
                onClick={handleFinalizeImport}
                disabled={isSaving || parsedQuestions.length === 0}
                className="flex-1 sm:flex-none gap-2 font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save {parsedQuestions.length} Questions
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {parsedQuestions.map((q, qIdx) => {
              const isMcq = q.type !== "cq" && (!q.subQuestions || q.subQuestions.length === 0);
              return (
                <Card key={q.id || qIdx} className="overflow-hidden border border-border/80 shadow-xs">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {qIdx + 1}
                      </span>
                      <span className="uppercase text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {isMcq ? "MCQ" : "CQ (Creative)"}
                      </span>
                      {q.marks && (
                        <span className="text-[11px] text-muted-foreground">
                          {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Remove question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">
                        Question Stem / Title
                      </label>
                      <textarea
                        value={q.title}
                        onChange={(e) => handleUpdateQuestion(qIdx, { title: e.target.value })}
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                      />
                      <div className="mt-1 text-xs text-slate-700 bg-muted/20 p-2 rounded">
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase mr-1">Preview:</span>
                        <MathRenderer text={q.title} />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {isMcq && q.options && q.options.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[11px] font-semibold uppercase text-muted-foreground block">
                          Options (Click circle to set correct answer)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correct === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 rounded-md border p-2 transition ${
                                  isCorrect ? "border-teal-500 bg-teal-50/50" : "bg-card"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestion(qIdx, { correct: optIdx })}
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                    isCorrect
                                      ? "bg-teal-600 text-white"
                                      : "border bg-muted text-muted-foreground hover:bg-teal-100 hover:text-teal-800"
                                  }`}
                                  title={isCorrect ? "Correct answer" : "Mark as correct"}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                  className="w-full bg-transparent text-xs focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CQ Sub-questions */}
                    {!isMcq && q.subQuestions && q.subQuestions.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[11px] font-semibold uppercase text-muted-foreground block">
                          Creative Sub-questions
                        </label>
                        <div className="space-y-2">
                          {q.subQuestions.map((sq, sqIdx) => (
                            <div key={sq.id || sqIdx} className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-primary font-bold">
                                  Part {sq.label || String.fromCharCode(97 + sqIdx)} ({sq.marks} marks)
                                </span>
                              </div>
                              <p className="text-foreground">{sq.text}</p>
                              {sq.answer && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-semibold text-teal-700">Answer:</span> {sq.answer}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Success Completed */}
      {step === 3 && (
        <Card className="p-8 text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Import Completed Successfully!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {parsedQuestions.length} questions have been imported. Redirecting to your Question Paper editor...
          </p>
          <div className="flex justify-center pt-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </Card>
      )}
    </div>
  );
}
