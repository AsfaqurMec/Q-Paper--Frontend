"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Globe,
  GripVertical,
  Image,
  ImagePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MathTextField } from "@/components/math-text-field";
import { MathRenderer } from "@/components/math-renderer";
import { ImportImageModal } from "@/components/import-image-modal";
import { latexToCleanMath } from "@/lib/math-utils";
import { apiRequest } from "@/lib/client-api";
import { cn, toStandardDigits } from "@/lib/utils";
import { sanitizeSvg } from "@/lib/sanitize";
import type { Paper, UserSession } from "@/lib/api-types";

type CreationMethod = "manual" | "automatic" | "bank";
type ManualType = "mcq" | "cq";
type ImportType = "image" | "pdf" | "docx";
type ImportQuestion = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  marks: number | null;
  options: string[];
  correct: number | null;
  warnings: string[];
  type?: string;
  number?: string | null;
  images?: string[];
  tables?: Array<{ caption: string | null; headers: string[]; rows: string[][] }>;
  subQuestions?: Array<{ id: string; label?: string; text: string; marks: number; answer?: string | null; explanation?: string | null }>;
  explanation?: string | null;
};

const importConfig = {
  image: {
    label: "Image",
    formats: ["JPG", "JPEG", "PNG", "WEBP"],
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    description: "Extract questions from one or multiple images using OCR + AI."
  },
  pdf: {
    label: "PDF",
    formats: ["PDF"],
    accept: ".pdf,application/pdf",
    description: "Extract text directly when available, or run OCR for scanned files."
  },
  docx: {
    label: "DOCX",
    formats: ["DOCX"],
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    description: "Extract questions from Microsoft Word documents."
  }
} satisfies Record<ImportType, { label: string; formats: string[]; accept: string; description: string }>;

const maxFileSizeMb = 15;

type ParseResponse = {
  questions: ImportQuestion[];
  warnings: string[];
};

