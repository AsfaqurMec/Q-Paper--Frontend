"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  FileCheck,
  FileDown,
  FileQuestion,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ExportPaperModalProps = {
  open: boolean;
  onClose: () => void;
  paperId: string;
  paperName: string;
  defaultFormat?: "pdf" | "docx";
  defaultWithAnswer?: boolean;
  activeSet?: string;
  userPlan?: string;
  onSaveBeforeExport?: () => Promise<void>;
};

const SET_OPTIONS = [
  { key: "", label: "মূল প্রশ্ন", subLabel: "Original", description: "সেট ছাড়া মূল প্রশ্নপত্র" },
  { key: "all", label: "সকল ৪টি সেট", subLabel: "All 4 Sets", badge: "ক, খ, গ, ঘ", description: "৪টি ভিন্ন সেটের প্রশ্ন" },
  { key: "A", label: "সেট ক", subLabel: "Set A", description: "ক-সেট প্রশ্ন" },
  { key: "B", label: "সেট খ", subLabel: "Set B", description: "খ-সেট (শাফেল্ড)" },
  { key: "C", label: "সেট গ", subLabel: "Set C", description: "গ-সেট (শাফেল্ড)" },
  { key: "D", label: "সেট ঘ", subLabel: "Set D", description: "ঘ-সেট (শাফেল্ড)" }
];

