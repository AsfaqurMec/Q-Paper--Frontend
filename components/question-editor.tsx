"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  FileDown,
  GripVertical,
  ImagePlus,
  Layers,
  Globe,
  Pencil,
  Plus,
  Save,
  Settings2,
  Shuffle,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathTextField } from "@/components/math-text-field";
import { MathRenderer } from "@/components/math-renderer";
import { PaperPreview, type PreviewQuestion } from "@/components/paper-preview";
import { StatusModal } from "@/components/status-modal";
import { ImportFromBankModal } from "@/components/question-bank/import-from-bank-modal";
import { EditPaperDetailsModal } from "@/components/edit-paper-details-modal";
import { McqSetDialog } from "@/components/mcq-set-dialog";
import { ImportImageModal } from "@/components/import-image-modal";
import { apiRequest } from "@/lib/client-api";
import { ExportPaperModal } from "@/components/export-paper-modal";
import { latexToCleanMath } from "@/lib/math-utils";
import { sanitizeSvg } from "@/lib/sanitize";
import { cn, toStandardDigits } from "@/lib/utils";
import type { BankQuestion, Paper } from "@/lib/api-types";
import {
  getBengaliClass,
  getBengaliSubject,
  getBengaliPaperTitle,
  getBengaliExamType,
  formatBengaliDuration,
  toBengaliDigits,
  getBengaliExportFileName
} from "@/lib/curriculum-bengali";

export type DraftQuestion = {
  id: string;
  number?: string;
  type: "mcq" | "cq";
  title: string;
  subtitle: string;
  imageUrl: string;
  marks: number | string;
  explanation: string;
  options: string[];
  correct: number;
  subQuestions: Array<{ id: string; label?: string; text: string; marks: number | string; answer: string; explanation: string }>;
};

const emptyQuestion = (): DraftQuestion => ({
  id: `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  number: "",
  type: "mcq",
  title: "",
  subtitle: "",
  imageUrl: "",
  marks: 1,
  explanation: "",
  options: ["", "", "", ""],
  correct: 0,
  subQuestions: [emptySubQuestion("ক")]
});

const emptySubQuestion = (label?: string) => ({
  id: `sq_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  label: label || "ক",
  text: "",
  marks: 1,
  answer: "",
  explanation: ""
});

function toPreviewQuestion(question: DraftQuestion, optionLabelStyle?: string): PreviewQuestion {
  const isBanglaStyle = optionLabelStyle === "bangla";
  const banglaLetters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
  return {
    id: question.id,
    number: question.number,
    type: question.type,
    title: question.title,
    subtitle: question.subtitle,
    imageUrl: question.imageUrl,
    marks: Number(toStandardDigits(question.marks) || 1),
    options: question.options.map((option, index) => ({
      id: `${question.id}_opt_${index}`,
      label: isBanglaStyle ? (banglaLetters[index] || String.fromCharCode(65 + index)) : String.fromCharCode(65 + index),
      text: option,
      isCorrect: question.correct === index
    })),
    subQuestions: question.subQuestions.map((item, index) => {
      const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ"];
      const fallback = index < banglaLabels.length ? banglaLabels[index] : String.fromCharCode(97 + index);
      return { id: item.id, label: item.label || fallback, text: item.text, marks: Number(toStandardDigits(item.marks) || 1) };
    })
  };
}

