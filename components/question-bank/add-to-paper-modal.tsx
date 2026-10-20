"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, Check, ExternalLink, FileQuestion, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";
import type { Paper } from "@/lib/api-types";

type AddToPaperModalProps = {
  open: boolean;
  questionIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

export function AddToPaperModal({ open, questionIds, onClose, onSuccess }: AddToPaperModalProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successResult, setSuccessResult] = useState<{ paperId: string; paperName: string; count: number } | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      setSuccessResult(null);
      apiRequest<Paper[]>("/api/papers")
        .then((res) => {
          setPapers(res);
          if (res.length > 0) setSelectedPaperId(res[0].id);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load papers"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  async function handleAdd() {
    if (!selectedPaperId) {
      setError("Please select a paper.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const result = await apiRequest<Paper>(`/api/papers/${selectedPaperId}/import-bank`, {
        method: "POST",
        body: JSON.stringify({ bankQuestionIds: questionIds })
      });

      setSuccessResult({
        paperId: result.id,
        paperName: result.name,
        count: questionIds.length
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import questions to paper.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-auto max-h-[92vh] overflow-y-auto w-full max-w-md rounded-xl border bg-card p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg font-semibold">Add to Exam Paper</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Insert {questionIds.length} question{questionIds.length === 1 ? "" : "s"} into an existing paper
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successResult ? (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Questions Imported!</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Successfully inserted {successResult.count} question{successResult.count === 1 ? "" : "s"} into{" "}
                <span className="font-semibold text-foreground">&quot;{successResult.paperName}&quot;</span>.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
              <Button asChild>
                <Link href={`/dashboard/papers/${successResult.paperId}/questions/mcq`}>
                  <ExternalLink className="h-4 w-4" /> Open in Editor
                </Link>
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading your papers...</div>
        ) : papers.length === 0 ? (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileQuestion className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">No saved papers found</p>
            <p className="text-xs text-muted-foreground">Create a paper first, then import questions into it.</p>
            <Button asChild className="w-full">
              <Link href="/dashboard/papers/new">
                <Plus className="h-4 w-4" /> Create New Paper
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Select destination paper:</p>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {papers.map((paper) => {
                const isSelected = selectedPaperId === paper.id;
                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => setSelectedPaperId(paper.id)}
                    className={`flex w-full items-start justify-between rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold leading-none">{paper.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {paper.subject} &middot; {paper.className} &middot; {paper.questions.length} questions
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAdd} disabled={submitting}>
                {submitting ? "Importing..." : "Add to Paper"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
