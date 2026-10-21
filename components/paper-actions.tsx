"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Edit3, FileDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";
import { ExportPaperModal } from "@/components/export-paper-modal";
import { ConfirmModal } from "@/components/confirm-modal";

export function PaperActions({
  paperId,
  paperName,
  questionType,
  userPlan = "free",
  userRole = "user",
  activeSet
}: {
  paperId: string;
  paperName: string;
  questionType?: "mcq" | "cq" | "both";
  userPlan?: string;
  userRole?: string;
  activeSet?: string;
}) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportModal, setExportModal] = useState<{ open: boolean; format: "pdf" | "docx" }>({
    open: false,
    format: "pdf"
  });

  const editorHref =
    questionType && questionType !== "both"
      ? `/dashboard/papers/${paperId}/questions/${questionType}`
      : `/dashboard/papers/${paperId}/questions`;

  async function handleConfirmDelete() {
    try {
      setIsDeleting(true);
      await apiRequest(`/api/papers/${paperId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {userRole === "admin" && (
          <Button asChild variant="outline" size="sm">
            <Link href={editorHref as Route}>
              <Edit3 className="h-4 w-4" />
              Edit Questions
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportModal({ open: true, format: "pdf" })}
        >
          <FileDown className="h-4 w-4" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportModal({ open: true, format: "docx" })}
        >
          <FileDown className="h-4 w-4" />
          DOCX
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDeleteModalOpen(true)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="প্রশ্নপত্র মুছে ফেলুন"
        message={`আপনি কি নিশ্চিতভাবে "${paperName}" প্রশ্নপত্রটি মুছে ফেলতে চান? এটি মুছে ফেললে আর পুনরুদ্ধার করা যাবে না।`}
        confirmText="মুছে ফেলুন"
        cancelText="বাতিল"
        variant="danger"
        loading={isDeleting}
      />

      <ExportPaperModal
        open={exportModal.open}
        onClose={() => setExportModal((prev) => ({ ...prev, open: false }))}
        paperId={paperId}
        paperName={paperName}
        defaultFormat={exportModal.format}
        activeSet={activeSet}
        userPlan={userPlan}
      />
    </>
  );
}