export function QuestionEditor({
  paper,
  initialType,
  lockType = false,
  userRole = "user",
  userPlan = "free"
}: {
  paper: Paper;
  initialType?: "mcq" | "cq";
  lockType?: boolean;
  userRole?: "user" | "admin";
  userPlan?: string;
}) {
  const isAdmin = userRole === "admin";
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMounted = useRef(false);

  const [currentPaper, setCurrentPaper] = useState<Paper>(paper);
  const [paperDetailsOpen, setPaperDetailsOpen] = useState(false);
  const [exportModal, setExportModal] = useState<{ open: boolean; format: "pdf" | "docx" }>({
    open: false,
    format: "pdf"
  });

  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    paper.questions.length
      ? paper.questions.map((question) => ({
          id: question.id,
          number: question.number || "",
          type: question.type ?? initialType ?? "mcq",
          title: latexToCleanMath(question.title),
          subtitle: question.subtitle ? latexToCleanMath(question.subtitle) : "",
          imageUrl: question.imageUrl ?? "",
          marks: question.marks,
          explanation: question.explanation ? latexToCleanMath(question.explanation) : "",
          options: question.options.length
            ? question.options.map((option) => latexToCleanMath(option.text))
            : ["", "", "", ""],
          correct: Math.max(question.options.findIndex((option) => option.isCorrect), 0),
          subQuestions: question.subQuestions?.length
            ? question.subQuestions.map((item, index) => {
                const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ"];
                const fallback = index < banglaLabels.length ? banglaLabels[index] : String.fromCharCode(97 + index);
                return {
                  id: item.id,
                  label: item.label || fallback,
                  text: latexToCleanMath(item.text),
                  marks: item.marks,
                  answer: item.answer ? latexToCleanMath(item.answer) : "",
                  explanation: item.explanation ? latexToCleanMath(item.explanation) : ""
                };
              })
            : [emptySubQuestion("ক")]
        }))
      : [{ ...emptyQuestion(), type: initialType ?? "mcq" }]
  );

  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [mobileEditorTab, setMobileEditorTab] = useState<"questions" | "preview">("questions");
  const [status, setStatus] = useState("Draft not saved yet");
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [activePreviewSet, setActivePreviewSet] = useState<string | undefined>(undefined);
  const [previewQuestionsOverride, setPreviewQuestionsOverride] = useState<DraftQuestion[] | null>(null);
  const [savingToBankId, setSavingToBankId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string }>({
    open: false,
    type: "success",
    title: "",
    message: ""
  });
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

  function handleImportFromBank(bankQuestions: BankQuestion[]) {
    if (!bankQuestions.length) return;
    const newQuestions: DraftQuestion[] = bankQuestions.map((bq) => {
      const qType = bq.type === "cq" ? "cq" : "mcq";
      const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ"];
      const subQuestions =
        bq.subQuestions && bq.subQuestions.length > 0
          ? bq.subQuestions.map((item, index) => {
              const fallback = index < banglaLabels.length ? banglaLabels[index] : String.fromCharCode(97 + index);
              return {
                id: item.id || `sq_${Date.now()}_${index}`,
                label: item.label || fallback,
                text: latexToCleanMath(item.text),
                marks: item.marks || (index === 0 ? 1 : index === 1 ? 2 : index === 2 ? 3 : 4),
                answer: item.answer ? latexToCleanMath(item.answer) : "",
                explanation: item.explanation ? latexToCleanMath(item.explanation) : ""
              };
            })
          : [emptySubQuestion("ক")];

      const cqMarks = subQuestions.reduce((sum, sq) => sum + sq.marks, 0);

      return {
        id: `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        number: "",
        type: qType,
        title: latexToCleanMath(bq.title),
        subtitle: bq.subtitle ? latexToCleanMath(bq.subtitle) : "",
        imageUrl: bq.imageUrl || "",
        marks: Number(bq.marks || (qType === "cq" ? cqMarks || 10 : 1)),
        explanation: bq.explanation ? latexToCleanMath(bq.explanation) : "",
        options: bq.options && bq.options.length >= 2 ? bq.options.map(latexToCleanMath) : ["", "", "", ""],
        correct: typeof bq.correctIndex === "number" ? bq.correctIndex : 0,
        subQuestions
      };
    });

    setQuestions((curr) => {
      if (curr.length === 1 && !curr[0].title.trim()) {
        return newQuestions;
      }
      return [...curr, ...newQuestions];
    });
    setBankModalOpen(false);
    setStatus(`${bankQuestions.length} question(s) imported from Question Bank`);
  }

  async function saveToBank(question: DraftQuestion) {
    if (!question.title.trim()) {
      setStatus("Question title is required to save to Question Bank.");
      return;
    }
    const filledOptions = question.options.map((opt) => opt.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      setStatus("At least 2 options required to save to Question Bank.");
      return;
    }

    try {
      setSavingToBankId(question.id);
      setStatus("Saving to Question Bank...");
      await apiRequest("/api/question-bank", {
        method: "POST",
        body: JSON.stringify({
          category: currentPaper.subject || "General",
          difficulty: "medium",
          title: question.title.trim(),
          subtitle: question.subtitle?.trim() || undefined,
          marks: Number(question.marks || 1),
          options: filledOptions,
          correctIndex: Math.min(question.correct, filledOptions.length - 1),
          explanation: question.explanation?.trim() || undefined
        })
      });
      setStatus("Saved to Question Bank!");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save to Question Bank");
    } finally {
      setSavingToBankId(null);
    }
  }

  const previewQuestions = useMemo(
    () => questions.map((q) => toPreviewQuestion(q, currentPaper.optionLabelStyle)),
    [questions, currentPaper.optionLabelStyle]
  );
  const displayedPreviewQuestions = useMemo(() => {
    if (previewQuestionsOverride) {
      return previewQuestionsOverride.map((q) => toPreviewQuestion(q, currentPaper.optionLabelStyle));
    }
    return previewQuestions;
  }, [previewQuestionsOverride, previewQuestions, currentPaper.optionLabelStyle]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveAll({ silent: true });
    }, 10000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [questions]);

  function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateOption(id: string, optionIndex: number, value: string) {
    setQuestions((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              options: item.options.map((option, index) => (index === optionIndex ? value : option))
            }
          : item
      )
    );
  }

  function updateSubQuestion(id: string, subQuestionId: string, patch: Partial<DraftQuestion["subQuestions"][number]>) {
    setQuestions((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              subQuestions: item.subQuestions.map((subQuestion) =>
                subQuestion.id === subQuestionId ? { ...subQuestion, ...patch } : subQuestion
              )
            }
          : item
      )
    );
  }

  function addSubQuestion(id: string) {
    setQuestions((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const count = item.subQuestions.length;
        const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ"];
        const label = count < banglaLabels.length ? banglaLabels[count] : String.fromCharCode(97 + count);
        return { ...item, subQuestions: [...item.subQuestions, emptySubQuestion(label)] };
      })
    );
  }

  function deleteSubQuestion(id: string, subQuestionId: string) {
    setQuestions((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              subQuestions: item.subQuestions.filter((subQuestion) => subQuestion.id !== subQuestionId).length
                ? item.subQuestions.filter((subQuestion) => subQuestion.id !== subQuestionId)
                : [emptySubQuestion()]
            }
          : item
      )
    );
  }

  function addQuestion() {
    const next = { ...emptyQuestion(), type: initialType ?? "mcq" };
    setQuestions((items) => [...items, next]);
    setExpandedIndex(questions.length);
  }

  function deleteQuestion(id: string) {
    setQuestions((items) => {
      const next = items.filter((item) => item.id !== id);
      return next.length ? next : [emptyQuestion()];
    });
    setExpandedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
  }

  function addOption(id: string) {
    setQuestions((items) => items.map((item) => (item.id === id ? { ...item, options: [...item.options, ""] } : item)));
  }

  function removeOption(id: string, optionIndex: number) {
    setQuestions((items) =>
      items.map((item) => {
        if (item.id !== id || item.options.length <= 2) return item;
        const options = item.options.filter((_, index) => index !== optionIndex);
        const correct = item.correct === optionIndex ? 0 : Math.min(item.correct, options.length - 1);
        return { ...item, options, correct };
      })
    );
  }

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function moveQuestion(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= questions.length || toIndex >= questions.length) return;
    setQuestions((items) => {
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setExpandedIndex(toIndex);
  }

  function renumberQuestions(style: "english" | "bangla") {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBangla = (num: number) => num.toString().split("").map((d) => banglaDigits[Number(d)] ?? d).join("");

    setQuestions((items) =>
      items.map((item, index) => ({
        ...item,
        number: style === "bangla" ? toBangla(index + 1) : (index + 1).toString()
      }))
    );
    setStatus(`Renumbered all questions in ${style === "bangla" ? "Bangla (১, ২, ৩...)" : "English (1, 2, 3...)"}`);
  }

  async function handleUpdateOptionLabelStyle(style: Paper["optionLabelStyle"]) {
    try {
      setCurrentPaper((prev) => ({ ...prev, optionLabelStyle: style }));
      setStatus(`MCQ option format set to ${style === "bangla" ? "(ক), (খ), (গ), (ঘ)" : "(A), (B), (C), (D)"}`);
      await apiRequest(`/api/papers/${currentPaper.id}`, {
        method: "PUT",
        body: JSON.stringify({ optionLabelStyle: style })
      });
    } catch {
      // Local state is already updated
    }
  }

  function handleQuickShuffleToolbar() {
    const mcqs = questions.filter((q) => (q.type || "mcq") === "mcq");
    const cqs = questions.filter((q) => q.type === "cq");
    if (mcqs.length < 2) {
      setStatus("At least 2 MCQ questions are required to shuffle.");
      return;
    }

    const isBangla = /[\u0980-\u09FF]/.test(currentPaper.name + currentPaper.subject);
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBangla = (num: number) => num.toString().split("").map((d) => banglaDigits[Number(d)] ?? d).join("");

    const shuffled = [...mcqs].sort(() => Math.random() - 0.5);
    const numbered = shuffled.map((q, idx) => ({
      ...q,
      number: isBangla ? toBangla(idx + 1) : String(idx + 1)
    }));

    const result = [...numbered, ...cqs];
    setQuestions(result);
    setPreviewQuestionsOverride(null);
    setActivePreviewSet(undefined);
    void saveAll({ silent: false, questionsOverride: result });
    setStatus("MCQ questions shuffled and saved!");
  }

  async function saveAll(options: { silent?: boolean; questionsOverride?: DraftQuestion[] } = {}) {
    try {
      setStatus(options.silent ? "Autosaving draft..." : "Saving all questions...");
      const sourceQuestions = options.questionsOverride ?? questions;
      const validQuestions = sourceQuestions.filter((question) => question.title.trim());
      if (!validQuestions.length) throw new Error("Add at least one question title before saving.");

      await apiRequest<Paper>(`/api/papers/${currentPaper.id}/questions`, {
        method: "PUT",
        body: JSON.stringify({
          questions: validQuestions.map((question) => ({
            id: question.id,
            number: question.number && question.number.trim() ? question.number.trim() : undefined,
            title: question.title,
            subtitle: question.subtitle || undefined,
            imageUrl: question.imageUrl || undefined,
            marks: Number(toStandardDigits(question.marks) || 1),
            explanation: question.explanation || undefined,
            type: question.type,
            options:
              question.type === "mcq"
                ? (question.options || []).map((option, index) => {
                    const optText = typeof option === "string" ? option : ((option as any)?.text || `Option ${String.fromCharCode(65 + index)}`);
                    const isBanglaStyle = currentPaper.optionLabelStyle === "bangla";
                    const banglaLetters = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
                    const label = isBanglaStyle ? (banglaLetters[index] || String.fromCharCode(65 + index)) : String.fromCharCode(65 + index);
                    return {
                      id: `${question.id}_opt_${index}`,
                      label,
                      text: optText || `Option ${label}`,
                      isCorrect: question.correct === index
                    };
                  })
                : [],
            subQuestions:
              question.type === "cq"
                ? (question.subQuestions || [])
                    .filter((item) => item.text.trim())
                    .map((item) => ({
                      id: item.id,
                      label: item.label,
                      text: item.text,
                      marks: Number(toStandardDigits(item.marks) || 1),
                      answer: item.answer || undefined,
                      explanation: item.explanation || undefined
                    }))
                : undefined
          }))
        })
      });
      setStatus(`${validQuestions.length} question(s) saved`);
      if (!options.silent) {
        setModal({
          open: true,
          type: "success",
          title: "Questions saved",
          message: "Your full question paper has been saved successfully. You can download the paper now."
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save questions";
      setStatus(options.silent ? `Autosave skipped: ${message}` : message);
      if (!options.silent) setModal({ open: true, type: "error", title: "Save failed", message });
    }
  }

  async function handleUpdateSectionTitle(type: "mcq" | "cq", newTitle: string) {
    const trimmed = newTitle.trim();
    const patch = type === "mcq" ? { mcqSectionTitle: trimmed } : { cqSectionTitle: trimmed };
    setCurrentPaper((prev) => ({ ...prev, ...patch }));
    try {
      await apiRequest<Paper>(`/api/papers/${currentPaper.id}`, {
        method: "PUT",
        body: JSON.stringify(patch)
      });
      setStatus(`Saved ${type.toUpperCase()} section heading`);
    } catch (err) {
      console.error("Failed to update section heading:", err);
    }
  }

  async function uploadQuestionImage(questionId: string, file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setStatus("Image must be 10MB or smaller.");
      return;
    }
    try {
      setStatus("Uploading question image...");
      const imageData = await fileToDataUrl(file);
      try {
        const upload = await apiRequest<{ imageUrl: string }>("/api/uploads/image", {
          method: "POST",
          body: JSON.stringify({ folder: "questions", fileName: file.name, imageData })
        });
        if (upload?.imageUrl) {
          updateQuestion(questionId, { imageUrl: upload.imageUrl });
          setStatus("Question image uploaded");
          return;
        }
      } catch (uploadErr) {
        console.warn("[QuestionEditor] Upload API failed, falling back to data URL:", uploadErr);
      }
      // Fallback: attach data URL directly
      updateQuestion(questionId, { imageUrl: imageData });
      setStatus("Question image attached");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image upload failed");
    }
  }

  async function exportPaper(format: "pdf" | "docx") {
    let interval: any = null;
    try {
      setStatus(`Saving latest questions before ${format.toUpperCase()} export (10%)...`);
      await saveAll({ silent: true });
      setStatus(`Preparing ${format.toUpperCase()} download (20%)...`);

      let progress = 20;
      interval = setInterval(() => {
        if (progress < 85) {
          progress += Math.max(1, Math.round((85 - progress) * 0.12));
          setStatus(`Compiling ${format.toUpperCase()} document (${progress}%)...`);
        }
      }, 200);

      const setQuery = activePreviewSet ? `?set=${activePreviewSet}` : "";
      const response = await fetch(`/api/backend/papers/${currentPaper.id}/export/${format}${setQuery}`);
      if (!response.ok) {
        if (interval) clearInterval(interval);
        const errJson = await response.json().catch(() => null);
        throw new Error(
          errJson?.message ||
            (response.status === 403
              ? "DOCX export is only available in the Ultra package (৳1,000/mo). Please upgrade to Ultra."
              : `Export failed (${response.status})`)
        );
      }
      if (interval) clearInterval(interval);
      setStatus(`Downloading ${format.toUpperCase()} to browser (95%)...`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;

      let downloadFileName = "";
      const disposition = response.headers.get("content-disposition");
      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match && utf8Match[1]) {
          try {
            downloadFileName = decodeURIComponent(utf8Match[1]);
          } catch {}
        }
        if (!downloadFileName) {
          const regularMatch = disposition.match(/filename="?([^";]+)"?/i);
          if (regularMatch && regularMatch[1]) {
            downloadFileName = regularMatch[1];
          }
        }
      }
      if (!downloadFileName) {
        downloadFileName = getBengaliExportFileName({
          paperName: currentPaper.name,
          className: currentPaper.className,
          subject: currentPaper.subject,
          format,
          setName: activePreviewSet
        });
      }

      anchor.download = downloadFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus(`${format.toUpperCase()} downloaded successfully (100%)!`);
    } catch (error) {
      if (interval) clearInterval(interval);
      setStatus(error instanceof Error ? error.message : "Export failed");
    } finally {
      if (interval) clearInterval(interval);
    }
  }

  function handleSelectPreviewSet(sKey: "A" | "B" | "C" | "D") {
    const mcqs = questions.filter((q) => (q.type || "mcq") === "mcq");
    const cqs = questions.filter((q) => q.type === "cq");
    const isBangla =
      /[\u0980-\u09FF]/.test(currentPaper.name + currentPaper.subject) ||
      !currentPaper.subject?.toLowerCase().includes("english");
    const toBn = (n: number) =>
      n
        .toString()
        .replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][Number(d)]);

    let shuffledMcqs: DraftQuestion[];
    if (sKey === "A") {
      shuffledMcqs = [...mcqs];
    } else {
      let seed = 0;
      const seedStr = `${currentPaper.id}_set_${sKey}`;
      for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
      const pseudoRand = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      shuffledMcqs = [...mcqs];
      for (let i = shuffledMcqs.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRand() * (i + 1));
        [shuffledMcqs[i], shuffledMcqs[j]] = [shuffledMcqs[j], shuffledMcqs[i]];
      }
    }

    const numberedMcqs = shuffledMcqs.map((q, idx) => ({
      ...q,
      number: isBangla ? toBn(idx + 1) : String(idx + 1)
    }));

    const fullSet = [...numberedMcqs, ...cqs];
    const banglaMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
    setActivePreviewSet(sKey);
    setPreviewQuestionsOverride(fullSet);
    setStatus(`Previewing Set ${sKey} (${banglaMap[sKey]})`);
  }

  // User View: Single Layout (Just the Preview with Important Details & Edit Paper Modal on Top)
  if (!isAdmin) {
    const mcqCount = questions.filter((q) => (q.type || "mcq") === "mcq").length;
    const cqCount = questions.filter((q) => q.type === "cq").length;

    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {/* Top Header Card: Few Important Details & Action Controls */}
        <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5 shadow-soft">
          {/* Top row: Back Navigation, Status & Edit Paper Button */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href={`/dashboard/papers/${currentPaper.id}/import-questions`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Import or type</span>
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <div className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hidden sm:block">
                {status}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPaperDetailsOpen(true)}
                className="gap-1.5 font-semibold shadow-xs"
                title="Edit paper details, layout, questions per page, headings, and instructions"
              >
                <Settings2 className="h-4 w-4" />
                Edit paper
              </Button>
            </div>
          </div>

          {/* Middle row: Paper Title & Few Important Details */}
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase text-primary">
                  {getBengaliExamType(currentPaper.examType)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {currentPaper.layout === "split" ? "২ কলাম (স্প্লিট)" : "১ কলাম (একক)"}
                </span>
              </div>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {getBengaliPaperTitle(currentPaper.name, currentPaper.className, currentPaper.subject)}
              </h1>
            </div>

            {/* Few Important Details Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="rounded-md border bg-muted/30 px-3 py-1.5">
                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">বিষয় ও শ্রেণি</span>
                <span className="font-semibold text-foreground">{getBengaliSubject(currentPaper.subject)} • {getBengaliClass(currentPaper.className)}</span>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-1.5">
                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">পূর্ণমান ও সময়</span>
                <span className="font-semibold text-foreground">পূর্ণমান: {toBengaliDigits(currentPaper.totalMarks)} • {formatBengaliDuration(currentPaper.duration)}</span>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-1.5">
                <span className="text-muted-foreground block text-[10px] font-semibold uppercase">মোট প্রশ্ন</span>
                <span className="font-semibold text-foreground">
                  {toBengaliDigits(questions.length)}টি (বহুনির্বাচনী {toBengaliDigits(mcqCount)}টি{cqCount > 0 ? `, সৃজনশীল ${toBengaliDigits(cqCount)}টি` : ""})
                </span>
              </div>
              {currentPaper.institute && (
                <div className="rounded-md border bg-muted/30 px-3 py-1.5">
                  <span className="text-muted-foreground block text-[10px] font-semibold uppercase">প্রতিষ্ঠান</span>
                  <span className="font-semibold text-foreground truncate max-w-[160px] block" title={currentPaper.institute}>
                    {currentPaper.institute}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: Action Toolbar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
                <span className="px-1.5 text-xs font-semibold text-muted-foreground">Set:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePreviewSet(undefined);
                    setPreviewQuestionsOverride(null);
                    setStatus("Viewing Base Questions");
                  }}
                  className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                    !activePreviewSet
                      ? "bg-background text-teal-800 shadow-2xs border border-teal-300 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="View original base questions"
                >
                  Base
                </button>
                {(["A", "B", "C", "D"] as const).map((sKey) => {
                  const banglaMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
                  const label = `${sKey} (${banglaMap[sKey]})`;
                  const isSelected = activePreviewSet === sKey;
                  return (
                    <button
                      key={sKey}
                      type="button"
                      onClick={() => handleSelectPreviewSet(sKey)}
                      className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-teal-600 text-white shadow-2xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={`Switch preview to Set ${sKey} (${banglaMap[sKey]})`}
                    >
                      {label}
                    </button>
                  );
                })}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSetModalOpen(true)}
                  className="h-6 px-1.5 text-xs text-teal-700 hover:text-teal-900 ml-0.5"
                  title="Open Set Manager, OMR Answer Key & Batch Export"
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden md:inline">Matrix & Exports</span>
                </Button>
              </div>

              <div className="flex items-center gap-1 border-l pl-2">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Renumber:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => renumberQuestions("english")}
                  title="Renumber all questions sequentially in English (1, 2, 3...)"
                  className="text-xs h-8 px-2.5 font-bold"
                >
                  123
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => renumberQuestions("bangla")}
                  title="Renumber all questions sequentially in Bangla (১, ২, ৩...)"
                  className="text-xs h-8 px-2.5 font-bold"
                >
                  ১২৩
                </Button>
              </div>

              <div className="flex items-center gap-1 border-l pl-2">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Options:</span>
                <Button
                  size="sm"
                  variant={currentPaper.optionLabelStyle === "bangla" ? "primary" : "outline"}
                  onClick={() => handleUpdateOptionLabelStyle("bangla")}
                  title="MCQ Option Style: (ক), (খ), (গ), (ঘ) — Bangla NCTB Standard"
                  className="text-xs h-8 px-2.5 font-bold"
                >
                  কখগঘ
                </Button>
                <Button
                  size="sm"
                  variant={currentPaper.optionLabelStyle !== "bangla" ? "primary" : "outline"}
                  onClick={() => handleUpdateOptionLabelStyle("upper-alpha")}
                  title="MCQ Option Style: (A), (B), (C), (D) — English Standard"
                  className="text-xs h-8 px-2.5 font-bold"
                >
                  ABCD
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickShuffleToolbar}
                className="gap-1.5 text-xs h-8"
                title="Instantly randomize MCQ order and renumber sequentially"
              >
                <Shuffle className="h-3.5 w-3.5 text-amber-600" />
                Shuffle MCQs
              </Button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button variant="outline" size="sm" onClick={() => setExportModal({ open: true, format: "pdf" })} className="gap-1">
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportModal({ open: true, format: "docx" })}
                className="gap-1"
                title="DOCX export is available in the Ultra package (৳1,000/mo)"
              >
                <FileDown className="h-4 w-4" />
                DOCX (Ultra)
              </Button>
            </div>
          </div>
        </div>

        {/* Paper Preview: Single Layout, Full Width */}
        <div className="w-full">
          {activePreviewSet && (
            <div className="mb-2 flex items-center justify-between rounded-md border border-teal-200 bg-teal-50/90 px-3 py-1.5 text-xs text-teal-900 shadow-2xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Shuffle className="h-3.5 w-3.5 text-teal-600" />
                <span>
                  Previewing: <strong>Set {activePreviewSet}</strong>
                  {previewQuestionsOverride && " (Temporary preview)"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActivePreviewSet(undefined);
                  setPreviewQuestionsOverride(null);
                }}
                className="font-semibold text-teal-700 underline hover:text-teal-900 text-[11px]"
              >
                Reset to Base
              </button>
            </div>
          )}

          <PaperPreview
            paper={currentPaper}
            questions={displayedPreviewQuestions}
            layout={currentPaper.layout}
            cqLayout={currentPaper.cqLayout}
            questionsPerPage={currentPaper.questionsPerPage}
            activeSet={activePreviewSet}
            onMoveQuestion={moveQuestion}
            onUpdateQuestionSerial={(qId, newSerial) => updateQuestion(qId, { number: newSerial })}
          />
        </div>

        {/* Modals */}
        <StatusModal
          open={modal.open}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => setModal((value) => ({ ...value, open: false }))}
          onDownloadPdf={() => exportPaper("pdf")}
          onDownloadDocx={() => exportPaper("docx")}
        />

        <McqSetDialog
          open={setModalOpen}
          onClose={() => setSetModalOpen(false)}
          paper={currentPaper}
          questions={questions}
          onSaveBeforeExport={async () => {
            await saveAll({ silent: true });
          }}
          onApplySet={async (shuffled, setName) => {
            setQuestions(shuffled);
            setPreviewQuestionsOverride(null);
            setActivePreviewSet(setName);
            setCurrentPaper((prev) => ({ ...prev, setName }));
            try {
              await apiRequest<Paper>(`/api/papers/${currentPaper.id}`, {
                method: "PUT",
                body: JSON.stringify({ setName })
              });
            } catch (e) {
              console.error("Failed to update setName on paper:", e);
            }
            void saveAll({ silent: false, questionsOverride: shuffled });
            setStatus(setName ? `Applied Set ${setName} to questions and saved!` : "Shuffled MCQs applied and saved!");
          }}
          onPreviewSet={(setName, shuffled) => {
            setActivePreviewSet(setName);
            setPreviewQuestionsOverride(shuffled);
            setStatus(`Previewing Set ${setName}`);
          }}
        />

        <EditPaperDetailsModal
          open={paperDetailsOpen}
          paper={currentPaper}
          onClose={() => setPaperDetailsOpen(false)}
          onSaved={(updated) => {
            setCurrentPaper(updated);
            setStatus("Paper details updated");
          }}
        />
      </div>
    );
  }

  // Admin View: 2-Column Grid Layout (Question Editor + Live Paper Preview)
  return (
    <div className="space-y-4">
      {/* Mobile/Tablet View Toggle (visible on < xl screens) */}
      <div className="flex xl:hidden items-center p-1 rounded-lg border border-border bg-muted/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileEditorTab("questions")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
            mobileEditorTab === "questions"
              ? "bg-card text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Pencil className="h-3.5 w-3.5 text-primary" />
          <span>প্রশ্ন সম্পাদনা ({questions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileEditorTab("preview")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
            mobileEditorTab === "preview"
              ? "bg-card text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5 text-teal-600" />
          <span>লাইভ প্রিভিউ (Paper Preview)</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[560px_1fr]">
        <div className={cn("space-y-4", mobileEditorTab === "preview" ? "hidden xl:block" : "block")}>
        {/* Header card with metadata & actions */}
        <div className="rounded-lg border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link href={`/dashboard/papers/${currentPaper.id}/import-questions`}>
                <ArrowLeft className="h-4 w-4" />
                Import or type
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaperDetailsOpen(true)}
              className="gap-1.5 font-semibold text-primary"
              title="Edit paper details, layout, questions per page, and MCQ / CQ section headings"
            >
              <Settings2 className="h-4 w-4 text-primary" />
              Edit paper
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {isAdmin ? "প্রশ্ন সম্পাদক (Question Editor)" : "প্রশ্নপত্রের বিবরণ (Paper Details)"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {getBengaliPaperTitle(currentPaper.name, currentPaper.className, currentPaper.subject)}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{getBengaliSubject(currentPaper.subject)}</span>
                <span>•</span>
                <span>{getBengaliClass(currentPaper.className)}</span>
                <span>•</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase text-[10px]">
                  {currentPaper.layout === "split" ? "২ কলাম (স্প্লিট)" : "১ কলাম (একক)"}{currentPaper.cqLayout && currentPaper.cqLayout !== currentPaper.layout ? ` (CQ: ${currentPaper.cqLayout === "split" ? "২ কলাম" : "১ কলাম"})` : ""}
                </span>
                <span>•</span>
                <span>সময়: {formatBengaliDuration(currentPaper.duration)}</span>
                <span>•</span>
                <span>পূর্ণমান: {toBengaliDigits(currentPaper.totalMarks)}</span>
                {(currentPaper.mcqSectionTitle || currentPaper.cqSectionTitle) && (
                  <>
                    <span>•</span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary text-[11px]">
                      {currentPaper.mcqSectionTitle ? `MCQ: ${currentPaper.mcqSectionTitle}` : ""}
                      {currentPaper.mcqSectionTitle && currentPaper.cqSectionTitle ? " | " : ""}
                      {currentPaper.cqSectionTitle ? `CQ: ${currentPaper.cqSectionTitle}` : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
              {status}
            </div>
          </div>

          {/* Action toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => saveAll()} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  Save Questions
                </Button>
                <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBankModalOpen(true)} className="gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Question Bank
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickShuffleToolbar}
              className="gap-1.5"
              title="Instantly randomize MCQ order and renumber sequentially"
            >
              <Shuffle className="h-4 w-4 text-amber-600" />
              Shuffle MCQs
            </Button>
            <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
              <span className="px-1.5 text-xs font-semibold text-muted-foreground">Set:</span>
              <button
                type="button"
                onClick={() => {
                  setActivePreviewSet(undefined);
                  setPreviewQuestionsOverride(null);
                  setStatus("Viewing Base Questions");
                }}
                className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  !activePreviewSet
                    ? "bg-background text-teal-800 shadow-2xs border border-teal-300 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="View original base questions"
              >
                Base
              </button>
              {(["A", "B", "C", "D"] as const).map((sKey) => {
                const banglaMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
                const label = `${sKey} (${banglaMap[sKey]})`;
                const isSelected = activePreviewSet === sKey;
                return (
                  <button
                    key={sKey}
                    type="button"
                    onClick={() => handleSelectPreviewSet(sKey)}
                    className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-teal-600 text-white shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={`Switch preview to Set ${sKey} (${banglaMap[sKey]})`}
                  >
                    {label}
                  </button>
                );
              })}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSetModalOpen(true)}
                className="h-6 px-1.5 text-xs text-teal-700 hover:text-teal-900 ml-0.5"
                title="Open Set Manager, OMR Answer Key & Batch Export"
              >
                <Layers className="h-3.5 w-3.5 mr-1" />
                <span className="hidden md:inline">Matrix & Exports</span>
              </Button>
            </div>
            <div className="flex items-center gap-1 border-l pl-2">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Renumber:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => renumberQuestions("english")}
                title="Renumber all questions sequentially in English (1, 2, 3...)"
                className="text-xs h-8 px-2.5 font-bold"
              >
                123
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => renumberQuestions("bangla")}
                title="Renumber all questions sequentially in Bangla (১, ২, ৩...)"
                className="text-xs h-8 px-2.5 font-bold"
              >
                ১২৩
              </Button>
            </div>
            <div className="flex items-center gap-1 border-l pl-2">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Options:</span>
              <Button
                size="sm"
                variant={currentPaper.optionLabelStyle === "bangla" ? "primary" : "outline"}
                onClick={() => handleUpdateOptionLabelStyle("bangla")}
                title="MCQ Option Style: (ক), (খ), (গ), (ঘ) — Bangla NCTB Standard"
                className="text-xs h-8 px-2.5 font-bold"
              >
                কখগঘ
              </Button>
              <Button
                size="sm"
                variant={currentPaper.optionLabelStyle !== "bangla" ? "primary" : "outline"}
                onClick={() => handleUpdateOptionLabelStyle("upper-alpha")}
                title="MCQ Option Style: (A), (B), (C), (D) — English Standard"
                className="text-xs h-8 px-2.5 font-bold"
              >
                ABCD
              </Button>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setExportModal({ open: true, format: "pdf" })} className="gap-1">
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportModal({ open: true, format: "docx" })}
                className="gap-1"
                title="DOCX export is available in the Ultra package (৳1,000/mo)"
              >
                <FileDown className="h-4 w-4" />
                DOCX (Ultra)
              </Button>
            </div>
          </div>
        </div>

        {/* Questions In-Place Accordion List */}
        <div className="space-y-3">
          {questions.map((question, index) => {
            const isExpanded = expandedIndex === index;
            const isFirstMcq = (question.type || "mcq") === "mcq" && (index === 0 || questions.slice(0, index).every((q) => q.type !== "mcq"));
            const isFirstCq = question.type === "cq" && (index === 0 || questions.slice(0, index).every((q) => q.type !== "cq"));
            const hasBoth = questions.some((q) => (q.type || "mcq") === "mcq") && questions.some((q) => q.type === "cq");

            return (
              <Fragment key={question.id}>
                {isFirstMcq && (
                  <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-3 shadow-2xs">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-teal-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                          MCQ সেকশন
                        </span>
                        <span className="text-xs font-semibold text-teal-900">শিরোনাম সম্পাদনা:</span>
                      </div>
                      <input
                        type="text"
                        value={currentPaper.mcqSectionTitle ?? ""}
                        onChange={(e) => setCurrentPaper((prev) => ({ ...prev, mcqSectionTitle: e.target.value }))}
                        onBlur={(e) => handleUpdateSectionTitle("mcq", e.target.value)}
                        placeholder={hasBoth ? "ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন" : "বহু-নির্বাচনী প্রশ্ন"}
                        className="h-8 flex-1 sm:max-w-md rounded-md border border-teal-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        title="MCQ সেকশনের শিরোনাম পরিবর্তন করতে এখানে টাইপ করুন (Live Preview-তে সাথে সাথে আপডেট হবে)"
                      />
                    </div>
                  </div>
                )}

                {isFirstCq && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-3 shadow-2xs mt-4">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                          CQ সেকশন
                        </span>
                        <span className="text-xs font-semibold text-indigo-900">শিরোনাম সম্পাদনা:</span>
                      </div>
                      <input
                        type="text"
                        value={currentPaper.cqSectionTitle ?? ""}
                        onChange={(e) => setCurrentPaper((prev) => ({ ...prev, cqSectionTitle: e.target.value }))}
                        onBlur={(e) => handleUpdateSectionTitle("cq", e.target.value)}
                        placeholder={hasBoth ? "খ-বিভাগ: সৃজনশীল প্রশ্ন" : "সৃজনশীল প্রশ্ন"}
                        className="h-8 flex-1 sm:max-w-md rounded-md border border-indigo-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="CQ সেকশনের শিরোনাম পরিবর্তন করতে এখানে টাইপ করুন (Live Preview-তে সাথে সাথে আপডেট হবে)"
                      />
                    </div>
                  </div>
                )}

                <Card
                  className={`transition-all duration-200 ${
                    isExpanded ? "border-primary shadow-soft ring-1 ring-primary/20" : "hover:border-slate-300"
                  }`}
                >
                {/* Accordion Header Row */}
                <div
                  draggable
                  onDragStart={(e) => {
                    setDraggedIndex(index);
                    e.dataTransfer.setData("text/plain", index.toString());
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverIndex !== index) {
                      setDragOverIndex(index);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData("text/plain"));
                    if (!isNaN(fromIdx) && fromIdx !== index) {
                      moveQuestion(fromIdx, index);
                    }
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className={`flex cursor-pointer items-center justify-between p-3 select-none hover:bg-muted/30 transition-colors ${
                    dragOverIndex === index ? "border-t-2 border-t-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 mr-2">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground rounded"
                      title="Drag and drop to reorder questions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Question Serial Input (Click to change serial) */}
                    <input
                      type="text"
                      value={question.number ?? (index + 1).toString()}
                      title="Question serial (Click to edit e.g. 1, ১, Q1)"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateQuestion(question.id, { number: e.target.value });
                      }}
                      className="h-7 w-9 shrink-0 rounded border border-input bg-background text-center text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs hover:border-primary/50 transition-colors"
                    />

                    {/* Up / Down Move buttons */}
                    <div className="flex flex-col -space-y-1 mr-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveQuestion(index, index - 1)}
                        title="Move question up"
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === questions.length - 1}
                        onClick={() => moveQuestion(index, index + 1)}
                        title="Move question down"
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="truncate text-sm font-medium">
                      {question.title ? (
                        <MathRenderer text={question.title} />
                      ) : (
                        <span className="italic text-muted-foreground">Untitled question</span>
                      )}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {question.marks || 1} mark{Number(question.marks || 1) === 1 ? "" : "s"}
                    </span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      {question.type}
                    </span>
                    <div className="p-0.5 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* In-Place Expanded Form directly below this question */}
                {isExpanded && (
                  <CardContent className="border-t p-4 space-y-4 bg-card">
                    {/* Top Row: Type switcher & quick actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      {!lockType ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant={question.type === "mcq" ? "primary" : "outline"}
                            onClick={() => updateQuestion(question.id, { type: "mcq" })}
                          >
                            MCQ
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={question.type === "cq" ? "primary" : "outline"}
                            onClick={() => updateQuestion(question.id, { type: "cq" })}
                          >
                            CQ
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {question.type.toUpperCase()} Question
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => saveToBank(question)}
                          disabled={savingToBankId === question.id}
                          title="Save this question to Question Bank for future reuse"
                          className="gap-1"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {savingToBankId === question.id ? "Saving..." : "Save to Bank"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Delete question"
                          onClick={() => deleteQuestion(question.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Serial & Question Title Row */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-24 shrink-0">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Serial / No.
                        </label>
                        <input
                          type="text"
                          value={question.number ?? (index + 1).toString()}
                          onChange={(e) => updateQuestion(question.id, { number: e.target.value })}
                          placeholder="e.g. 1, ১"
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm font-semibold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Question Title *
                        </label>
                        <MathTextField
                          value={question.title}
                          onChange={(value) => updateQuestion(question.id, { title: value })}
                          placeholder="Write the question title (e.g. What is kinetic energy ½mv²?)"
                        />
                      </div>
                    </div>

                    {/* Optional Image */}
                    <div className="rounded-md border p-3 bg-background/50">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Question Image (Optional)</p>
                          <p className="text-[11px] text-muted-foreground">Add a diagram, formula figure, or geometry graph</p>
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
                              onChange={(event) => uploadQuestionImage(question.id, event.target.files?.[0])}
                            />
                          </label>
                        </div>
                      </div>
                      {question.imageUrl && (
                        <div className="mt-2.5 flex items-start gap-3">
                          {question.imageUrl.trim().startsWith("<svg") ? (
                            <div
                              className="h-20 w-28 rounded-md border overflow-hidden flex items-center justify-center bg-white p-1 [&>svg]:max-h-full [&>svg]:w-auto shrink-0"
                              dangerouslySetInnerHTML={{ __html: sanitizeSvg(question.imageUrl) }}
                            />
                          ) : (
                            <img src={question.imageUrl} alt="" className="h-20 w-28 rounded-md border object-contain bg-white shrink-0" />
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
                              onClick={() => updateQuestion(question.id, { imageUrl: "" })}
                              className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 justify-start"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subtitle & Marks */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Subtitle / Context (Optional)
                        </label>
                        <MathTextField
                          value={question.subtitle}
                          onChange={(value) => updateQuestion(question.id, { subtitle: value })}
                          placeholder="Optional stem or context"
                          compact
                          label="Subtitle"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Marks
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={question.marks ?? ""}
                          onChange={(event) => {
                            const val = toStandardDigits(event.target.value);
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                              updateQuestion(question.id, { marks: val });
                            }
                          }}
                          onBlur={() => {
                            const num = parseFloat(toStandardDigits(question.marks));
                            updateQuestion(question.id, { marks: isNaN(num) || num <= 0 ? 1 : num });
                          }}
                          placeholder="1"
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* MCQ Options vs CQ Sub-questions */}
                    {question.type === "mcq" ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Options (Click circle to select correct answer)
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                              className="h-7 text-xs gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add option
                            </Button>
                          </div>
                          {question.options.map((option, optIdx) => (
                            <div key={`${question.id}-${optIdx}`} className="flex gap-2 items-center">
                              <button
                                type="button"
                                title="Set as correct answer"
                                onClick={() => updateQuestion(question.id, { correct: optIdx })}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                  question.correct === optIdx
                                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                    : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {question.correct === optIdx ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  currentPaper.optionLabelStyle === "bangla"
                                    ? ["ক", "খ", "গ", "ঘ", "ঙ", "চ"][optIdx] || String.fromCharCode(65 + optIdx)
                                    : String.fromCharCode(65 + optIdx)
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <MathTextField
                                  value={option}
                                  onChange={(value) => updateOption(question.id, optIdx, value)}
                                  placeholder={
                                    currentPaper.optionLabelStyle === "bangla"
                                      ? `অপশন (${["ক", "খ", "গ", "ঘ", "ঙ", "চ"][optIdx] || optIdx + 1})`
                                      : `Option ${String.fromCharCode(65 + optIdx)}`
                                  }
                                  compact
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Remove option"
                                disabled={question.options.length <= 2}
                                onClick={() => removeOption(question.id, optIdx)}
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            Explanation (Optional)
                          </label>
                          <MathTextField
                            value={question.explanation}
                            onChange={(value) => updateQuestion(question.id, { explanation: value })}
                            placeholder="Optional explanation for the correct answer"
                            minRows={2}
                            label="Explanation"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 rounded-md border p-3 bg-background/40">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              CQ Sub-questions
                            </p>
                            <p className="text-[11px] text-muted-foreground">Each creative question part with answer</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSubQuestion(question.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Part
                          </Button>
                        </div>
                        {question.subQuestions.map((item, subIdx) => (
                          <div key={item.id} className="space-y-2 rounded-md border bg-background p-3 shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  value={item.label ?? ""}
                                  onChange={(e) => updateSubQuestion(question.id, item.id, { label: e.target.value })}
                                  className="h-7 w-12 rounded border bg-background text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Part"
                                />
                                <p className="text-xs font-medium">Part {item.label || String.fromCharCode(97 + subIdx)}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Delete CQ part"
                                onClick={() => deleteSubQuestion(question.id, item.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <MathTextField
                              value={item.text}
                              onChange={(val) => updateSubQuestion(question.id, item.id, { text: val })}
                              placeholder="Write CQ sub-question"
                            />
                            <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.marks ?? ""}
                                onChange={(event) => {
                                  const val = toStandardDigits(event.target.value);
                                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                    updateSubQuestion(question.id, item.id, { marks: val });
                                  }
                                }}
                                onBlur={() => {
                                  const num = parseFloat(toStandardDigits(item.marks));
                                  updateSubQuestion(question.id, item.id, { marks: isNaN(num) || num <= 0 ? 1 : num });
                                }}
                                className="h-9 rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Marks"
                              />
                              <MathTextField
                                value={item.answer}
                                onChange={(val) => updateSubQuestion(question.id, item.id, { answer: val })}
                                placeholder="Answer"
                                compact
                                label="Answer"
                              />
                            </div>
                            <MathTextField
                              value={item.explanation}
                              onChange={(val) => updateSubQuestion(question.id, item.id, { explanation: val })}
                              placeholder="Explanation"
                              compact
                              minRows={2}
                              label="Explanation"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom Save bar inside expanded card */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveAll()}
                        className="gap-1.5"
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedIndex(null)}
                        className="text-xs text-muted-foreground"
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Fragment>
          );
        })}
        </div>

        {/* Add Question Card at end of list */}
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5 border-dashed">
            <Plus className="h-4 w-4" />
            Add Another Question
          </Button>
        </div>
      </div>

      {/* Right Column: Live Paper Preview */}
      <div className={cn(
        "xl:sticky xl:top-0 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto custom-scrollbar pr-1",
        mobileEditorTab === "questions" ? "hidden xl:block" : "block"
      )}>
        {activePreviewSet && (
          <div className="mb-2 flex items-center justify-between rounded-md border border-teal-200 bg-teal-50/90 px-3 py-1.5 text-xs text-teal-900 shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Shuffle className="h-3.5 w-3.5 text-teal-600" />
              <span>
                Previewing: <strong>Set {activePreviewSet}</strong>
                {previewQuestionsOverride && " (Temporary preview)"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setActivePreviewSet(undefined);
                setPreviewQuestionsOverride(null);
              }}
              className="font-semibold text-teal-700 underline hover:text-teal-900 text-[11px]"
            >
              Reset to Base
            </button>
          </div>
        )}
        <PaperPreview
          paper={currentPaper}
          questions={displayedPreviewQuestions}
          layout={currentPaper.layout}
          cqLayout={currentPaper.cqLayout}
          questionsPerPage={currentPaper.questionsPerPage}
          activeSet={activePreviewSet}
          onMoveQuestion={moveQuestion}
          onUpdateQuestionSerial={(qId, newSerial) => updateQuestion(qId, { number: newSerial })}
        />
      </div>
    </div>

      {/* Status Modal for Save / Export */}
      <StatusModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal((value) => ({ ...value, open: false }))}
        onDownloadPdf={() => setExportModal({ open: true, format: "pdf" })}
        onDownloadDocx={() => setExportModal({ open: true, format: "docx" })}
      />

      {/* Export Paper Modal (With / Without Answer & Format Selection) */}
      <ExportPaperModal
        open={exportModal.open}
        onClose={() => setExportModal((prev) => ({ ...prev, open: false }))}
        paperId={currentPaper.id}
        paperName={getBengaliPaperTitle(currentPaper.name, currentPaper.className, currentPaper.subject)}
        className={currentPaper.className}
        subject={currentPaper.subject}
        defaultFormat={exportModal.format}
        activeSet={activePreviewSet || currentPaper.setName}
        userPlan={userPlan}
        hasBoth={questions.some((q) => (q.type || "mcq") === "mcq") && questions.some((q) => q.type === "cq")}
        defaultSectionFlow={currentPaper.sectionFlow || "separate"}
        onSaveBeforeExport={async () => {
          await saveAll({ silent: true });
        }}
      />

      {/* Import from Bank Modal */}
      <ImportFromBankModal
        open={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        onImport={handleImportFromBank}
        defaultCategory={currentPaper.subject}
      />

      {/* MCQ Set & Shuffler Dialog */}
      <McqSetDialog
        open={setModalOpen}
        onClose={() => setSetModalOpen(false)}
        paper={currentPaper}
        questions={questions}
        onSaveBeforeExport={async () => {
          await saveAll({ silent: true });
        }}
        onApplySet={async (shuffled, setName) => {
          setQuestions(shuffled);
          setPreviewQuestionsOverride(null);
          setActivePreviewSet(setName);
          setCurrentPaper((prev) => ({ ...prev, setName }));
          try {
            await apiRequest<Paper>(`/api/papers/${currentPaper.id}`, {
              method: "PUT",
              body: JSON.stringify({ setName })
            });
          } catch (e) {
            console.error("Failed to update setName on paper:", e);
          }
          void saveAll({ silent: false, questionsOverride: shuffled });
          setStatus(setName ? `Applied Set ${setName} to questions and saved!` : "Shuffled MCQs applied and saved!");
        }}
        onPreviewSet={(setName, shuffled) => {
          setActivePreviewSet(setName);
          setPreviewQuestionsOverride(shuffled);
          setStatus(`Previewing Set ${setName}`);
        }}
      />

      {/* Edit Exam Details Modal */}
      <EditPaperDetailsModal
        open={paperDetailsOpen}
        paper={currentPaper}
        onClose={() => setPaperDetailsOpen(false)}
        onSaved={(updated) => {
          setCurrentPaper(updated);
          setStatus("Paper details updated");
        }}
      />

      {/* Import Question Image Modal */}
      <ImportImageModal
        open={imageModalState.open}
        onClose={() => setImageModalState((prev) => ({ ...prev, open: false }))}
        onApplyImage={(imageUrl) => {
          if (imageModalState.questionId) {
            updateQuestion(imageModalState.questionId, { imageUrl });
            setStatus(imageUrl ? "Question image attached" : "Question image removed");
          }
        }}
        currentImageUrl={imageModalState.currentImageUrl}
        questionTitle={imageModalState.questionTitle}
        subjectContext={currentPaper.subject}
      />
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}
