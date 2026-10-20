"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowLeft, ArrowRight, Check, FileText, Image, Pencil, Wand2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { Paper } from "@/lib/api-types";

type CreationMethod = "manual" | "automatic";
type ManualType = "mcq" | "cq";
type ImportType = "image" | "pdf" | "docx";

type PaperForm = {
  name: string;
  subject: string;
  className: string;
  examType: string;
  duration: string;
  totalMarks: string;
  instructions: string;
  questionNumberStyle: Paper["questionNumberStyle"];
  optionLabelStyle: Paper["optionLabelStyle"];
  questionsPerPage: string;
  layout: Paper["layout"];
  cqLayout?: Paper["layout"];
  mcqSectionTitle?: string;
  cqSectionTitle?: string;
};

const importOptions = {
  image: { label: "Image", icon: Image, description: "Extract questions from JPG, PNG, or WEBP files." },
  pdf: { label: "PDF", icon: FileText, description: "Extract questions from selectable PDF text." },
  docx: { label: "DOCX", icon: FileText, description: "Extract questions from Microsoft Word documents." }
} satisfies Record<ImportType, { label: string; icon: LucideIcon; description: string }>;

const defaultForm: PaperForm = {
  name: "",
  subject: "",
  className: "",
  examType: "Model Test",
  duration: "45 minutes",
  totalMarks: "30",
  instructions: "",
  questionNumberStyle: "numeric",
  optionLabelStyle: "bangla",
  questionsPerPage: "10",
  layout: "split",
  cqLayout: "split",
  mcqSectionTitle: "",
  cqSectionTitle: ""
};

