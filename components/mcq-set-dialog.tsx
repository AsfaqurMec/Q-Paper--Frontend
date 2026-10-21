"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  FileDown,
  Grid,
  Layers,
  ListOrdered,
  Printer,
  Shuffle,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/math-renderer";
import { useAppModal } from "@/components/modal-provider";
import type { Paper } from "@/lib/api-types";
import type { DraftQuestion } from "@/components/question-editor";

type McqSetDialogProps = {
  open: boolean;
  onClose: () => void;
  paper: Paper;
  questions: DraftQuestion[];
  onApplySet: (shuffled: DraftQuestion[], setName?: string) => void;
  onPreviewSet: (setName: string, shuffled: DraftQuestion[]) => void;
  onSaveBeforeExport?: () => Promise<void>;
};

const SET_CONFIG = [
  { key: "A", bangla: "ক", title: "Set A (ক-সেট)" },
  { key: "B", bangla: "খ", title: "Set B (খ-সেট)" },
  { key: "C", bangla: "গ", title: "Set C (গ-সেট)" },
  { key: "D", bangla: "ঘ", title: "Set D (ঘ-সেট)" }
];

function getOptionText(opt: any): string {
  if (!opt) return "";
  if (typeof opt === "string") return opt;
  if (typeof opt === "object" && typeof opt.text === "string") return opt.text;
  return String(opt);
}

function cleanQuestionTitle(title: string): string {
  return (title || "").replace(/^(\d+|[\u09E6-\u09EF]+|[A-Za-z]+)[\.\:\)]\s*/, "");
}

