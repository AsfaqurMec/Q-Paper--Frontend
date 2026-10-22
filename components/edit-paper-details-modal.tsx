"use client";

import { useEffect, useState } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";
import { toStandardDigits } from "@/lib/utils";
import type { Paper } from "@/lib/api-types";

type EditPaperDetailsModalProps = {
  open: boolean;
  paper: Paper;
  onClose: () => void;
  onSaved: (updatedPaper: Paper) => void;
};

export function EditPaperDetailsModal({ open, paper, onClose, onSaved }: EditPaperDetailsModalProps) {
  const [formData, setFormData] = useState({
    name: paper.name || "",
    subject: paper.subject || "",
    className: paper.className || "",
    institute: paper.institute || "",
    examType: paper.examType || "mcq",
    duration: paper.duration || "45 minutes",
    totalMarks: Number(paper.totalMarks || 30),
    instructions: paper.instructions || "",
    layout: (paper.layout || "split") as "single" | "split",
    cqLayout: (paper.cqLayout || paper.layout || "split") as "single" | "split",
    optionLabelStyle: (paper.optionLabelStyle || "upper-alpha") as Paper["optionLabelStyle"],
    questionsPerPage: Number(paper.questionsPerPage || 10),
    mcqSectionTitle: paper.mcqSectionTitle || "",
    cqSectionTitle: paper.cqSectionTitle || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        name: paper.name || "",
        subject: paper.subject || "",
        className: paper.className || "",
        institute: paper.institute || "",
        examType: paper.examType || "mcq",
        duration: paper.duration || "45 minutes",
        totalMarks: Number(paper.totalMarks || 30),
        instructions: paper.instructions || "",
        layout: (paper.layout || "split") as "single" | "split",
        cqLayout: (paper.cqLayout || paper.layout || "split") as "single" | "split",
        optionLabelStyle: (paper.optionLabelStyle || "upper-alpha") as Paper["optionLabelStyle"],
        questionsPerPage: Number(paper.questionsPerPage || 10),
        mcqSectionTitle: paper.mcqSectionTitle || "",
        cqSectionTitle: paper.cqSectionTitle || ""
      });
      setError(null);
    }
  }, [open, paper]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Paper title is required");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await apiRequest<Paper>(`/api/papers/${paper.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name.trim(),
          subject: formData.subject.trim(),
          className: formData.className.trim(),
          institute: formData.institute.trim(),
          examType: formData.examType,
          duration: formData.duration.trim(),
          totalMarks: Number(toStandardDigits(formData.totalMarks) || 1),
          instructions: formData.instructions.trim(),
          layout: formData.layout,
          cqLayout: formData.cqLayout,
          optionLabelStyle: formData.optionLabelStyle,
          questionsPerPage: Number(formData.questionsPerPage),
          mcqSectionTitle: formData.mcqSectionTitle.trim(),
          cqSectionTitle: formData.cqSectionTitle.trim()
        })
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update paper details");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border bg-card p-4 sm:p-6 shadow-soft my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 sm:pb-4">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">পরীক্ষা ও প্রশ্নপত্রের বিবরণ সম্পাদনা</h2>
              <p className="text-xs text-muted-foreground">মেটাডাটা, লেআউট এবং সাধারণ নির্দেশনা পরিবর্তন করুন</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                প্রশ্নপত্র / পরীক্ষার শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="যেমন: এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট ২০২৬"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                বিষয় *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="যেমন: পদার্থবিজ্ঞান বা Physics"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                শ্রেণি / গ্রেড
              </label>
              <input
                type="text"
                value={formData.className}
                onChange={(e) => setFormData((prev) => ({ ...prev, className: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="যেমন: ৯ম-১০ম শ্রেণি বা Class 10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                প্রতিষ্ঠান / স্কুলের নাম
              </label>
              <input
                type="text"
                value={formData.institute}
                onChange={(e) => setFormData((prev) => ({ ...prev, institute: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="যেমন: ঢাকা রেসিডেন্সিয়াল মডেল কলেজ"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                সময়
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="যেমন: ৪৫ মিনিট বা 45 minutes"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                মোট নম্বর
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.totalMarks}
                onChange={(e) => {
                  const val = toStandardDigits(e.target.value);
                  if (val === "" || /^\d+$/.test(val)) {
                    setFormData((prev) => ({ ...prev, totalMarks: val as any }));
                  }
                }}
                onBlur={() => {
                  const num = parseInt(toStandardDigits(formData.totalMarks), 10);
                  if (isNaN(num) || num <= 0) {
                    setFormData((prev) => ({ ...prev, totalMarks: 30 }));
                  }
                }}
                placeholder="যেমন: ৩০"
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                পৃষ্ঠা লেআউট
              </label>
              <select
                value={formData.layout}
                onChange={(e) => setFormData((prev) => ({ ...prev, layout: e.target.value as "single" | "split" }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="split">২ কলাম (Split - Standard Exam)</option>
                <option value="single">১ কলাম (Single - Full Width)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CQ লেআউট
              </label>
              <select
                value={formData.cqLayout}
                onChange={(e) => setFormData((prev) => ({ ...prev, cqLayout: e.target.value as "single" | "split" }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="split">২ কলাম (Split - 2 Columns)</option>
                <option value="single">১ কলাম (Single - Full Width)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                প্রতি পৃষ্ঠায় প্রশ্ন সংখ্যা
              </label>
              <select
                value={formData.questionsPerPage}
                onChange={(e) => setFormData((prev) => ({ ...prev, questionsPerPage: Number(e.target.value) }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value={0}>স্বয়ংক্রিয় সমন্বয় (Auto Adjust)</option>
                <option value={5}>৫ টি প্রশ্ন</option>
                <option value={8}>৮ টি প্রশ্ন</option>
                <option value={10}>১০ টি প্রশ্ন (প্রস্তাবিত)</option>
                <option value={12}>১২ টি প্রশ্ন</option>
                <option value={15}>১৫ টি প্রশ্ন</option>
                <option value={20}>২০ টি প্রশ্ন</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                বহুনির্বাচনী অপশন ফরম্যাট
              </label>
              <select
                value={formData.optionLabelStyle}
                onChange={(e) => setFormData((prev) => ({ ...prev, optionLabelStyle: e.target.value as Paper["optionLabelStyle"] }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="bangla">(ক), (খ), (গ), (ঘ) — বাংলা NCTB ফরম্যাট</option>
                <option value="upper-alpha">(A), (B), (C), (D) — ইংরেজি বড় হাতের</option>
                <option value="lower-alpha">(a), (b), (c), (d) — ইংরেজি ছোট হাতের</option>
                <option value="numeric">(1), (2), (3), (4) — সংখ্যা</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                MCQ বিভাগের শিরোনাম
              </label>
              <input
                type="text"
                value={formData.mcqSectionTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, mcqSectionTitle: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ডিফল্ট: ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CQ বিভাগের শিরোনাম
              </label>
              <input
                type="text"
                value={formData.cqSectionTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, cqSectionTitle: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ডিফল্ট: খ-বিভাগ: সৃজনশীল প্রশ্ন"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                সাধারণ নির্দেশনা (Instructions)
              </label>
              <textarea
                rows={2}
                value={formData.instructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                className="mt-1 w-full rounded-md border bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="যেমন: সকল প্রশ্নের উত্তর দাও। প্রতিটি প্রশ্নের মান সমান।"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              বাতিল
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
