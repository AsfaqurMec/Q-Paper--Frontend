"use client";

import { AlertTriangle, CheckCircle2, FileDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StatusModal({
  open,
  type,
  title,
  message,
  onClose,
  onDownloadPdf,
  onDownloadDocx
}: {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
}) {
  if (!open) return null;
  const Icon = type === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-card p-4 sm:p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={type === "success" ? "text-primary" : "text-destructive"}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          <button aria-label="Close modal" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {type === "success" && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={onDownloadPdf}>
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onDownloadDocx} className="gap-1.5">
              <FileDown className="h-4 w-4" />
              Download DOCX (Ultra)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