export function QuestionCreationWizard({
  paper,
  initialMethod,
  initialImportType,
  userPlan = "free"
}: {
  paper: Paper;
  initialMethod?: CreationMethod;
  initialImportType?: ImportType;
  userPlan?: UserSession["plan"];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasImportAccess = userPlan === "ultra" || userPlan === "diamond";
  const [method, setMethod] = useState<CreationMethod | null>(
    initialMethod === "automatic" && !hasImportAccess ? null : (initialMethod ?? null)
  );
  const [manualType, setManualType] = useState<ManualType | null>(null);
  const [importType, setImportType] = useState<ImportType | null>(initialImportType ?? null);
  const [step, setStep] = useState(initialMethod === "automatic" && initialImportType && hasImportAccess ? 3 : 1);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState(
    initialMethod === "automatic" && !hasImportAccess
      ? "Question Import is only available in Ultra and Diamond packages. Please upgrade your plan."
      : ""
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<ImportQuestion[]>([]);
  const [imageModalState, setImageModalState] = useState<{
    open: boolean;
    questionId: string;
    currentImageUrl: string;
    questionTitle: string;
  }>({
    open: false,
    questionId: "",
    currentImageUrl: "",
    questionTitle: ""
  });

  const automaticStep = method === "automatic" ? step : Math.min(step, 2);
  const steps = method === "automatic" ? ["Choose Method", "Import Type", "Upload File", "Preview", "Import"] : ["Choose Method", "Question Type", "Create Questions"];
  const supported = importType ? importConfig[importType] : null;
  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(method);
    if (method === "manual") return Boolean(manualType);
    if (method === "automatic" && !hasImportAccess) return false;
    if (step === 2) return Boolean(importType);
    if (step === 3) return files.length > 0 && !isProcessing;
    if (step === 4) return previewQuestions.length > 0;
    return true;
  }, [files.length, hasImportAccess, importType, isProcessing, manualType, method, previewQuestions.length, step]);

  function selectMethod(nextMethod: CreationMethod) {
    if (nextMethod === "automatic" && !hasImportAccess) {
      setError("Question Import feature is off in Free & Pro packages. It is available in Ultra and Diamond packages. Please upgrade to import questions.");
      return;
    }
    setMethod(nextMethod);
    setError("");
    if (nextMethod === "manual" && step > 2) setStep(2);
  }

  function continueFlow() {
    setError("");
    if (!canContinue) {
      setError("Complete this step before continuing.");
      return;
    }
    if (step === 1) {
      if (method === "bank") {
        router.push(`/dashboard/papers/${paper.id}/questions/mcq` as Route);
        return;
      }
      setStep(2);
      return;
    }
    if (method === "manual" && manualType) {
      router.push(`/dashboard/papers/${paper.id}/questions/${manualType}` as Route);
      return;
    }
    if (method === "automatic" && step === 3) {
      void processFiles();
      return;
    }
    if (method === "automatic" && step === 4) {
      void importQuestions();
      return;
    }
    setStep((value) => Math.min(value + 1, 5));
  }

  function previousStep() {
    setError("");
    setStep((value) => Math.max(value - 1, 1));
  }

  function cancelFlow() {
    router.push("/dashboard" as Route);
  }

  function validateFiles(nextFiles: File[]) {
    if (!importType) return "Choose an import type first.";
    const allowed = importConfig[importType].formats.map((item) => item.toLowerCase());
    const invalid = nextFiles.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return !allowed.includes(extension);
    });
    if (invalid) return `${invalid.name} is not supported for ${importConfig[importType].label}.`;
    const tooLarge = nextFiles.find((file) => file.size > maxFileSizeMb * 1024 * 1024);
    if (tooLarge) return `${tooLarge.name} is larger than ${maxFileSizeMb}MB.`;
    return "";
  }

  function chooseFiles(fileList?: FileList | null) {
    const nextFiles = Array.from(fileList ?? []);
    const validation = validateFiles(nextFiles);
    if (validation) {
      setError(validation);
      return;
    }
    setFiles(nextFiles);
    setError("");
    setUploadProgress(0);
    setProcessingProgress(0);
  }

  async function processFiles() {
    if (!importType) return;
    setIsProcessing(true);
    setError("");
    setUploadProgress(10);
    setProcessingProgress(0);
    try {
      const convertedFiles = await Promise.all(
        files.map(async (file, index) => {
          const dataUrl = await fileToDataUrl(file);
          setUploadProgress(10 + Math.round(((index + 1) / files.length) * 90));
          return { name: file.name, mimeType: file.type, dataUrl };
        })
      );

      setProcessingProgress(15);
      const progressTimer = setInterval(() => {
        setProcessingProgress((current) => (current < 88 ? current + 4 : current));
      }, 400);

      let payload: ParseResponse;
      try {
        payload = await apiRequest<ParseResponse>("/api/question-import/parse", {
          method: "POST",
          body: JSON.stringify({
            importType,
            files: convertedFiles
          })
        });
      } finally {
        clearInterval(progressTimer);
        setProcessingProgress(100);
      }

      if (!payload.questions.length) {
        const warningDetail = payload.warnings?.filter(Boolean).join(" ");
        throw new Error(warningDetail || "No questions could be parsed from the uploaded document. Please verify the document contains clear questions and options.");
      }

      const cleanQuestions = payload.questions.map((q) => ({
        ...q,
        title: latexToCleanMath(q.title),
        subtitle: q.subtitle ? latexToCleanMath(q.subtitle) : "",
        options: q.options.map((opt) => latexToCleanMath(opt)),
        explanation: q.explanation ? latexToCleanMath(q.explanation) : "",
        subQuestions: q.subQuestions?.map((sq) => ({
          ...sq,
          text: latexToCleanMath(sq.text),
          answer: sq.answer ? latexToCleanMath(sq.answer) : "",
          explanation: sq.explanation ? latexToCleanMath(sq.explanation) : ""
        }))
      }));
      setPreviewQuestions(cleanQuestions);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function importQuestions() {
    try {
      setIsImporting(true);
      const imported = previewQuestions.filter((question) => question.title.trim());
      if (!imported.length) throw new Error("Add at least one valid question before importing.");
      await apiRequest<Paper>(`/api/papers/${paper.id}/questions`, {
        method: "PUT",
        body: JSON.stringify({
          questions: [
            ...paper.questions,
            ...imported.map((question) => {
              const options = question.options.map((option) => option.trim()).filter(Boolean);
              const isCq = question.type === "cq" || Boolean(question.subQuestions?.length);
              const isMcq = !isCq && options.length > 0;
              const subQuestions = isCq && question.subQuestions?.length
                ? question.subQuestions.map((sq, sqIdx) => ({
                    id: sq.id || `${question.id}_sq_${sqIdx}`,
                    label: sq.label || String.fromCharCode(97 + sqIdx),
                    text: sq.text,
                    marks: Number(toStandardDigits(sq.marks)) || 1
                  }))
                : undefined;
              const totalMarks = question.marks
                ? Number(toStandardDigits(question.marks)) || 1
                : subQuestions?.length
                  ? subQuestions.reduce((sum, sq) => sum + sq.marks, 0)
                  : 1;

              return {
                id: question.id,
                number: question.number || undefined,
                title: question.title,
                subtitle: question.subtitle || undefined,
                imageUrl: question.imageUrl || undefined,
                marks: totalMarks,
                type: isCq ? "cq" : "mcq",
                options: isMcq
                  ? options.map((option, index) => ({
                      id: `${question.id}_opt_${index}`,
                      label: String.fromCharCode(65 + index),
                      text: option,
                      isCorrect: question.correct === index
                    }))
                  : [],
                subQuestions,
                explanation: question.explanation || undefined
              };
            })
          ]
        })
      });
      setStep(5);
      const hasCq = imported.some((question) => question.type === "cq" || Boolean(question.subQuestions?.length));
      setTimeout(() => router.push(`/dashboard/papers/${paper.id}/questions/${hasCq ? "cq" : "mcq"}` as Route), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import questions.");
    } finally {
      setIsImporting(false);
    }
  }

  function updatePreview(id: string, patch: Partial<ImportQuestion>) {
    setPreviewQuestions((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadPreviewImage(questionId: string, file?: File) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      try {
        const upload = await apiRequest<{ imageUrl: string }>("/api/uploads/image", {
          method: "POST",
          body: JSON.stringify({ folder: "questions", fileName: file.name, imageData: dataUrl })
        });
        if (upload?.imageUrl) {
          updatePreview(questionId, { imageUrl: upload.imageUrl });
          return;
        }
      } catch (uploadErr) {
        console.warn("[QuestionCreationWizard] Backend upload fallback to data URL:", uploadErr);
      }
      updatePreview(questionId, { imageUrl: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    }
  }

  function updatePreviewOption(id: string, optionIndex: number, value: string) {
    setPreviewQuestions((items) => items.map((item) => (item.id === id ? { ...item, options: item.options.map((option, index) => (index === optionIndex ? value : option)) } : item)));
  }

  function addPreviewOption(id: string) {
    setPreviewQuestions((items) => items.map((item) => (item.id === id ? { ...item, options: [...item.options, ""] } : item)));
  }

  function updatePreviewSubQuestion(id: string, sqIndex: number, patch: Partial<{ label: string; text: string; marks: number }>) {
    setPreviewQuestions((items) =>
      items.map((item) => {
        if (item.id !== id || !item.subQuestions) return item;
        const nextSq = item.subQuestions.map((sq, idx) => (idx === sqIndex ? { ...sq, ...patch } : sq));
        return { ...item, subQuestions: nextSq };
      })
    );
  }

  function addPreviewSubQuestion(id: string) {
    setPreviewQuestions((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const currentSq = item.subQuestions ?? [];
        const nextIndex = currentSq.length;
        const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ"];
        const label = nextIndex < banglaLabels.length ? banglaLabels[nextIndex] : String.fromCharCode(97 + nextIndex);
        return {
          ...item,
          type: "cq",
          subQuestions: [
            ...currentSq,
            { id: `${id}_sq_${nextIndex + 1}`, label, text: "", marks: Math.min(nextIndex + 1, 4) }
          ]
        };
      })
    );
  }

  function removePreviewSubQuestion(id: string, sqIndex: number) {
    setPreviewQuestions((items) =>
      items.map((item) => {
        if (item.id !== id || !item.subQuestions) return item;
        return { ...item, subQuestions: item.subQuestions.filter((_, idx) => idx !== sqIndex) };
      })
    );
  }

  function movePreview(id: string, direction: -1 | 1) {
    setPreviewQuestions((items) => {
      const index = items.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function addPreviewQuestion() {
    setPreviewQuestions((items) => [...items, createPreviewQuestion(`Question ${items.length + 1}`, importType ?? "image", ["Empty question"])]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Question editor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Add or import questions</h1>
          <p className="mt-2 text-sm text-muted-foreground">{paper.name} - selections are kept when you go back.</p>
        </div>
        <Button variant="outline" onClick={cancelFlow}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      <Stepper steps={steps} active={automaticStep} />

      <Card>
        <CardContent className="p-5">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-3">
              <ChoiceCard selected={method === "manual"} icon={Pencil} title="Manual" description="Create questions manually using the built-in editor." onClick={() => selectMethod("manual")} />
              <ChoiceCard
                selected={method === "automatic"}
                icon={Wand2}
                title="Automatic (AI Import)"
                description="Import questions from images, PDF, or DOCX using OCR + AI."
                badge={!hasImportAccess ? "Ultra & Diamond (৳১০০০+)" : "Active"}
                onClick={() => selectMethod("automatic")}
              />
              <ChoiceCard selected={method === "bank"} icon={BookOpen} title="Question Bank" description="Import existing reusable questions directly from your Question Bank." onClick={() => selectMethod("bank")} />
            </div>
          )}

          {method === "manual" && step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <ChoiceCard selected={manualType === "mcq"} icon={Check} title="MCQ" description="Create Multiple Choice Questions." features={["Dynamic Options", "Correct Answer", "Images", "Explanation", "Marks"]} onClick={() => setManualType("mcq")} />
              <ChoiceCard selected={manualType === "cq"} icon={FileText} title="CQ" description="Create Creative / Descriptive Questions." features={["Question Title", "Subtitle", "Image", "Marks", "Answer Space", "Explanation"]} onClick={() => setManualType("cq")} />
            </div>
          )}

          {method === "automatic" && step === 2 && (
            <div className="grid gap-4 md:grid-cols-3">
              {(["image", "pdf", "docx"] as ImportType[]).map((type) => (
                <ChoiceCard
                  key={type}
                  selected={importType === type}
                  icon={type === "image" ? Image : FileText}
                  title={importConfig[type].label}
                  description={importConfig[type].description}
                  features={importConfig[type].formats}
                  onClick={() => {
                    setImportType(type);
                    setFiles([]);
                    setError("");
                  }}
                />
              ))}
            </div>
          )}

          {method === "automatic" && step === 3 && supported && (
            <div className="space-y-5">
              <div
                onDrop={(event) => {
                  event.preventDefault();
                  chooseFiles(event.dataTransfer.files);
                }}
                onDragOver={(event) => event.preventDefault()}
                className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 p-6 text-center"
              >
                <UploadCloud className="h-12 w-12 text-primary" />
                <p className="mt-3 text-base font-semibold">Drop files here</p>
                <p className="mt-1 text-sm text-muted-foreground">Supported: {supported.formats.join(", ")} - Maximum file size: {maxFileSizeMb}MB</p>
                <Button className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  Browse Files
                </Button>
                <input ref={fileInputRef} type="file" multiple={importType === "image"} accept={supported.accept} className="sr-only" onChange={(event) => chooseFiles(event.target.files)} />
              </div>
              {files.length > 0 && (
                <div className="rounded-md border p-3 text-sm">
                  {files.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 py-1">
                      <span className="truncate">{file.name}</span>
                      <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                    </div>
                  ))}
                </div>
              )}
              <ProgressBar label="Upload progress" value={uploadProgress} />
              <ProgressBar label="Processing progress" value={processingProgress} />
            </div>
          )}

          {method === "automatic" && step === 4 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Import preview</h2>
                  <p className="text-sm text-muted-foreground">Review, edit text, and insert symbols before saving them.</p>
                </div>
                <Button variant="outline" size="sm" onClick={addPreviewQuestion}>
                  <Plus className="h-4 w-4" />
                  Add question
                </Button>
              </div>
              {previewQuestions.map((question, index) => (
                <div key={question.id} className="space-y-3 rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      Question {question.number ?? index + 1}
                      {question.type && <span className="rounded-md border px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">{question.type}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={index === 0} onClick={() => movePreview(question.id, -1)}>Up</Button>
                      <Button variant="outline" size="sm" disabled={index === previewQuestions.length - 1} onClick={() => movePreview(question.id, 1)}>Down</Button>
                      <Button variant="ghost" size="sm" onClick={() => setPreviewQuestions((items) => items.filter((item) => item.id !== question.id))}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  {question.warnings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {question.warnings.map((warning) => (
                        <span key={warning} className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          {warning}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                    <label className="text-sm font-medium">
                      Question Title
                      <div className="mt-1">
                        <MathTextField value={question.title} onChange={(value) => updatePreview(question.id, { title: value })} placeholder="Question title" />
                      </div>
                    </label>
                    <label className="text-sm font-medium">
                      Marks
                      <input
                        type="text"
                        inputMode="decimal"
                        value={question.marks ?? ""}
                        onChange={(event) => {
                          const val = toStandardDigits(event.target.value);
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            updatePreview(question.id, { marks: val as any });
                          }
                        }}
                        onBlur={() => {
                          const num = parseFloat(toStandardDigits(question.marks));
                          updatePreview(question.id, { marks: isNaN(num) || num <= 0 ? 1 : num });
                        }}
                        placeholder="1"
                        className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-medium">
                    Subtitle
                    <input value={question.subtitle} onChange={(event) => updatePreview(question.id, { subtitle: event.target.value })} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" />
                  </label>

                  {/* Optional Image */}
                  <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Question Image (Optional)</p>
                        <p className="text-[11px] text-muted-foreground">Add or edit diagram figure for this question</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setImageModalState({
                              open: true,
                              questionId: question.id,
                              currentImageUrl: question.imageUrl || "",
                              questionTitle: question.title
                            })
                          }
                          className="h-8 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Import Image
                        </Button>
                        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-accent">
                          <ImagePlus className="h-3.5 w-3.5" />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => uploadPreviewImage(question.id, event.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>
                    {question.imageUrl && (
                      <div className="mt-2 flex items-start gap-3">
                        {question.imageUrl.trim().startsWith("<svg") ? (
                          <div
                            className="h-20 w-28 rounded-md border overflow-hidden flex items-center justify-center bg-white p-1 [&>svg]:max-h-full [&>svg]:w-auto shrink-0 shadow-xs"
                            dangerouslySetInnerHTML={{ __html: sanitizeSvg(question.imageUrl) }}
                          />
                        ) : (
                          <img src={question.imageUrl} alt="" className="h-20 w-28 rounded-md border object-contain bg-white shrink-0 shadow-xs" />
                        )}
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setImageModalState({
                                open: true,
                                questionId: question.id,
                                currentImageUrl: question.imageUrl || "",
                                questionTitle: question.title
                              })
                            }
                            className="text-xs text-primary hover:bg-primary/10 h-7 px-2 justify-start"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Change / Re-import
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updatePreview(question.id, { imageUrl: "" })}
                            className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 justify-start"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {question.tables && question.tables.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                      {question.tables.length} table{question.tables.length === 1 ? "" : "s"} detected and preserved in import metadata.
                    </div>
                  )}

                  {question.type === "cq" || (question.subQuestions && question.subQuestions.length > 0) ? (
                    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Creative Question Parts (CQ)</span>
                        <Button variant="outline" size="sm" onClick={() => addPreviewSubQuestion(question.id)}>
                          <Plus className="h-3.5 w-3.5" />
                          Add part
                        </Button>
                      </div>
                      {(question.subQuestions ?? []).map((sq, sqIdx) => (
                        <div key={sq.id} className="space-y-2 rounded-md border bg-background p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={sq.label ?? ""}
                                onChange={(e) => updatePreviewSubQuestion(question.id, sqIdx, { label: e.target.value })}
                                className="h-7 w-12 rounded border bg-background text-center text-xs font-semibold"
                                placeholder="Label"
                              />
                              <span className="text-xs text-muted-foreground">Part {sq.label || String.fromCharCode(97 + sqIdx)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                                Marks:
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={sq.marks ?? ""}
                                  onChange={(e) => {
                                    const val = toStandardDigits(e.target.value);
                                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                      updatePreviewSubQuestion(question.id, sqIdx, { marks: val as any });
                                    }
                                  }}
                                  onBlur={() => {
                                    const num = parseFloat(toStandardDigits(sq.marks));
                                    updatePreviewSubQuestion(question.id, sqIdx, { marks: isNaN(num) || num <= 0 ? 1 : num });
                                  }}
                                  className="h-7 w-16 rounded border bg-background px-2 text-xs"
                                />
                              </label>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePreviewSubQuestion(question.id, sqIdx)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <MathTextField
                            value={sq.text}
                            onChange={(val) => updatePreviewSubQuestion(question.id, sqIdx, { text: val })}
                            placeholder="Sub-question text"
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-2 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={`${question.id}-${optionIndex}`} className="space-y-1">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => updatePreview(question.id, { correct: optionIndex })}
                                className={cn("h-10 w-10 shrink-0 rounded-md border text-sm", question.correct === optionIndex && "bg-primary text-primary-foreground")}
                              >
                                {String.fromCharCode(65 + optionIndex)}
                              </button>
                              <div className="min-w-0 flex-1">
                                <MathTextField value={option} onChange={(value) => updatePreviewOption(question.id, optionIndex, value)} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} compact />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {question.options.length === 0 && (
                        <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                          Written / Descriptive question (no options required). Use the buttons below if you wish to add MCQ options or convert to a Creative Question (CQ).
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => addPreviewOption(question.id)}>
                          <Plus className="h-4 w-4" />
                          Add option
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addPreviewSubQuestion(question.id)}>
                          <Plus className="h-4 w-4" />
                          Convert to CQ / Add parts
                        </Button>
                      </div>
                      <div className="pt-2">
                        <label className="text-xs font-medium text-muted-foreground">Answer / Explanation</label>
                        <div className="mt-1">
                          <MathTextField
                            value={question.explanation ?? ""}
                            onChange={(val) => updatePreview(question.id, { explanation: val })}
                            placeholder="Explanation or model answer (optional)"
                            compact
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {method === "automatic" && step === 5 && (
            <div className="py-10 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-3 text-xl font-semibold">Questions imported</h2>
              <p className="mt-1 text-sm text-muted-foreground">Opening the editor with your saved questions.</p>
            </div>
          )}

          {error && <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={previousStep} disabled={step === 1 || isProcessing || isImporting}>
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={cancelFlow} disabled={isProcessing || isImporting}>Cancel</Button>
          <Button onClick={continueFlow} disabled={!canContinue || isProcessing || isImporting || step === 5}>
            {buttonLabel(method, step, isProcessing, isImporting)}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Import Question Image Modal */}
      <ImportImageModal
        open={imageModalState.open}
        onClose={() => setImageModalState((prev) => ({ ...prev, open: false }))}
        onApplyImage={(imageUrl) => {
          if (imageModalState.questionId) {
            updatePreview(imageModalState.questionId, { imageUrl });
          }
        }}
        currentImageUrl={imageModalState.currentImageUrl}
        questionTitle={imageModalState.questionTitle}
        subjectContext={paper.subject}
      />
    </div>
  );
}

function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
      {steps.map((item, index) => {
        const number = index + 1;
        const isActive = number === active;
        const isDone = number < active;
        return (
          <div key={item} className={cn("rounded-md border bg-card p-2 sm:p-2.5 text-xs sm:text-sm transition", isActive && "border-primary bg-accent text-accent-foreground font-semibold")}>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className={cn("flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border text-[10px] sm:text-xs", isDone && "bg-primary text-primary-foreground")}>
                {isDone ? <Check className="h-3 w-3" /> : number}
              </span>
              <span className="font-medium truncate">{item}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChoiceCard({
  selected,
  icon: Icon,
  title,
  description,
  features,
  badge,
  disabled,
  onClick
}: {
  selected: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-48 rounded-md border bg-background p-5 text-left transition hover:border-primary hover:shadow-soft relative",
        selected && "border-primary bg-accent text-accent-foreground",
        disabled && "opacity-75 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-card">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 text-[11px] font-semibold">
              {badge}
            </span>
          )}
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border", selected && "bg-primary text-primary-foreground")}>
            {selected && <Check className="h-3 w-3" />}
          </span>
        </div>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {features && (
        <div className="mt-4 flex flex-wrap gap-2">
          {features.map((feature) => (
            <span key={feature} className="rounded-md border bg-card px-2 py-1 text-xs">
              {feature}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function buttonLabel(method: CreationMethod | null, step: number, isProcessing: boolean, isImporting: boolean) {
  if (isProcessing) return "Processing...";
  if (isImporting) return "Importing...";
  if (method === "manual" && step === 2) return "Open editor";
  if (method === "automatic" && step === 3) return "Process";
  if (method === "automatic" && step === 4) return "Import";
  return "Continue";
}

function createPreviewQuestion(title: string, importType: ImportType, warnings: string[] = []): ImportQuestion {
  return {
    id: `import_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title,
    subtitle: `${importConfig[importType].label} import draft`,
    imageUrl: "",
    marks: 1,
    options: ["Option A", "Option B", "Option C", warnings.includes("Missing Option D") ? "" : "Option D"],
    correct: 0,
    warnings
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