export function ExportPaperModal({
  open,
  onClose,
  paperId,
  paperName,
  defaultFormat = "pdf",
  defaultWithAnswer = false,
  activeSet,
  userPlan = "free",
  onSaveBeforeExport
}: ExportPaperModalProps) {
  const [format, setFormat] = useState<"pdf" | "docx">(defaultFormat);
  const [withAnswer, setWithAnswer] = useState<boolean>(defaultWithAnswer);
  const [selectedSet, setSelectedSet] = useState<string>(activeSet || "");
  const [allSetsMode, setAllSetsMode] = useState<"combined" | "separate">("combined");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when modal opens
  useEffect(() => {
    if (open) {
      setFormat(defaultFormat);
      setWithAnswer(defaultWithAnswer);
      setSelectedSet(activeSet || "");
      setAllSetsMode("combined");
      setError(null);
      setIsDownloading(false);
      setDownloadStatus(null);

      // Proactively warm up backend (Render cold-start mitigation)
      fetch("/api/backend/health").catch(() => {});
    }
  }, [open, defaultFormat, defaultWithAnswer, activeSet]);

  if (!open) return null;

  const isUltra = userPlan === "ultra" || userPlan === "diamond" || userPlan === "admin";

  async function triggerSingleDownload(
    formatType: "pdf" | "docx",
    setKey?: string,
    isAll?: boolean
  ) {
    const params = new URLSearchParams();
    params.set("withAnswer", withAnswer ? "true" : "false");
    if (isAll) {
      params.set("set", "all");
    } else if (setKey) {
      params.set("set", setKey);
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000); // 90s safety timeout

    try {
      const response = await fetch(`/api/backend/papers/${paperId}/export/${formatType}${queryString}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 504 || response.status === 502) {
          throw new Error(
            "সার্ভার রেসপন্স দিতে সময় নিচ্ছে বা ব্যাকএন্ড স্টার্ট হচ্ছে (Render Cold Start)। অনুগ্রহ করে ৩০ সেকেন্ড পর আবার চেষ্টা করুন।"
          );
        }
        const errorJson = await response.json().catch(() => null);
        throw new Error(
          errorJson?.message ||
            (response.status === 403
              ? "DOCX export is only available in the Ultra and Diamond packages. Please upgrade your plan."
              : `Export failed (${response.status})`)
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;

      const safeName = (paperName || "question-paper").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "");
      let setSuffix = "";
      if (isAll) {
        setSuffix = "-All-Sets";
      } else if (setKey) {
        const banglaMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
        setSuffix = `-Set-${setKey}${banglaMap[setKey] ? `-${banglaMap[setKey]}` : ""}`;
      }
      const answerSuffix = withAnswer ? "-With-Answers" : "-Question-Paper";

      anchor.download = `${safeName}${setSuffix}${answerSuffix}.${formatType}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleDownload() {
    setError(null);
    if (format === "docx" && !isUltra) {
      setError("DOCX export is only available in the Ultra and Diamond packages. Please select PDF or upgrade your plan.");
      return;
    }

    try {
      setIsDownloading(true);
      if (onSaveBeforeExport) {
        setDownloadStatus("প্রশ্নপত্র সংরক্ষণ করা হচ্ছে...");
        await onSaveBeforeExport();
      }

      if (selectedSet === "all" && allSetsMode === "separate") {
        const sets = [
          { key: "A", name: "ক" },
          { key: "B", name: "খ" },
          { key: "C", name: "গ" },
          { key: "D", name: "ঘ" }
        ];
        for (let i = 0; i < sets.length; i++) {
          const s = sets[i];
          setDownloadStatus(`সেট ${s.key} (${s.name}) ডাউনলোড হচ্ছে (${i + 1}/${sets.length})...`);
          await triggerSingleDownload(format, s.key);
          if (i < sets.length - 1) {
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      } else if (selectedSet === "all") {
        setDownloadStatus("সকল ৪টি সেট সহ ফাইল প্রস্তুত হচ্ছে...");
        await triggerSingleDownload(format, undefined, true);
      } else {
        setDownloadStatus(`${format.toUpperCase()} ফাইল প্রস্তুত হচ্ছে...`);
        await triggerSingleDownload(format, selectedSet || undefined);
      }

      onClose();
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("ডাউনলোডে অতিরিক্ত সময় লাগছে। সার্ভার স্টার্ট হতে পারে, অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।");
      } else {
        setError(err instanceof Error ? err.message : "Download failed. Please check your connection.");
      }
    } finally {
      setIsDownloading(false);
      setDownloadStatus(null);
    }
  }

  // Dynamic label for the download button
  let buttonLabel = `Download ${format.toUpperCase()}`;
  if (selectedSet === "all") {
    buttonLabel = allSetsMode === "separate" ? `Download 4 Files (${format.toUpperCase()})` : `Download All Sets (${format.toUpperCase()})`;
  } else if (selectedSet) {
    buttonLabel = `Download Set ${selectedSet} (${format.toUpperCase()})`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border bg-card p-4 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 shrink-0">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Export Question Paper</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-[380px]">
                {paperName || "Question Paper"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            disabled={isDownloading}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">এক্সপোর্ট ত্রুটি (Export Failed)</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-7 text-xs border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              আবার চেষ্টা করুন
            </Button>
          </div>
        )}

        <div className="mt-5 space-y-5">
          {/* Question Set Selection (প্রশ্ন সেট নির্বাচন) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Question Set (প্রশ্ন সেট নির্বাচন)
              </label>
              {selectedSet && (
                <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                  {selectedSet === "all" ? "সকল ৪টি সেট" : `নির্বাচিত: সেট ${selectedSet}`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SET_OPTIONS.map((opt) => {
                const isSelected = selectedSet === opt.key;
                return (
                  <button
                    key={opt.key || "original"}
                    type="button"
                    onClick={() => setSelectedSet(opt.key)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
                      isSelected
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20 shadow-xs"
                        : "border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-foreground">
                        {opt.label}
                      </span>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      ) : opt.badge ? (
                        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100/70 dark:bg-teal-900/40 px-1 rounded">
                          {opt.badge}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 truncate w-full">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* When "all" is selected, show mode: Single combined file vs 4 separate files */}
            {selectedSet === "all" && (
              <div className="mt-3 p-3 rounded-lg border border-teal-200 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20 animate-in fade-in duration-150">
                <p className="text-xs font-semibold text-teal-900 dark:text-teal-200 mb-2 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-teal-600" />
                  সকল ৪টি সেট ডাউনলোড মোড (Download Mode)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAllSetsMode("combined")}
                    className={`flex items-start gap-2 p-2 rounded-md border text-left transition ${
                      allSetsMode === "combined"
                        ? "border-teal-500 bg-card ring-1 ring-teal-500 shadow-2xs font-semibold text-foreground"
                        : "border-border bg-card/60 hover:bg-card text-muted-foreground"
                    }`}
                  >
                    <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      allSetsMode === "combined" ? "border-teal-600 bg-teal-600 text-white" : "border-muted-foreground"
                    }`}>
                      {allSetsMode === "combined" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">১টি ফাইলে ৪টি সেট (Combined)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">সবগুলো সেট পেজ ব্রেকসহ একটি ফাইলে আসবে</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllSetsMode("separate")}
                    className={`flex items-start gap-2 p-2 rounded-md border text-left transition ${
                      allSetsMode === "separate"
                        ? "border-teal-500 bg-card ring-1 ring-teal-500 shadow-2xs font-semibold text-foreground"
                        : "border-border bg-card/60 hover:bg-card text-muted-foreground"
                    }`}
                  >
                    <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      allSetsMode === "separate" ? "border-teal-600 bg-teal-600 text-white" : "border-muted-foreground"
                    }`}>
                      {allSetsMode === "separate" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">আলাদা ৪টি ফাইলে (4 Files)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">ক, খ, গ, ঘ আলাদাভাবে ৪টি ফাইল ডাউনলোড হবে</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Answer Option Selector: With Answer vs Without Answer */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Answer Sheet Option (উত্তরপত্র নির্বাচন)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Without Answer */}
              <button
                type="button"
                onClick={() => setWithAnswer(false)}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                  !withAnswer
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <FileQuestion className={`h-4 w-4 ${!withAnswer ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-semibold text-foreground">Without Answer</span>
                  </div>
                  {!withAnswer && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-[11px] font-medium text-primary/80">পরীক্ষার প্রশ্নপত্র (Students Only)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  শিক্ষার্থীদের জন্য প্রশ্নপত্র, কোনো উত্তর বা ব্যাখ্যা ছাড়া।
                </p>
              </button>

              {/* With Answer */}
              <button
                type="button"
                onClick={() => setWithAnswer(true)}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                  withAnswer
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <FileCheck className={`h-4 w-4 ${withAnswer ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-semibold text-foreground">With Answer</span>
                  </div>
                  {withAnswer && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-[11px] font-medium text-primary/80">উত্তরমালা ও ব্যাখ্যাসহ (Teacher Copy)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  প্রশ্নের শেষে সঠিক উত্তরমালা ও পূর্ণাঙ্গ ব্যাখ্যা সংযুক্ত থাকবে।
                </p>
              </button>
            </div>
          </div>

          {/* Export Format Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Export Format (ফরম্যাট)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  format === "pdf"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`h-4 w-4 ${format === "pdf" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className="text-sm font-semibold">PDF Document</p>
                    <p className="text-[11px] text-muted-foreground">Ready to print (A4)</p>
                  </div>
                </div>
                {format === "pdf" && <Check className="h-4 w-4 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setFormat("docx")}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  format === "docx"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-700 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`h-4 w-4 ${format === "docx" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">Word (.docx)</p>
                      <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                        Ultra / Diamond
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Editable in MS Word</p>
                  </div>
                </div>
                {format === "docx" && <Check className="h-4 w-4 text-primary" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            {downloadStatus ? (
              <span className="flex items-center gap-1.5 font-medium text-teal-600 dark:text-teal-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {downloadStatus}
              </span>
            ) : (
              <span>এক্সপোর্ট সাধারণত ২-৫ সেকেন্ডে সম্পন্ন হয়</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button variant="ghost" onClick={onClose} disabled={isDownloading}>
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-2 min-w-[140px] bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {buttonLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