export function PaperCreationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<CreationMethod | null>(null);
  const [manualType, setManualType] = useState<ManualType | null>(null);
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [form, setForm] = useState<PaperForm>(defaultForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const steps = method === "automatic" ? ["Choose Method", "Import Type", "Paper Details"] : ["Choose Method", "Question Type", "Paper Details"];
  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(method);
    if (step === 2 && method === "manual") return Boolean(manualType);
    if (step === 2 && method === "automatic") return Boolean(importType);
    return Boolean(form.name.trim() && form.subject.trim() && form.className.trim() && form.examType.trim() && form.duration.trim());
  }, [form, importType, manualType, method, step]);

  function updateForm<Key extends keyof PaperForm>(key: Key, value: PaperForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function continueFlow() {
    setError("");
    if (!canContinue) {
      setError("Complete this step before continuing.");
      return;
    }
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }

    try {
      setIsSaving(true);
      const paper = await apiRequest<Paper>("/api/papers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          totalMarks: Number(form.totalMarks || 1),
          questionsPerPage: form.questionsPerPage !== undefined && form.questionsPerPage !== "" ? Number(form.questionsPerPage) : 10,
          instructions: form.instructions.trim() || undefined,
          mcqSectionTitle: form.mcqSectionTitle?.trim() || undefined,
          cqSectionTitle: form.cqSectionTitle?.trim() || undefined
        })
      });
      const query =
        method === "automatic" && importType
          ? `?method=automatic&importType=${importType}`
          : `?method=manual`;
      const path =
        method === "manual" && manualType
          ? `/dashboard/papers/${paper.id}/questions/${manualType}`
          : `/dashboard/papers/${paper.id}/questions${query}`;
      router.push(path as Route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create paper.");
    } finally {
      setIsSaving(false);
    }
  }

  function previousStep() {
    setError("");
    setStep((value) => Math.max(value - 1, 1));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Create paper</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Choose the question flow first</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pick manual or import before creating the paper.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard" as Route)}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      <Stepper steps={steps} active={step} />

      <Card>
        <CardContent className="p-5">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <ChoiceCard selected={method === "manual"} icon={Pencil} title="Manual" description="Create MCQ or CQ questions yourself." onClick={() => setMethod("manual")} />
              <ChoiceCard selected={method === "automatic"} icon={Wand2} title="Automatic Import" description="Parse questions from image, PDF, or DOCX files." onClick={() => setMethod("automatic")} />
            </div>
          )}

          {step === 2 && method === "manual" && (
            <div className="grid gap-4 md:grid-cols-2">
              <ChoiceCard selected={manualType === "mcq"} icon={Check} title="MCQ" description="Multiple choice paper with options and correct answers." onClick={() => setManualType("mcq")} />
              <ChoiceCard selected={manualType === "cq"} icon={FileText} title="CQ" description="Creative or descriptive questions with sub-parts." onClick={() => setManualType("cq")} />
            </div>
          )}

          {step === 2 && method === "automatic" && (
            <div className="grid gap-4 md:grid-cols-3">
              {(["image", "pdf", "docx"] as ImportType[]).map((type) => (
                <ChoiceCard key={type} selected={importType === type} icon={importOptions[type].icon} title={importOptions[type].label} description={importOptions[type].description} onClick={() => setImportType(type)} />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Paper name" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="SSC Physics Model Test" />
              <TextField label="Subject" value={form.subject} onChange={(value) => updateForm("subject", value)} placeholder="Physics" />
              <TextField label="Class" value={form.className} onChange={(value) => updateForm("className", value)} placeholder="Class 10" />
              <TextField label="Exam type" value={form.examType} onChange={(value) => updateForm("examType", value)} placeholder="Model Test" />
              <TextField label="Duration" value={form.duration} onChange={(value) => updateForm("duration", value)} placeholder="45 minutes" />
              <TextField label="Total marks" value={form.totalMarks} onChange={(value) => updateForm("totalMarks", value)} type="number" />
              <label className="text-sm font-medium">
                Layout
                <select value={form.layout} onChange={(event) => updateForm("layout", event.target.value as Paper["layout"])} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="split">Split (2 Columns)</option>
                  <option value="single">Single (1 Column)</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                CQ Layout
                <select value={form.cqLayout || form.layout} onChange={(event) => updateForm("cqLayout", event.target.value as Paper["layout"])} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="split">Split (2 Columns)</option>
                  <option value="single">Single (1 Column - Full Width)</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                Questions per page
                <select
                  value={form.questionsPerPage}
                  onChange={(event) => updateForm("questionsPerPage", event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm font-medium"
                >
                  <option value="0">Auto Adjust (Fit to Page Height)</option>
                  <option value="5">5 questions</option>
                  <option value="8">8 questions</option>
                  <option value="10">10 questions (Recommended)</option>
                  <option value="12">12 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                </select>
              </label>
              <label className="text-sm font-medium">
                MCQ Option Style
                <select
                  value={form.optionLabelStyle}
                  onChange={(event) => updateForm("optionLabelStyle", event.target.value as Paper["optionLabelStyle"])}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm font-medium"
                >
                  <option value="bangla">(ক), (খ), (গ), (ঘ) — Bangla NCTB Standard</option>
                  <option value="upper-alpha">(A), (B), (C), (D) — English Upper-case</option>
                  <option value="lower-alpha">(a), (b), (c), (d) — English Lower-case</option>
                  <option value="numeric">(1), (2), (3), (4) — Numeric</option>
                </select>
              </label>
              <TextField label="MCQ Section Heading" value={form.mcqSectionTitle || ""} onChange={(value) => updateForm("mcqSectionTitle", value)} placeholder="Default: ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন" />
              <TextField label="CQ Section Heading" value={form.cqSectionTitle || ""} onChange={(value) => updateForm("cqSectionTitle", value)} placeholder="Default: খ-বিভাগ: সৃজনশীল প্রশ্ন" />
              <label className="text-sm font-medium md:col-span-2">
                Instructions
                <textarea value={form.instructions} onChange={(event) => updateForm("instructions", event.target.value)} className="mt-1 min-h-24 w-full rounded-md border bg-background p-3 text-sm" placeholder="Choose the correct answer. Each question carries equal marks." />
              </label>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between gap-3 flex-wrap">
              <span>{error}</span>
              {(error.toLowerCase().includes("limit") ||
                error.toLowerCase().includes("package") ||
                error.toLowerCase().includes("ultra") ||
                error.toLowerCase().includes("device")) && (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs border-destructive/40 hover:bg-destructive/20 shrink-0">
                  <Link href="/dashboard/subscription">View Packages & Upgrade</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={previousStep} disabled={step === 1 || isSaving}>
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button onClick={continueFlow} disabled={!canContinue || isSaving}>
          {step === 3 ? (isSaving ? "Creating..." : "Create paper") : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="grid gap-1.5 sm:gap-2 grid-cols-3">
      {steps.map((item, index) => {
        const number = index + 1;
        const isActive = number === active;
        const isDone = number < active;
        return (
          <div key={item} className={cn("rounded-md border bg-card p-2 sm:p-3 text-xs sm:text-sm transition", isActive && "border-primary bg-accent text-accent-foreground")}>
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

function ChoiceCard({ selected, icon: Icon, title, description, onClick }: { selected: boolean; icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("min-h-44 rounded-md border bg-background p-5 text-left transition hover:border-primary hover:shadow-soft", selected && "border-primary bg-accent text-accent-foreground")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border bg-card">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border", selected && "bg-primary text-primary-foreground")}>{selected && <Check className="h-3 w-3" />}</span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" />
    </label>
  );
}