function pseudoRandomShuffle<T>(array: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const pseudoRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function McqSetDialog({
  open,
  onClose,
  paper,
  questions,
  onApplySet,
  onPreviewSet,
  onSaveBeforeExport
}: McqSetDialogProps) {
  const { showAlert } = useAppModal();
  const [activeTab, setActiveTab] = useState<string>("A");
  const [copiedKey, setCopiedKey] = useState(false);

  const isBangla = useMemo(() => {
    return /[\u0980-\u09FF]/.test(paper.name + paper.subject) || !paper.subject?.toLowerCase().includes("english");
  }, [paper]);

  const toBn = (n: number) =>
    n.toString().replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][Number(d)]);

  const banglaOptions = ["ক", "খ", "গ", "ঘ"];

  // Partition MCQs and CQs
  const mcqs = useMemo(() => questions.filter((q) => (q.type || "mcq") === "mcq"), [questions]);
  const cqs = useMemo(() => questions.filter((q) => q.type === "cq"), [questions]);

  // Generate 4 deterministic sets for MCQs
  const sets = useMemo(() => {
    const generated: Record<string, DraftQuestion[]> = {};

    SET_CONFIG.forEach((setDef) => {
      let shuffledMcqs: DraftQuestion[];
      if (setDef.key === "A") {
        shuffledMcqs = [...mcqs];
      } else {
        shuffledMcqs = pseudoRandomShuffle(mcqs, `${paper.id}_set_${setDef.key}`);
      }

      // Renumber MCQs sequentially
      const numberedMcqs = shuffledMcqs.map((q, idx) => ({
        ...q,
        number: isBangla ? toBn(idx + 1) : String(idx + 1)
      }));

      generated[setDef.key] = [...numberedMcqs, ...cqs];
    });

    return generated;
  }, [mcqs, cqs, paper.id, isBangla]);

  // Answer Key Matrix across all 4 sets
  const answerKeyMatrix = useMemo(() => {
    const rowCount = mcqs.length;
    const matrix: Array<{
      qNum: number;
      answers: Record<string, { label: string; text: string; originalQId: string }>;
    }> = [];

    for (let i = 0; i < rowCount; i++) {
      const rowAnswers: Record<string, { label: string; text: string; originalQId: string }> = {};

      SET_CONFIG.forEach((setDef) => {
        const setQuestions = sets[setDef.key] || [];
        const q = setQuestions[i];
        if (q && (q.type || "mcq") === "mcq") {
          const opts = Array.isArray(q.options) ? q.options : [];
          const correctIdx = Math.max(0, Math.min(q.correct ?? 0, Math.max(0, opts.length - 1)));
          const label = isBangla
            ? banglaOptions[correctIdx] || String.fromCharCode(65 + correctIdx)
            : String.fromCharCode(65 + correctIdx);
          const rawOpt = opts[correctIdx];
          const optText = getOptionText(rawOpt);
          rowAnswers[setDef.key] = { label, text: optText, originalQId: q.id };
        }
      });

      matrix.push({ qNum: i + 1, answers: rowAnswers });
    }

    return matrix;
  }, [mcqs.length, sets, isBangla]);

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [setWithAnswer, setSetWithAnswer] = useState(false);

  if (!open) return null;

  function copyAnswerKeyText() {
    let text = `=== ${paper.name} - OMR ANSWER KEY MATRIX ===\n`;
    text += `Class: ${paper.className} | Subject: ${paper.subject}\n`;
    text += `Q.No\tSet A (ক)\tSet B (খ)\tSet C (গ)\tSet D (ঘ)\n`;
    text += `----------------------------------------------------\n`;

    answerKeyMatrix.forEach((row) => {
      const qLabel = isBangla ? toBn(row.qNum) : String(row.qNum);
      const a = row.answers["A"]?.label || "-";
      const b = row.answers["B"]?.label || "-";
      const c = row.answers["C"]?.label || "-";
      const d = row.answers["D"]?.label || "-";
      text += `${qLabel}\t${a}\t\t${b}\t\t${c}\t\t${d}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  }

  function handleQuickShuffle() {
    // Random in-place shuffle
    const shuffled = [...mcqs].sort(() => Math.random() - 0.5);
    const numbered = shuffled.map((q, idx) => ({
      ...q,
      number: isBangla ? toBn(idx + 1) : String(idx + 1)
    }));
    onApplySet([...numbered, ...cqs], undefined);
    onClose();
  }

  async function downloadSetExport(format: "pdf" | "docx", setKey: string) {
    try {
      setDownloadingKey(`${format}_${setKey}`);
      if (onSaveBeforeExport) {
        await onSaveBeforeExport();
      }
      const response = await fetch(
        `/api/backend/papers/${paper.id}/export/${format}?set=${setKey}&layout=${paper.layout}&questionsPerPage=${paper.questionsPerPage}&withAnswer=${setWithAnswer ? "true" : "false"}`
      );
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || `Export failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const baseName = (paper.name || "paper").trim().replace(/[\\/:*?"<>|]+/g, "_") || "question-paper";
      const banglaSetMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
      const setLabel = isBangla ? `${setKey}-${banglaSetMap[setKey] || setKey}` : setKey;
      const ansSuffix = setWithAnswer ? "-With-Answers" : "-Question-Paper";
      anchor.download = `${baseName}-Set-${setLabel}${ansSuffix}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Set export failed:", err);
      showAlert({
        title: "এক্সপোর্ট সমস্যা",
        message: err instanceof Error ? err.message : "এক্সপোর্ট সম্পন্ন করা যায়নি। অনুগ্রহ করে প্রথমে প্রশ্নগুলো সেভ করুন।",
        type: "error"
      });
    } finally {
      setDownloadingKey(null);
    }
  }

  async function downloadAllSets(format: "pdf" | "docx") {
    if (downloadingAll) return;
    try {
      setDownloadingAll(true);
      if (onSaveBeforeExport) {
        await onSaveBeforeExport();
      }
      const response = await fetch(
        `/api/backend/papers/${paper.id}/export/${format}?set=all&layout=${paper.layout}&questionsPerPage=${paper.questionsPerPage}&withAnswer=${setWithAnswer ? "true" : "false"}`
      );
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || `Export failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const baseName = (paper.name || "paper").trim().replace(/[\\/:*?"<>|]+/g, "_") || "question-paper";
      const ansSuffix = setWithAnswer ? "-With-Answers" : "-Question-Paper";
      anchor.download = `${baseName}-All-Sets${ansSuffix}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download all sets:", err);
      showAlert({
        title: "এক্সপোর্ট সমস্যা",
        message: err instanceof Error ? err.message : "এক্সপোর্ট সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
        type: "error"
      });
    } finally {
      setDownloadingAll(false);
    }
  }

  function printAnswerKeyMatrix() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      copyAnswerKeyText();
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${paper.name} - OMR Answer Key Matrix</title>
          <style>
            body { font-family: 'SolaimanLipi', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #0f172a; margin: 0; }
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; }
            h1 { font-size: 20px; margin: 0 0 6px 0; color: #0f172a; }
            .meta { font-size: 13px; color: #475569; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #334155; }
            .badge { display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background-color: #ccfbf1; color: #0f766e; font-weight: bold; margin-right: 6px; font-size: 11px; }
            .col-num { width: 44px; text-align: center; font-weight: bold; background-color: #f8fafc; }
            @media print { body { padding: 12px; } button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${paper.name}</h1>
            <p class="meta">${paper.className} | ${paper.subject} | ওএমআর সমন্বিত উত্তরমালা তালিকা (OMR Answer Key Matrix)</p>
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th>সেট ক (Set A)</th>
                <th>সেট খ (Set B)</th>
                <th>সেট গ (Set C)</th>
                <th>সেট ঘ (Set D)</th>
              </tr>
            </thead>
            <tbody>
              ${answerKeyMatrix
                .map(
                  (row) => `
                <tr>
                  <td class="col-num">${isBangla ? toBn(row.qNum) : row.qNum}</td>
                  ${SET_CONFIG.map((s) => {
                    const ans = row.answers[s.key];
                    return `<td><span class="badge">${ans?.label || "-"}</span> ${ans?.text || ""}</td>`;
                  }).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  const currentSetQuestions = sets[activeTab] || [];
  const currentSetMcqs = currentSetQuestions.filter((q) => (q.type || "mcq") === "mcq");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b px-3.5 sm:px-6 py-3 sm:py-4 bg-muted/40">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs shrink-0">
              <Shuffle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold">
                {isBangla ? "বহুনির্বাচনী প্রশ্ন সেট তৈরি ও শাফল (MCQ Sets)" : "MCQ Sets & Question Shuffler"}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                {isBangla
                  ? `মোট ${mcqs.length}টি MCQ প্রশ্ন হতে ৪টি অভিন্ন প্রশ্নপত্র সেট (ক, খ, গ, ঘ) প্রস্তুত রয়েছে`
                  : `4 distinct question sets (A, B, C, D) generated from ${mcqs.length} MCQs with synchronized answer keys`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickShuffle}
              className="gap-1.5 text-xs text-amber-700 hover:text-amber-800 border-amber-300"
              title="বর্তমান প্রশ্নপত্রে তৎক্ষণাৎ র‍্যান্ডম শাফল প্রয়োগ করুন"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isBangla ? "ইন-প্লেস শাফল" : "Quick Shuffle"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b px-3 sm:px-6 bg-background overflow-x-auto">
          {SET_CONFIG.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === s.key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>{isBangla ? `${s.title}` : `Set ${s.key}`}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-600">
                {mcqs.length} Qs
              </span>
            </button>
          ))}

          <button
            onClick={() => setActiveTab("MATRIX")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ml-auto ${
              activeTab === "MATRIX"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>{isBangla ? "উত্তরমালা তুলনা (OMR Key)" : "Answer Key Matrix"}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
          {mcqs.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Shuffle className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm">
                {isBangla
                  ? "সেট তৈরি বা শাফল করার জন্য অন্তত ২টি বহুনির্বাচনী (MCQ) প্রশ্ন প্রয়োজন।"
                  : "At least 2 MCQ questions are required to generate sets or shuffle."}
              </p>
            </div>
          ) : activeTab === "MATRIX" ? (
            /* Answer Key Matrix View */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">
                    {isBangla ? "সকল সেটের সমন্বিত উত্তরমালা তালিকা" : "Master OMR Answer Key Matrix"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isBangla
                      ? "প্রতিটি সেটের প্রশ্ন ক্রম অনুযায়ী সঠিক উত্তরের তুলনামূলক ছক"
                      : "Side-by-side correct answer mapping across all 4 examination sets"}
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={printAnswerKeyMatrix}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Printer className="h-3.5 w-3.5 text-teal-600" />
                      {isBangla ? "উত্তরমালা প্রিন্ট করুন" : "Print Key Sheet"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyAnswerKeyText}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey
                        ? (isBangla ? "কপি সম্পন্ন!" : "Copied!")
                        : (isBangla ? "উত্তরমালা কপি করুন" : "Copy Matrix")}
                    </Button>
                  </div>
                </div>

              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead className="bg-slate-100/80 border-b font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center">#</th>
                      <th className="py-2.5 px-3">সেট ক (Set A)</th>
                      <th className="py-2.5 px-3">সেট খ (Set B)</th>
                      <th className="py-2.5 px-3">সেট গ (Set C)</th>
                      <th className="py-2.5 px-3">সেট ঘ (Set D)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {answerKeyMatrix.map((row) => (
                      <tr key={row.qNum} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-500 bg-slate-50/50">
                          {isBangla ? toBn(row.qNum) : row.qNum}
                        </td>
                        {SET_CONFIG.map((s) => {
                          const ans = row.answers[s.key];
                          return (
                            <td key={s.key} className="py-2 px-3">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-[11px]">
                                  {ans?.label}
                                </span>
                                <span className="text-slate-600 truncate max-w-[130px] inline-block" title={ans?.text}>
                                  <MathRenderer text={ans?.text || ""} />
                                </span>
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Set Specific Question List */
            <div className="space-y-4">
              {/* Toolbar for the active set */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3 border">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-white font-bold text-xs">
                    {activeTab}
                  </span>
                  <span className="text-xs font-semibold">
                    {isBangla ? `সেট ${activeTab} (${SET_CONFIG.find((s) => s.key === activeTab)?.bangla}-সেট)` : `Set ${activeTab}`}
                  </span>
                  <span className="text-xs text-muted-foreground">• {currentSetMcqs.length} MCQs</span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onPreviewSet(activeTab, currentSetQuestions);
                      onClose();
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    {isBangla ? "প্রিভিউতে দেখুন" : "Preview in Paper"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onApplySet(currentSetQuestions, activeTab);
                      onClose();
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Check className="h-3.5 w-3.5 text-teal-600" />
                    {isBangla ? "এডিটরে প্রয়োগ করুন" : "Apply to Paper"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadSetExport("pdf", activeTab)}
                    className="gap-1 text-xs"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadSetExport("docx", activeTab)}
                    className="gap-1 text-xs"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    DOCX
                  </Button>
                </div>
              </div>

              {/* Shuffled MCQ Questions Cards */}
              <div className="space-y-2.5">
                {currentSetMcqs.map((q, idx) => (
                  <div key={`${q.id}_${idx}`} className="rounded-lg border bg-background p-3 text-xs shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-foreground leading-snug">
                        <span className="text-teal-700 font-bold mr-1">
                          {isBangla ? `${toBn(idx + 1)}.` : `${idx + 1}.`}
                        </span>
                        <MathRenderer text={cleanQuestionTitle(q.title)} />
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground font-medium">1 mark</span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-slate-700">
                      {(q.options || []).map((opt, optIdx) => {
                        const isCorrect = q.correct === optIdx;
                        const label = isBangla ? banglaOptions[optIdx] : String.fromCharCode(65 + optIdx);
                        const optText = getOptionText(opt);
                        return (
                          <div
                            key={optIdx}
                            className={`rounded px-2 py-1 text-[11px] ${
                              isCorrect
                                ? "bg-teal-50 border border-teal-300 font-semibold text-teal-800"
                                : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="font-bold mr-1">{label}.</span>
                            <MathRenderer text={optText} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 sm:px-6 py-3 bg-muted/20">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSetWithAnswer(false)}
                className={`rounded px-2 py-1 font-medium transition ${
                  !setWithAnswer
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isBangla ? "শুধু প্রশ্নপত্র" : "Without Answer"}
              </button>
              <button
                type="button"
                onClick={() => setSetWithAnswer(true)}
                className={`rounded px-2 py-1 font-medium transition ${
                  setWithAnswer
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isBangla ? "উত্তরমালাসহ" : "With Answer"}
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-700 ml-1">
              {isBangla ? "একসাথে ৪টি সেট ডাউনলোড:" : "Download All 4 Sets:"}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={downloadingAll || mcqs.length < 2}
              onClick={() => downloadAllSets("pdf")}
              className="gap-1 text-xs border-teal-300 text-teal-800 hover:bg-teal-50"
            >
              <FileDown className="h-3.5 w-3.5 text-teal-600" />
              {downloadingAll ? (isBangla ? "ডাউনলোড হচ্ছে..." : "Downloading...") : "All Sets (PDF)"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={downloadingAll || mcqs.length < 2}
              onClick={() => downloadAllSets("docx")}
              className="gap-1 text-xs border-indigo-300 text-indigo-800 hover:bg-indigo-50"
            >
              <FileDown className="h-3.5 w-3.5 text-indigo-600" />
              All Sets (DOCX)
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            {isBangla ? "বন্ধ করুন" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
