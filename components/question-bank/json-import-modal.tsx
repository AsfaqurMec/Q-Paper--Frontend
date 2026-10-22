"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileUp,
  Layers,
  Loader2,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, clientApi } from "@/lib/client-api";
import type { ClassHierarchy, QuestionImportResult } from "@/lib/api-types";
import { getBengaliClass, getBengaliSubject, getBengaliChapter } from "@/lib/curriculum-bengali";

function extractChapterNumber(name: string): number {
  if (!name) return 9999;
  const bnMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
  };
  const converted = name.replace(/[০-৯]/g, (d) => bnMap[d] || d);
  const match = converted.match(/(?:অধ্যায়|অধ্যায়|Chapter|Ch\.?)\s*(\d+)/i) || converted.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 9999;
}

interface JsonImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: QuestionImportResult) => void;
  hierarchy?: ClassHierarchy[];
  initialClass?: string;
  initialSubject?: string;
  initialChapter?: string;
}

export function JsonImportModal({
  open,
  onClose,
  onSuccess,
  hierarchy: propHierarchy,
  initialClass,
  initialSubject,
  initialChapter
}: JsonImportModalProps) {
  const [hierarchy, setHierarchy] = useState<ClassHierarchy[]>(propHierarchy || []);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass || "");
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || "");
  const [selectedChapter, setSelectedChapter] = useState<string>(initialChapter || "");
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [customChapterInput, setCustomChapterInput] = useState("");

  const [jsonInput, setJsonInput] = useState("");
  const [importMode, setImportMode] = useState<"skip_duplicates" | "update_existing" | "append">("skip_duplicates");
  const [importOwner, setImportOwner] = useState<"system" | "admin">("system");
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [importResult, setImportResult] = useState<QuestionImportResult | null>(null);

  // Fetch hierarchy if not provided as prop
  useEffect(() => {
    if (!propHierarchy || propHierarchy.length === 0) {
      apiRequest<ClassHierarchy[]>("/api/question-bank/hierarchy")
        .then((data) => {
          if (Array.isArray(data)) {
            setHierarchy(data);
          }
        })
        .catch(() => {});
    } else {
      setHierarchy(propHierarchy);
    }
  }, [propHierarchy]);

  // Available subjects for the selected class
  const availableSubjects = useMemo(() => {
    if (!selectedClass) return [];
    const cls = hierarchy.find((c) => c.className === selectedClass);
    return cls ? cls.subjects : [];
  }, [hierarchy, selectedClass]);

  // Available chapters for the selected subject (sorted numerically)
  const availableChapters = useMemo(() => {
    if (!selectedSubject) return [];
    const subj = availableSubjects.find((s) => s.name === selectedSubject);
    if (!subj) return [];
    return [...subj.chapters].sort((a, b) => {
      const numA = extractChapterNumber(a.name);
      const numB = extractChapterNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name, "bn");
    });
  }, [availableSubjects, selectedSubject]);

  // Auto-initialize class, subject, and chapter once hierarchy is available
  useEffect(() => {
    if (hierarchy.length > 0 && !selectedClass) {
      const firstCls = initialClass && hierarchy.some((c) => c.className === initialClass)
        ? initialClass
        : hierarchy[0].className;
      setSelectedClass(firstCls);

      const clsNode = hierarchy.find((c) => c.className === firstCls);
      const firstSubj = initialSubject && clsNode?.subjects.some((s) => s.name === initialSubject)
        ? initialSubject
        : clsNode?.subjects[0]?.name || "";
      setSelectedSubject(firstSubj);

      const subjNode = clsNode?.subjects.find((s) => s.name === firstSubj);
      const firstChap = initialChapter && subjNode?.chapters.some((ch) => ch.name === initialChapter)
        ? initialChapter
        : subjNode?.chapters[0]?.name || "";
      setSelectedChapter(firstChap);
    }
  }, [hierarchy, initialClass, initialSubject, initialChapter, selectedClass]);

  function handleClassChange(newClass: string) {
    setSelectedClass(newClass);
    const clsNode = hierarchy.find((c) => c.className === newClass);
    const firstSubj = clsNode?.subjects[0]?.name || "";
    setSelectedSubject(firstSubj);

    const subjNode = clsNode?.subjects.find((s) => s.name === firstSubj);
    const firstChap = subjNode?.chapters[0]?.name || "";
    setSelectedChapter(firstChap);
    setIsCustomChapter(false);
    setCustomChapterInput("");
  }

  function handleSubjectChange(newSubject: string) {
    setSelectedSubject(newSubject);
    const subjNode = availableSubjects.find((s) => s.name === newSubject);
    const firstChap = subjNode?.chapters[0]?.name || "";
    setSelectedChapter(firstChap);
    setIsCustomChapter(false);
    setCustomChapterInput("");
  }

  function handleChapterChange(newChapter: string) {
    if (newChapter === "__custom__") {
      setIsCustomChapter(true);
    } else {
      setIsCustomChapter(false);
      setSelectedChapter(newChapter);
    }
  }

  if (!open) return null;

  function loadSampleMcq() {
    const sample = [
      {
        type: "mcq",
        nature: "theory",
        difficulty: "easy",
        title: "কোনো বস্তুর অবস্থানের পরিবর্তনের হারকে কী বলে?",
        options: ["দ্রুতি", "ত্বরণ", "বল", "কাজ"],
        correctIndex: 0,
        explanation: "সময়ের সাথে কোনো বস্তুর অবস্থানের পরিবর্তনের হারই হলো দ্রুতি।"
      },
      {
        type: "mcq",
        nature: "mathematical",
        difficulty: "medium",
        title: "একটি গাড়ি স্থির অবস্থান থেকে ২ m/s² সুষম ত্বরণে চললে ৫ সেকেন্ড পর এর বেগ কত হবে?",
        options: ["৫ m/s", "১০ m/s", "১৫ m/s", "২০ m/s"],
        correctIndex: 1,
        explanation: "v = u + at = 0 + (2 * 5) = 10 m/s।"
      }
    ];
    setJsonInput(JSON.stringify(sample, null, 2));
    setErrorMsg("");
    setImportResult(null);
  }

  function loadSampleCq() {
    const sample = [
      {
        type: "cq",
        difficulty: "medium",
        nature: "mathematical",
        title: "একটি গাড়ি স্থির অবস্থান থেকে যাত্রা শুরু করে ৩ m/s² সুষম ত্বরণে ১০ সেকেন্ড চলে। এরপর গাড়িটি সুষম দ্রুতিতে আরও ৫ সেকেন্ড চলে থেমে যাওয়ার জন্য ব্রেক প্রয়োগ করে।",
        subQuestions: [
          { label: "ক", text: "ত্বরণ কাকে বলে?", marks: 1 },
          { label: "খ", text: "সুষম দ্রুতি ও সুষম বেগের মধ্যে পার্থক্য লেখ।", marks: 2 },
          { label: "গ", text: "প্রথম ১০ সেকেন্ডে গাড়িটির অতিক্রান্ত দূরত্ব নির্ণয় কর।", marks: 3, explanation: "s = ut + 0.5*a*t² = 0 + 0.5 * 3 * 100 = 150 m" },
          { label: "ঘ", text: "গাড়িটির সমগ্র গতির লেখচিত্রের প্রকৃতি বিশ্লেষণ কর।", marks: 4 }
        ],
        explanation: "গতিবিদ্যার সূত্রাবলী প্রয়োগ।"
      }
    ];
    setJsonInput(JSON.stringify(sample, null, 2));
    setErrorMsg("");
    setImportResult(null);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setErrorMsg("");
      setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    setErrorMsg("");

    if (!selectedClass) {
      setErrorMsg("Please select a Class before importing.");
      return;
    }
    if (!selectedSubject) {
      setErrorMsg("Please select a Subject before importing.");
      return;
    }

    if (!jsonInput.trim()) {
      setErrorMsg("Please provide or paste JSON question data.");
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (err: any) {
      setErrorMsg(`Invalid JSON syntax: ${err.message}`);
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const effectiveChapter = isCustomChapter ? customChapterInput.trim() : selectedChapter;
      const clsNode = hierarchy.find((c) => c.className === selectedClass);
      const subjNode = clsNode?.subjects.find((s) => s.name === selectedSubject);
      const chapNode = subjNode?.chapters.find((ch) => ch.name === effectiveChapter);

      const queryParams = new URLSearchParams();
      if (importMode) queryParams.set("mode", importMode);
      if (importOwner) queryParams.set("ownerId", importOwner);

      queryParams.set("className", selectedClass);
      if (clsNode?.id) queryParams.set("classId", clsNode.id);

      queryParams.set("subject", selectedSubject);
      if (subjNode?.id) queryParams.set("subjectId", subjNode.id);

      if (effectiveChapter) queryParams.set("chapter", effectiveChapter);
      if (chapNode?.id) queryParams.set("chapterId", chapNode.id);

      const res = await clientApi.adminImportQuestionBankJson(parsedData, queryParams.toString());
      setImportResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to import questions to question bank");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border bg-card p-4 sm:p-6 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary/10 p-1.5 text-primary">
                <FileCode className="h-5 w-5" />
              </span>
              <h2 className="text-sm sm:text-lg font-bold text-foreground">Import Questions from JSON</h2>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Admin Exclusive
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Select Class, Subject &amp; Chapter below, then provide your question JSON without needing taxonomy fields.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground font-medium text-[11px]">Quick Samples:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={loadSampleMcq} className="h-7 text-xs">
                Load Sample MCQ
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={loadSampleCq} className="h-7 text-xs">
                Load Sample CQ
              </Button>
              <label className="inline-flex items-center gap-1 cursor-pointer text-xs font-medium px-2.5 py-1 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7">
                <Upload className="h-3 w-3" />
                <span>Upload .json file</span>
                <input type="file" accept=".json,application/json" className="hidden" onChange={handleFileUpload} />
              </label>
              {jsonInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setJsonInput(""); setImportResult(null); setErrorMsg(""); }}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Target Curriculum Selectors (Class -> Subject -> Chapter) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Layers className="h-4 w-4 text-primary" />
                <span>Target Curriculum (Class, Subject &amp; Chapter)</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                All questions in JSON will be assigned here
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Class */}
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  শ্রেণি <span className="text-destructive">*</span>
                </label>
                <Select value={selectedClass} onValueChange={handleClassChange}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchy.map((cls) => (
                      <SelectItem key={cls.className} value={cls.className}>
                        {cls.nameBn || getBengaliClass(cls.className)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  বিষয় <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={handleSubjectChange}
                  disabled={availableSubjects.length === 0}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder={availableSubjects.length ? "বিষয় নির্বাচন করুন" : "কোনো বিষয় নেই"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.nameBn || getBengaliSubject(s.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    অধ্যায়
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomChapter(!isCustomChapter)}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {isCustomChapter ? "তালিকা থেকে পছন্দ" : "+ কাস্টম অধ্যায়"}
                  </button>
                </div>

                {isCustomChapter ? (
                  <Input
                    placeholder="e.g. অধ্যায় ১: বাস্তব সংখ্যা"
                    value={customChapterInput}
                    onChange={(e) => setCustomChapterInput(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                ) : (
                  <Select
                    value={selectedChapter}
                    onValueChange={handleChapterChange}
                    disabled={availableChapters.length === 0}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder={availableChapters.length ? "অধ্যায় নির্বাচন করুন" : "কোনো অধ্যায় নেই"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChapters.map((ch) => (
                        <SelectItem key={ch.name} value={ch.name}>
                          {ch.nameBn || getBengaliChapter(ch.name)}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">+ কাস্টম অধ্যায়...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-lg border">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Duplicate Handling</label>
              <Select value={importMode} onValueChange={(val: any) => setImportMode(val)}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip_duplicates">Skip Duplicates</SelectItem>
                  <SelectItem value="update_existing">Update Existing</SelectItem>
                  <SelectItem value="append">Append All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Attribution Owner</label>
              <Select value={importOwner} onValueChange={(val: any) => setImportOwner(val)}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Global (All Teachers)</SelectItem>
                  <SelectItem value="admin">Current Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* JSON Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-foreground">Paste or Edit JSON Data</span>
              <span className="text-muted-foreground text-[11px]">
                {jsonInput ? `${jsonInput.length.toLocaleString()} characters` : "No class/subject/chapter needed inside items"}
              </span>
            </div>
            <textarea
              rows={9}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "type": "mcq",\n    "title": "ত্বরণের একক কোনটি?",\n    "options": ["m/s", "m/s²", "N", "J"],\n    "correctIndex": 1,\n    "difficulty": "medium",\n    "explanation": "ত্বরণ = বেগ / সময় = m/s²।"\n  }\n]`}
              className="w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-xs font-mono focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Import Completed Successfully!</span>
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {importResult.totalReceived} Processed
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 p-2 text-emerald-800 dark:text-emerald-300">
                  <div className="text-lg font-bold font-mono">{importResult.inserted}</div>
                  <div className="text-[11px]">Inserted</div>
                </div>
                <div className="rounded-md border bg-blue-50 dark:bg-blue-950/40 border-blue-200 p-2 text-blue-800 dark:text-blue-300">
                  <div className="text-lg font-bold font-mono">{importResult.updated}</div>
                  <div className="text-[11px]">Updated</div>
                </div>
                <div className="rounded-md border bg-amber-50 dark:bg-amber-950/40 border-amber-200 p-2 text-amber-800 dark:text-amber-300">
                  <div className="text-lg font-bold font-mono">{importResult.skipped}</div>
                  <div className="text-[11px]">Skipped</div>
                </div>
                <div className="rounded-md border bg-rose-50 dark:bg-rose-950/40 border-rose-200 p-2 text-rose-800 dark:text-rose-300">
                  <div className="text-lg font-bold font-mono">{importResult.errors.length}</div>
                  <div className="text-[11px]">Errors</div>
                </div>
              </div>

              {importResult.sampleInserted.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase">Sample Added:</div>
                  <div className="divide-y rounded-md border bg-background text-xs max-h-24 overflow-y-auto">
                    {importResult.sampleInserted.map((item) => (
                      <div key={item.id} className="p-1.5 px-2 flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{item.title}</span>
                        <Badge variant="secondary" className="text-[9px] uppercase shrink-0">{item.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={importing}>
            {importResult ? "Close" : "Cancel"}
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={importing || !jsonInput.trim()}
            className="gap-1.5 bg-primary font-semibold"
          >
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileUp className="h-3.5 w-3.5" />
                Save to Question Bank
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
