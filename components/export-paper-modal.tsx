"use client";

import { useState } from "react";
import { Check, CheckCircle2, Download, FileCheck, FileDown, FileQuestion, FileText, Loader2, Sparkles, X } from "lucide-react";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isUltra = userPlan === "ultra" || userPlan === "diamond" || userPlan === "admin";

  async function handleDownload() {
    setError(null);
    if (format === "docx" && !isUltra) {
      setError("DOCX export is only available in the Ultra and Diamond packages. Please select PDF or upgrade your plan.");
      return;
    }

    try {
      setIsDownloading(true);
      if (onSaveBeforeExport) {
        await onSaveBeforeExport();
      }

      const params = new URLSearchParams();
      params.set("withAnswer", withAnswer ? "true" : "false");
      if (selectedSet) {
        params.set("set", selectedSet);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/backend/papers/${paperId}/export/${format}${queryString}`);

      if (!response.ok) {
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
      const setSuffix = selectedSet ? `-Set-${selectedSet}` : "";
      const answerSuffix = withAnswer ? "-With-Answers" : "-Question-Paper";

      anchor.download = `${safeName}${setSuffix}${answerSuffix}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed. Please check your connection.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border bg-card p-4 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Export Question Paper</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-[340px]">
                {paperName || "Question Paper"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-5">
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
                className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                  !withAnswer
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:border-slate-300 hover:bg-muted/30"
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
                <p className="text-[11px] text-muted-foreground mt-1">
                  Clean exam questions for test takers without any answer keys or solutions.
                </p>
              </button>

              {/* With Answer */}
              <button
                type="button"
                onClick={() => setWithAnswer(true)}
                className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                  withAnswer
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:border-slate-300 hover:bg-muted/30"
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
                <p className="text-[11px] text-muted-foreground mt-1">
                  Full question paper with comprehensive answer keys and explanations appended.
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
                    : "border-border hover:border-slate-300 hover:bg-muted/30"
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
                    : "border-border hover:border-slate-300 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`h-4 w-4 ${format === "docx" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">Word (.docx)</p>
                      <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-700 uppercase">
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

          {/* Optional Set Selector (if activeSet or set options are relevant) */}
          {activeSet && (
            <div className="rounded-lg border bg-muted/20 p-3 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Selected Question Set:</span>
              <span className="font-bold text-foreground">Set {activeSet}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading} className="gap-2 min-w-[130px]">
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
