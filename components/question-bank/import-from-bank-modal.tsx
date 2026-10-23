"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, BookOpen, Check, Filter, Layers, Lock, Search, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/math-renderer";
import { apiRequest } from "@/lib/client-api";
import { extractChapterNumber } from "@/lib/utils";
import type { BankQuestion } from "@/lib/api-types";

type ImportFromBankModalProps = {
  open: boolean;
  onClose: () => void;
  onImport: (selectedQuestions: BankQuestion[]) => void;
  defaultCategory?: string;
};

export function ImportFromBankModal({ open, onClose, onImport, defaultCategory }: ImportFromBankModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "mcq" | "cq">("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      setSelectedIds(new Set());
      setSelectedBoard("all");
      setSelectedYear("all");
      setSelectedTag("all");
      if (defaultCategory) {
        setSelectedSubject(defaultCategory);
      }

      Promise.all([
        apiRequest<BankQuestion[]>("/api/question-bank?limit=all"),
        apiRequest<Array<{ name: string; count: number }>>("/api/question-bank/categories")
      ])
        .then(([bankQuestions, catList]) => {
          setQuestions(bankQuestions);
          setCategories(catList.map((c) => c.name));
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load question bank"))
        .finally(() => setLoading(false));
    }
  }, [open, defaultCategory]);

  // Extract distinct classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.className) set.add(q.className);
    });
    return Array.from(set).sort();
  }, [questions]);

  // Extract distinct subjects
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (selectedClass !== "all" && q.className !== selectedClass) return;
      const subj = q.subject || q.category;
      if (subj) set.add(subj);
    });
    return Array.from(set).sort();
  }, [questions, selectedClass]);

  // Extract distinct chapters sorted numerically
  const availableChapters = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (selectedClass !== "all" && q.className !== selectedClass) return;
      const subj = q.subject || q.category;
      if (selectedSubject !== "all" && subj !== selectedSubject) return;
      if (q.chapter) set.add(q.chapter);
    });
    return Array.from(set).sort((a, b) => {
      const numA = extractChapterNumber(a);
      const numB = extractChapterNumber(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [questions, selectedClass, selectedSubject]);

  // Extract distinct boards
  const availableBoards = useMemo(() => {
    const set = new Set<string>();
    const STANDARD_BOARDS = [
      "ঢাকা বোর্ড", "রাজশাহী বোর্ড", "চট্টগ্রাম বোর্ড", "কুমিল্লা বোর্ড",
      "যশোর বোর্ড", "বরিশাল বোর্ড", "সিলেট বোর্ড", "দিনাজপুর বোর্ড",
      "ময়মনসিংহ বোর্ড", "মাদ্রাসা বোর্ড", "কারিগরি বোর্ড"
    ];
    questions.forEach((q) => {
      if (q.board) set.add(q.board);
    });
    STANDARD_BOARDS.forEach((b) => {
      if (questions.some((q) => q.board === b || q.tags?.some((t) => t.includes(b)))) {
        set.add(b);
      }
    });
    return Array.from(set).sort();
  }, [questions]);

  // Extract distinct years
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.year) set.add(q.year);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [questions]);

  // Extract distinct tags (filtered out pure boards/years)
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach((t) => {
          if (!t.includes("বোর্ড") && !t.includes("Board") && !/^\d{4}$/.test(t)) {
            set.add(t);
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((q) => {
        if (selectedType !== "all" && q.type !== selectedType) return false;
        if (selectedClass !== "all" && q.className !== selectedClass) return false;
        const subj = q.subject || q.category;
        if (selectedSubject !== "all" && subj !== selectedSubject) return false;
        if (selectedChapter !== "all" && q.chapter !== selectedChapter) return false;
        if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;
        if (selectedBoard !== "all") {
          const matchBoard = q.board === selectedBoard || (q.tags && q.tags.some((t) => t.includes(selectedBoard)));
          if (!matchBoard) return false;
        }
        if (selectedYear !== "all") {
          const matchYear = q.year === selectedYear || (q.tags && q.tags.some((t) => t.includes(selectedYear)));
          if (!matchYear) return false;
        }
        if (selectedTag !== "all") {
          if (!q.tags || !q.tags.includes(selectedTag)) return false;
        }
        if (search.trim()) {
          const term = search.toLowerCase();
          const matchTitle = q.title.toLowerCase().includes(term);
          const matchCategory = q.category.toLowerCase().includes(term);
          const matchSubj = q.subject?.toLowerCase().includes(term) ?? false;
          const matchChapter = q.chapter?.toLowerCase().includes(term) ?? false;
          const matchTags = q.tags?.some((t) => t.toLowerCase().includes(term)) ?? false;
          const matchExpl = q.explanation?.toLowerCase().includes(term) ?? false;
          const matchBoard = q.board?.toLowerCase().includes(term) ?? false;
          const matchYear = q.year?.toLowerCase().includes(term) ?? false;
          if (!matchTitle && !matchCategory && !matchSubj && !matchChapter && !matchTags && !matchExpl && !matchBoard && !matchYear) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const numA = extractChapterNumber(a.chapter || "");
        const numB = extractChapterNumber(b.chapter || "");
        if (numA !== numB) return numA - numB;
        return 0;
      });
  }, [questions, selectedType, selectedClass, selectedSubject, selectedChapter, selectedDifficulty, selectedBoard, selectedYear, selectedTag, search]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  }

  function handleConfirm() {
    const selected = questions.filter((q) => selectedIds.has(q.id));
    onImport(selected);
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-2.5 sm:p-4 backdrop-blur-md overflow-y-auto w-screen h-screen min-h-[100dvh]">
      <div className="relative my-auto sm:my-6 flex h-[92vh] sm:h-[85vh] w-full max-w-3xl flex-col rounded-xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3.5 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold">Import from Question Bank</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">Select questions to append into your current exam paper</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-3 sm:px-5 py-2.5 sm:py-3 text-xs">
          <div className="relative flex-1 min-w-[170px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search question text, formulas or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="h-8 rounded-md border bg-background px-2 text-xs font-medium"
          >
            <option value="all">All Types</option>
            <option value="mcq">MCQ Only</option>
            <option value="cq">CQ Only</option>
          </select>

          {/* Class Filter */}
          {availableClasses.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject("all");
                setSelectedChapter("all");
              }}
              className="h-8 rounded-md border bg-background px-2 text-xs max-w-[140px] truncate"
            >
              <option value="all">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Subject Filter */}
          {availableSubjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter("all");
              }}
              className="h-8 rounded-md border bg-background px-2 text-xs max-w-[130px] truncate"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Chapter Filter */}
          {availableChapters.length > 0 && (
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs max-w-[150px] truncate"
            >
              <option value="all">All Chapters</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          )}

          {/* Board Filter */}
          {availableBoards.length > 0 && (
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs max-w-[140px] truncate"
            >
              <option value="all">All Boards</option>
              {availableBoards.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs max-w-[100px] truncate"
            >
              <option value="all">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs max-w-[130px] truncate"
            >
              <option value="all">All Tags</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs capitalize"
          >
            <option value="all">All Diff</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {error && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-medium">{error}</span>
              </div>
              <Button asChild size="sm" variant="primary" className="h-7 text-xs shrink-0 font-semibold bg-teal-600 hover:bg-teal-700 text-white">
                <Link href="/dashboard/subscription">প্যাকেজ আপগ্রেড করুন</Link>
              </Button>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading Question Bank...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-medium">No questions found</p>
              <p className="text-xs text-muted-foreground">Try clearing filters or selecting another chapter/tag.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1 text-xs text-muted-foreground">
                <span>
                  Showing {filteredQuestions.length} question{filteredQuestions.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="font-medium text-primary hover:underline"
                >
                  {selectedIds.size === filteredQuestions.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {filteredQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                const diffColor =
                  q.difficulty === "easy"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : q.difficulty === "hard"
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20";

                return (
                  <div
                    key={q.id}
                    onClick={() => toggleSelect(q.id)}
                    className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "bg-card hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span
                            className={`rounded border px-1.5 py-0.2 font-semibold uppercase ${
                              q.type === "cq"
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            }`}
                          >
                            {q.type ? q.type.toUpperCase() : "MCQ"}
                          </span>
                          <span className="rounded border bg-muted px-1.5 py-0.2 font-medium">
                            {q.subject || q.category}
                          </span>
                          {q.chapter && (
                            <span className="rounded border bg-muted/60 px-1.5 py-0.2 text-[10px] text-muted-foreground truncate max-w-[200px]">
                              {q.chapter}
                            </span>
                          )}
                          <span className={`rounded border px-1.5 py-0.2 font-medium capitalize ${diffColor}`}>
                            {q.difficulty}
                          </span>
                          <span className="text-muted-foreground">
                            Marks: {q.marks || (q.type === "cq" ? 10 : 1)}
                          </span>
                          {q.usageCount > 0 && (
                            <span className="text-muted-foreground">&middot; Used in {q.usageCount} papers</span>
                          )}
                        </div>

                        <div className="text-sm font-medium text-foreground">
                          <MathRenderer text={q.title} />
                        </div>

                        {q.subtitle && (
                          <div className="text-xs text-muted-foreground">
                            <MathRenderer text={q.subtitle} />
                          </div>
                        )}

                        {/* MCQ Options */}
                        {q.type !== "cq" && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 pt-1 text-xs text-muted-foreground">
                            {q.options.map((opt, idx) => {
                              const isCorrect = idx === q.correctIndex;
                              const label = String.fromCharCode(65 + idx);
                              return (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-1.5 rounded px-2 py-0.5 ${
                                    isCorrect ? "bg-primary/10 font-semibold text-primary" : ""
                                  }`}
                                >
                                  <span className="text-[10px]">{label}.</span>
                                  <MathRenderer text={opt} />
                                  {isCorrect && <Check className="h-3 w-3 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* CQ Sub-questions */}
                        {q.type === "cq" && q.subQuestions && q.subQuestions.length > 0 && (
                          <div className="space-y-1 pt-1.5 border-t mt-1">
                            {q.subQuestions.map((sq, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <span className="font-bold text-primary shrink-0">
                                  {sq.label || String.fromCharCode(65 + idx)}.
                                </span>
                                <span className="flex-1 text-foreground">
                                  <MathRenderer text={sq.text} />
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground">({sq.marks}m)</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Board & Year Badges */}
                        {(q.board || q.year) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {q.board && (
                              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                🏛️ {q.board}
                              </span>
                            )}
                            {q.year && (
                              <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
                                📅 {q.year}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            {q.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-medium text-primary"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t bg-muted/10 p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedIds.size}</span> question{selectedIds.size === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={selectedIds.size === 0}>
              Import Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
