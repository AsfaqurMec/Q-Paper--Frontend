"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Edit2,
  ExternalLink,
  FileCode,
  Filter,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MathRenderer } from "@/components/math-renderer";
import { apiRequest } from "@/lib/client-api";
import type {
  BankBoard,
  BankCategory,
  BankPaginatedResponse,
  BankQuestion,
  BankTag,
  BankYear,
  ClassHierarchy,
  UserSession
} from "@/lib/api-types";
import { QuestionFormModal } from "./question-form-modal";
import { GeneratePaperDialog } from "./generate-paper-dialog";
import { AddToPaperModal } from "./add-to-paper-modal";
import { JsonImportModal } from "./json-import-modal";
import { CreatePaperFromSelectedModal } from "./create-paper-from-selected-modal";
import { getBengaliClass, getBengaliSubject, getBengaliChapter, getBengaliBoard, getBengaliYear, toBengaliDigits } from "@/lib/curriculum-bengali";
import { cn } from "@/lib/utils";

const BATCH_SIZE = 30;

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

const DEFAULT_CATEGORIES = [
  "পদার্থবিজ্ঞান",
  "পদার্থবিজ্ঞান ১ম পত্র",
  "পদার্থবিজ্ঞান ২য় পত্র",
  "রসায়ন",
  "রসায়ন ১ম পত্র",
  "রসায়ন ২য় পত্র",
  "জীববিজ্ঞান",
  "জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)",
  "জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)",
  "সাধারণ গণিত",
  "উচ্চতর গণিত",
  "উচ্চতর গণিত ১ম পত্র",
  "উচ্চতর গণিত ২য় পত্র",
  "তথ্য ও যোগাযোগ প্রযুক্তি",
  "বাংলা ১ম পত্র",
  "বাংলা ২য় পত্র",
  "বাংলাদেশ ও বিশ্বপরিচয়"
];

export function QuestionBankView({
  initialQuestions,
  initialCategories,
  initialHierarchy,
  initialTags,
  initialBoards,
  initialYears,
  user
}: {
  initialQuestions: BankQuestion[];
  initialCategories: BankCategory[];
  initialHierarchy?: ClassHierarchy[];
  initialTags?: BankTag[];
  initialBoards?: BankBoard[];
  initialYears?: BankYear[];
  user: UserSession;
}) {
  const isAdmin = user?.role === "admin";
  const [questions, setQuestions] = useState<BankQuestion[]>(initialQuestions);
  const [totalCount, setTotalCount] = useState<number>(initialQuestions.length);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [categories, setCategories] = useState<string[]>(() => {
    const names = new Set(DEFAULT_CATEGORIES);
    initialCategories.forEach((c) => names.add(c.name));
    initialQuestions.forEach((q) => {
      if (q.category) names.add(q.category);
      if (q.subject) names.add(q.subject);
    });
    return Array.from(names);
  });

  const [hierarchy, setHierarchy] = useState<ClassHierarchy[]>(initialHierarchy || []);
  const [tags, setTags] = useState<BankTag[]>(initialTags || []);
  const [boards, setBoards] = useState<BankBoard[]>(initialBoards || []);
  const [years, setYears] = useState<BankYear[]>(initialYears || []);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [groupByChapter, setGroupByChapter] = useState<boolean>(false);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all"); // "all" | "mcq" | "cq"
  const [selectedNature, setSelectedNature] = useState<string>("all"); // "all" | "theory" | "mathematical"
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("newest");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isJsonImportOpen, setIsJsonImportOpen] = useState(false);
  const [addToPaperData, setAddToPaperData] = useState<{ open: boolean; ids: string[] }>({
    open: false,
    ids: []
  });
  const [isCreatePaperFromSelectedOpen, setIsCreatePaperFromSelectedOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ open: boolean; question?: BankQuestion; isBatch?: boolean }>({
    open: false
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const isFreePlan = user.plan === "free" && user.role !== "admin";

  // Fetch full curriculum hierarchy on mount
  useEffect(() => {
    let isMounted = true;
    apiRequest<ClassHierarchy[]>("/api/question-bank/hierarchy")
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setHierarchy(data);
        }
      })
      .catch(() => {});

    // Fetch tags if not provided initially
    if (!initialTags || initialTags.length === 0) {
      apiRequest<BankTag[]>("/api/question-bank/tags")
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            setTags(data);
          }
        })
        .catch(() => {});
    }

    // Fetch boards if not provided initially
    if (!initialBoards || initialBoards.length === 0) {
      apiRequest<BankBoard[]>("/api/question-bank/boards")
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            setBoards(data);
          }
        })
        .catch(() => {});
    }

    // Fetch years if not provided initially
    if (!initialYears || initialYears.length === 0) {
      apiRequest<BankYear[]>("/api/question-bank/years")
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            setYears(data);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [initialTags, initialBoards, initialYears]);

  // Build query string for question bank requests
  const buildQueryParams = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams();
      params.set("paginate", "true");
      params.set("page", String(targetPage));
      params.set("limit", String(BATCH_SIZE));

      if (selectedClass !== "all") {
        // Always send className (text). Also send classId when available so
        // questions with ID references are found too.
        const clsObj = hierarchy.find((c) => c.className === selectedClass);
        if (clsObj?.id) params.set("classId", clsObj.id);
        params.set("className", selectedClass);
      }
      if (selectedSubject !== "all") {
        const clsObj = hierarchy.find((c) => c.className === selectedClass);
        const subjObj =
          clsObj?.subjects.find((s) => s.name === selectedSubject) ||
          hierarchy.flatMap((c) => c.subjects).find((s) => s.name === selectedSubject);
        if (subjObj?.id) params.set("subjectId", subjObj.id);
        params.set("subject", selectedSubject);
      }
      if (selectedChapter !== "all") {
        const clsObj = hierarchy.find((c) => c.className === selectedClass);
        const subjObj =
          clsObj?.subjects.find((s) => s.name === selectedSubject) ||
          hierarchy.flatMap((c) => c.subjects).find((s) => s.name === selectedSubject);
        const chapObj = subjObj?.chapters.find((ch) => ch.name === selectedChapter);
        if (chapObj?.id) params.set("chapterId", chapObj.id);
        params.set("chapter", selectedChapter);
      }
      if (selectedBoard !== "all") params.set("board", selectedBoard);
      if (selectedYear !== "all") params.set("year", selectedYear);
      if (selectedTag !== "all") params.set("tag", selectedTag);
      if (selectedType !== "all") params.set("type", selectedType);
      if (selectedNature !== "all") params.set("nature", selectedNature);
      if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (search.trim()) params.set("search", search.trim());
      if (sortOption === "chapter") params.set("sortBy", "chapter");
      else if (sortOption === "most_used") params.set("sortBy", "most_used");
      else if (sortOption === "oldest") params.set("sortBy", "oldest");
      else if (sortOption === "title") params.set("sortBy", "title");

      return params.toString();
    },
    [
      hierarchy,
      selectedClass,
      selectedSubject,
      selectedChapter,
      selectedBoard,
      selectedYear,
      selectedTag,
      selectedType,
      selectedNature,
      selectedDifficulty,
      selectedCategory,
      sortOption,
      search
    ]
  );


  // Fetch initial batch (Page 1) when filters, search, or sorting change
  useEffect(() => {
    let isMounted = true;
    setLoadingQuestions(true);
    setSelectedIds(new Set());
    setPage(1);

    const timer = setTimeout(() => {
      isFetchingRef.current = true;
      const query = buildQueryParams(1);

      apiRequest<BankPaginatedResponse | BankQuestion[]>(`/api/question-bank?${query}`)
        .then((data) => {
          if (isMounted) {
            if (data && typeof data === "object" && "items" in data && Array.isArray((data as any).items)) {
              const resp = data as BankPaginatedResponse;
              setQuestions(resp.items);
              setTotalCount(resp.total);
              setHasMore(resp.items.length < resp.total);
            } else if (Array.isArray(data)) {
              setQuestions(data);
              setTotalCount(data.length);
              setHasMore(false);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch filtered questions:", err);
        })
        .finally(() => {
          if (isMounted) {
            setLoadingQuestions(false);
            isFetchingRef.current = false;
          }
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [buildQueryParams]);

  // Load next batch for infinite scroll
  const fetchNextBatch = useCallback(() => {
    if (isFetchingRef.current || loadingQuestions || loadingMore || !hasMore) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingMore(true);

    const nextPage = page + 1;
    const query = buildQueryParams(nextPage);

    apiRequest<BankPaginatedResponse | BankQuestion[]>(`/api/question-bank?${query}`)
      .then((data) => {
        if (data && typeof data === "object" && "items" in data && Array.isArray((data as any).items)) {
          const resp = data as BankPaginatedResponse;
          if (resp.items.length > 0) {
            setQuestions((prev) => {
              const existingIds = new Set(prev.map((q) => q.id));
              const freshItems = resp.items.filter((q) => !existingIds.has(q.id));
              const combined = [...prev, ...freshItems];
              setHasMore(combined.length < resp.total);
              return combined;
            });
            setTotalCount(resp.total);
            setPage(nextPage);
          } else {
            setHasMore(false);
          }
        } else if (Array.isArray(data) && data.length > 0) {
          setQuestions((prev) => {
            const existingIds = new Set(prev.map((q) => q.id));
            const freshItems = data.filter((q) => !existingIds.has(q.id));
            return [...prev, ...freshItems];
          });
          setHasMore(false);
        } else {
          setHasMore(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch next question batch:", err);
      })
      .finally(() => {
        setLoadingMore(false);
        isFetchingRef.current = false;
      });
  }, [buildQueryParams, hasMore, loadingMore, loadingQuestions, page]);

  // Sentinel IntersectionObserver for smooth infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingQuestions) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingRef.current && !loadingQuestions && !loadingMore) {
          fetchNextBatch();
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [fetchNextBatch, hasMore, loadingMore, loadingQuestions]);

  // Available subjects for the selected class
  const availableSubjects = useMemo(() => {
    if (selectedClass === "all") {
      const allSubjs = new Map<string, { totalCount: number; nameBn?: string }>();
      hierarchy.forEach((cls) => {
        cls.subjects.forEach((s) => {
          const prev = allSubjs.get(s.name);
          allSubjs.set(s.name, {
            totalCount: (prev?.totalCount || 0) + s.totalCount,
            nameBn: s.nameBn || prev?.nameBn
          });
        });
      });
      return Array.from(allSubjs.entries()).map(([name, data]) => ({
        name,
        nameBn: data.nameBn,
        totalCount: data.totalCount,
        chapters: []
      }));
    }
    const cls = hierarchy.find((c) => c.className === selectedClass);
    return cls ? cls.subjects : [];
  }, [hierarchy, selectedClass]);

  // Available chapters for the selected subject (sorted strictly by natural chapter number)
  const availableChapters = useMemo(() => {
    if (selectedSubject === "all") return [];
    let list: any[] = [];
    if (selectedClass !== "all") {
      const cls = hierarchy.find((c) => c.className === selectedClass);
      const subj = cls?.subjects.find((s) => s.name === selectedSubject);
      list = subj ? subj.chapters : [];
    } else {
      // Search across all classes for this subject
      const chaptersMap = new Map<string, any>();
      hierarchy.forEach((cls) => {
        const subj = cls.subjects.find((s) => s.name === selectedSubject);
        if (subj) {
          subj.chapters.forEach((ch) => chaptersMap.set(ch.name, ch));
        }
      });
      list = Array.from(chaptersMap.values());
    }

    return [...list].sort((a, b) => {
      const numA = extractChapterNumber(a.name);
      const numB = extractChapterNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name, "bn", { numeric: true, sensitivity: "base" });
    });
  }, [hierarchy, selectedClass, selectedSubject]);

  // Sort questions returned by backend
  const filteredQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (sortOption === "chapter") {
        const numA = extractChapterNumber(a.chapter || "");
        const numB = extractChapterNumber(b.chapter || "");
        if (numA !== numB) return numA - numB;
        const chComp = (a.chapter || "").localeCompare(b.chapter || "", "bn");
        if (chComp !== 0) return chComp;
        return a.title.localeCompare(b.title, "bn");
      }
      if (sortOption === "most_used") return (b.usageCount || 0) - (a.usageCount || 0);
      if (sortOption === "title") return a.title.localeCompare(b.title, "bn");
      if (sortOption === "oldest") return (a.createdAt || "").localeCompare(b.createdAt || "");
      return (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || "");
    });
  }, [questions, sortOption]);

  // Group questions by chapter for the organized Chapter view
  const groupedQuestions = useMemo(() => {
    if (!groupByChapter) return [];
    const map = new Map<string, BankQuestion[]>();
    filteredQuestions.forEach((q) => {
      const ch = q.chapter || "সাধারণ (General)";
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch)!.push(q);
    });

    const entries = Array.from(map.entries()).map(([chapterName, items]) => ({
      chapterName,
      items,
      mcqCount: items.filter((q) => (q.type || "mcq") === "mcq").length,
      cqCount: items.filter((q) => q.type === "cq").length
    }));

    entries.sort((a, b) => {
      const numA = extractChapterNumber(a.chapterName);
      const numB = extractChapterNumber(b.chapterName);
      if (numA !== numB) return numA - numB;
      return a.chapterName.localeCompare(b.chapterName, "bn");
    });

    return entries;
  }, [filteredQuestions, groupByChapter]);

  function toggleChapterCollapse(chapterName: string) {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterName)) next.delete(chapterName);
      else next.add(chapterName);
      return next;
    });
  }

  // Stats calculation
  const totalMcqCount = useMemo(() => questions.filter((q) => (q.type || "mcq") === "mcq").length, [questions]);
  const totalCqCount = useMemo(() => questions.filter((q) => q.type === "cq").length, [questions]);
  const selectedQuestionsList = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return questions.filter((q) => selectedIds.has(q.id));
  }, [questions, selectedIds]);

  function handleQuestionSaved(saved: BankQuestion) {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    if (saved.category && !categories.includes(saved.category)) {
      setCategories((prev) => [...prev, saved.category]);
    }
  }

  function handleImportSuccess() {
    const query = buildQueryParams(1);
    setLoadingQuestions(true);
    apiRequest<BankPaginatedResponse | BankQuestion[]>(`/api/question-bank?${query}`)
      .then((data) => {
        if (data && typeof data === "object" && "items" in data && Array.isArray((data as any).items)) {
          const resp = data as BankPaginatedResponse;
          setQuestions(resp.items);
          setTotalCount(resp.total);
          setHasMore(resp.items.length < resp.total);
        } else if (Array.isArray(data)) {
          setQuestions(data);
          setTotalCount(data.length);
          setHasMore(false);
        }
      })
      .finally(() => {
        setLoadingQuestions(false);
      });
  }

  async function confirmDelete() {
    try {
      setIsDeleting(true);
      setActionError("");

      if (deleteTarget.isBatch) {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => apiRequest(`/api/question-bank/${id}`, { method: "DELETE" })));
        setQuestions((prev) => prev.filter((q) => !selectedIds.has(q.id)));
        setSelectedIds(new Set());
      } else if (deleteTarget.question) {
        const targetId = deleteTarget.question.id;
        await apiRequest(`/api/question-bank/${targetId}`, { method: "DELETE" });
        setQuestions((prev) => prev.filter((q) => q.id !== targetId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }
      setDeleteTarget({ open: false });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete question.");
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  }

  const hasActiveFilters = Boolean(
    selectedClass !== "all" ||
    selectedSubject !== "all" ||
    selectedChapter !== "all" ||
    selectedBoard !== "all" ||
    selectedYear !== "all" ||
    selectedTag !== "all" ||
    selectedType !== "all" ||
    selectedNature !== "all" ||
    selectedCategory !== "all" ||
    selectedDifficulty !== "all" ||
    search.trim()
  );

  function resetAllFilters() {
    setSelectedClass("all");
    setSelectedSubject("all");
    setSelectedChapter("all");
    setSelectedBoard("all");
    setSelectedYear("all");
    setSelectedTag("all");
    setSelectedType("all");
    setSelectedNature("all");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSearch("");
  }

  function toggleExplanation(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderQuestionCard(question: BankQuestion) {
    const isSelected = selectedIds.has(question.id);
    const isExpanded = expandedIds.has(question.id);
    const isCq = question.type === "cq" || Boolean(question.subQuestions && question.subQuestions.length > 0);

    const diffColor =
      question.difficulty === "easy"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        : question.difficulty === "hard"
        ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
        : "bg-amber-500/10 text-amber-600 border-amber-500/20";

    return (
      <div
        key={question.id}
        style={{ contentVisibility: "auto", containIntrinsicSize: "0 120px" }}
        className={`group relative rounded-xl border bg-card p-3 sm:p-4 transition-all ${
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "hover:border-primary/40 hover:shadow-xs"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(question.id)}
            className="mt-1 h-4 w-4 rounded border-muted-foreground/30 accent-primary shrink-0"
          />

          {/* Main Question Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {question.className && (
                <span className="rounded-md border bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 px-2 py-0.5 font-semibold text-[11px]">
                  {getBengaliClass(question.className)}
                </span>
              )}
              <span className="rounded-md border bg-muted/80 px-2 py-0.5 font-medium text-[11px]">
                {getBengaliSubject(question.subject || question.category)}
              </span>
              {question.chapter && (
                <span className="rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-muted-foreground/70" />
                  <span>{getBengaliChapter(question.chapter)}</span>
                </span>
              )}
              {question.board && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBoard(selectedBoard === question.board ? "all" : question.board!);
                  }}
                  className={`rounded-md border px-2 py-0.5 font-semibold text-[11px] flex items-center gap-1 transition-colors ${
                    selectedBoard === question.board
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                  }`}
                  title={`বোর্ড ফিল্টার: ${getBengaliBoard(question.board)}`}
                >
                  <Building2 className="h-3 w-3" />
                  <span>{getBengaliBoard(question.board)}</span>
                </button>
              )}
              {question.year && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedYear(selectedYear === question.year ? "all" : question.year!);
                  }}
                  className={`rounded-md border px-2 py-0.5 font-semibold text-[11px] flex items-center gap-1 transition-colors ${
                    selectedYear === question.year
                      ? "bg-cyan-600 text-white border-cyan-700 shadow-xs"
                      : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
                  }`}
                  title={`সাল ফিল্টার: ${getBengaliYear(question.year)}`}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{getBengaliYear(question.year)}</span>
                </button>
              )}
              {isCq ? (
                <span className="rounded-md border bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 px-2 py-0.5 font-bold text-[11px]">
                  CQ &middot; {toBengaliDigits(question.marks || 10)} নম্বর
                </span>
              ) : (
                <span className="rounded-md border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 px-2 py-0.5 font-medium text-[11px]">
                  MCQ &middot; {toBengaliDigits(question.marks || 1)} নম্বর
                </span>
              )}
              {question.nature === "mathematical" ? (
                <span className="rounded-md border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 font-semibold text-[11px]">
                  🔢 গাণিতিক
                </span>
              ) : (
                <span className="rounded-md border bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20 px-2 py-0.5 font-medium text-[11px]">
                  📖 তত্ত্বীয়
                </span>
              )}
              <span className={`rounded-md border px-2 py-0.5 font-medium capitalize text-[11px] ${diffColor}`}>
                {question.difficulty === "easy" ? "সহজ" : question.difficulty === "hard" ? "কঠিন" : "মাঝারি"}
              </span>
              {question.usageCount > 0 && (
                <span className="text-muted-foreground text-[11px]">
                  &middot; {toBengaliDigits(question.usageCount)} বার ব্যবহৃত
                </span>
              )}

              {/* Tag badges with click-to-filter */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 ml-1">
                  {question.tags.map((tg) => {
                    const isAct = selectedTag === tg;
                    return (
                      <button
                        key={tg}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(isAct ? "all" : tg);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          isAct
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-muted"
                        }`}
                        title={`Filter by #${tg}`}
                      >
                        #{tg}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Title or Stem */}
            {!isCq ? (
              <div className="text-sm font-semibold text-foreground leading-snug">
                <MathRenderer text={question.title} />
              </div>
            ) : (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs leading-relaxed text-foreground">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                  উদ্দীপক / Context Scenario
                </div>
                <MathRenderer text={question.title} />
              </div>
            )}

            {/* Subtitle if present */}
            {question.subtitle && (
              <div className="text-xs text-muted-foreground">
                <MathRenderer text={question.subtitle} />
              </div>
            )}

            {/* Diagram / Image if present */}
            {question.imageUrl && (
              <div className="mt-2 rounded-lg border border-muted/50 bg-muted/20 p-2 flex justify-center overflow-auto">
                {question.imageUrl.trim().startsWith("<svg") ? (
                  <div
                    className="max-h-48 w-auto flex items-center justify-center [&>svg]:max-h-48 [&>svg]:w-auto"
                    dangerouslySetInnerHTML={{ __html: question.imageUrl }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={question.imageUrl}
                    alt="Question diagram"
                    className="max-h-48 w-auto object-contain rounded"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
            )}

            {/* MCQ: Options */}
            {!isCq && question.options && question.options.length > 0 && (
              <div className="mt-2 space-y-1.5 pt-1 ml-3 sm:ml-5 pl-2.5 border-l-2 border-primary/20">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {question.options.map((opt, idx) => {
                    const isCorrect = idx === question.correctIndex;
                    const label = ["(ক)", "(খ)", "(গ)", "(ঘ)"][idx] || String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 rounded-md border p-2 text-xs transition-all ${
                          isCorrect
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium"
                            : "border-muted/60 bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-auto min-w-[1.25rem] px-1 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          }`}
                        >
                          {isCorrect ? <Check className="h-2.5 w-2.5" /> : label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MathRenderer text={opt} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CQ: 4 Sub-questions */}
            {isCq && question.subQuestions && question.subQuestions.length > 0 && (
              <div className="mt-2 space-y-2 pt-1 ml-3 sm:ml-5 pl-2.5 border-l-2 border-purple-500/20">
                {question.subQuestions.map((sq, sqIdx) => {
                  const label = sq.label
                    ? (sq.label.includes("(") ? sq.label : `(${sq.label})`)
                    : ["(ক)", "(খ)", "(গ)", "(ঘ)"][sqIdx] || String.fromCharCode(97 + sqIdx);

                  return (
                    <div key={sqIdx} className="rounded-lg border bg-card/60 p-2.5 text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-auto min-w-[1.5rem] px-1.5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[11px] font-bold text-white">
                            {label}
                          </span>
                          <div className="font-medium text-foreground pt-0.5">
                            <MathRenderer text={sq.text} />
                          </div>
                        </div>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0">
                          {sq.marks} mark{sq.marks > 1 ? "s" : ""}
                        </span>
                      </div>
                      {isExpanded && sq.answer && (
                        <div className="mt-1.5 rounded border-t pt-1.5 text-[11px] text-muted-foreground bg-muted/20 p-2">
                          <span className="font-semibold text-foreground">Answer: </span>
                          <MathRenderer text={sq.answer} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation Toggle */}
            {(question.explanation || (isCq && question.subQuestions?.some((sq) => sq.answer))) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleExplanation(question.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Hide Answer &amp; Explanation
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> Show Answer &amp; Explanation
                    </>
                  )}
                </button>

                {isExpanded && question.explanation && (
                  <div className="mt-2 rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground mb-0.5">Explanation / Rubric:</p>
                    <MathRenderer text={question.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Column (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingQuestion(question)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Edit Question"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget({ open: true, question })}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Delete Question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {totalCount.toLocaleString()} Total Questions in Bank
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Curriculum repository for SSC &amp; HSC &middot; Instant paper generation for full subjects or chapters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => setIsJsonImportOpen(true)}
              className="flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/5 font-medium shadow-2xs"
            >
              <FileCode className="h-4 w-4" />
              Import JSON
            </Button>
          )}

          <Button
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Generate Question Paper
            <span className="rounded bg-white/20 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-white">
              Pro
            </span>
          </Button>

          {user.role === "admin" && (
            <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          )}
        </div>
      </div>

      {/* Free Plan Upgrade Banner */}
      {isFreePlan && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">National Curriculum Question Bank</h2>
              <p className="text-xs text-muted-foreground">
                You are currently viewing national curriculum questions. Upgrade to Standard or Pro to generate unlimited custom exams and save private questions.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/dashboard/subscription">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Upgrade Plan
            </Link>
          </Button>
        </div>
      )}

      {/* Action Error Alert */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Filter Card (Single Layout: Row 1 = Search, Class, Subject, Chapter; Row 2 = Others) */}
      <Card className="border bg-card shadow-xs">
        <CardContent className="p-3 sm:p-4 space-y-3.5">
          {/* First row: searchbar, class, subject, chapter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {/* Search */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                <span>অনুসন্ধান (Search)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search titles, formulas, chapters..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background pl-8 pr-8 text-xs font-medium"
                />
                {search && (
                  <button
                    aria-label="Clear search query"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Class / Curriculum Filter */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                <span>শ্রেণি / স্তর (Class)</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSubject("all");
                  setSelectedChapter("all");
                }}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
              >
                <option value="all">সকল শ্রেণি</option>
                {hierarchy.map((cls) => (
                  <option key={cls.className} value={cls.className}>
                    {cls.nameBn || getBengaliClass(cls.className)} ({toBengaliDigits(cls.totalCount)})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                <span>বিষয়</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedChapter("all");
                }}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
              >
                <option value="all">সকল বিষয়</option>
                {availableSubjects.map((subj: any) => (
                  <option key={subj.name} value={subj.name}>
                    {subj.nameBn || getBengaliSubject(subj.name)} ({toBengaliDigits(subj.totalCount)})
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Filter */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-500" />
                <span>অধ্যায়</span>
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={selectedSubject === "all" && availableChapters.length === 0}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">সকল অধ্যায়</option>
                {availableChapters.map((ch: any) => (
                  <option key={ch.name} value={ch.name}>
                    {ch.nameBn || getBengaliChapter(ch.name)} ({toBengaliDigits(ch.totalCount)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="flex sm:hidden items-center justify-between pt-1 border-t border-border/50">
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary py-1"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{showMobileFilters ? "ফিল্টার লুকান (Hide)" : "অতিরিক্ত ফিল্টার (More Filters)"}</span>
              {(selectedBoard !== "all" || selectedYear !== "all" || selectedType !== "all" || selectedNature !== "all" || selectedDifficulty !== "all" || selectedTag !== "all") && (
                <span className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[10px] font-bold">
                  সক্রিয়
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                রিসেট
              </button>
            )}
          </div>

          {/* Second row: others (Board, Year, Question Type, Nature, Difficulty, Tag, Reset) */}
          <div className={cn("pt-2.5 border-t border-border/60", !showMobileFilters && "hidden sm:block")}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 items-end">
              {/* Board Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-amber-500" />
                  <span>বোর্ড</span>
                </label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="h-8.5 w-full rounded-md border bg-background px-2 text-xs font-medium"
                >
                  <option value="all">সকল বোর্ড</option>
                  {boards.map((b) => (
                    <option key={b.name} value={b.name}>
                      {getBengaliBoard(b.name)} ({toBengaliDigits(b.count)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-cyan-500" />
                  <span>সাল</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="h-8.5 w-full rounded-md border bg-background px-2 text-xs font-medium"
                >
                  <option value="all">সকল সাল</option>
                  {years.map((y) => (
                    <option key={y.name} value={y.name}>
                      {getBengaliYear(y.name)} ({toBengaliDigits(y.count)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Type Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  টাইপ
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-8.5 w-full rounded-md border bg-background px-2 text-xs font-medium"
                >
                  <option value="all">সকল টাইপ</option>
                  <option value="mcq">MCQ (বহুনির্বাচনী)</option>
                  <option value="cq">CQ (সৃজনশীল)</option>
                </select>
              </div>

              {/* Question Nature Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  ধরন
                </label>
                <select
                  value={selectedNature}
                  onChange={(e) => setSelectedNature(e.target.value)}
                  className="h-8.5 w-full rounded-md border bg-background px-2 text-xs font-medium"
                >
                  <option value="all">সকল ধরন</option>
                  <option value="theory">📖 তত্ত্বীয়</option>
                  <option value="mathematical">🔢 গাণিতিক</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  কঠিন্য
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="h-8.5 w-full rounded-md border bg-background px-2 text-xs font-medium capitalize"
                >
                  <option value="all">সকল মান</option>
                  <option value="easy">সহজ (Easy)</option>
                  <option value="medium">মাঝারি (Medium)</option>
                  <option value="hard">কঠিন (Hard)</option>
                </select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <Tag className="h-3 w-3 text-primary" />
                  <span>ট্যাগ</span>
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="h-8.5 w-full rounded-md border bg-background px-2 text-xs font-medium"
                >
                  <option value="all">সকল ট্যাগ</option>
                  {tags.map((t) => (
                    <option key={t.name} value={t.name}>
                      #{t.name} ({toBengaliDigits(t.count)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset All Filters Button */}
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasActiveFilters}
                  onClick={resetAllFilters}
                  className="h-8.5 w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 gap-1 border-dashed"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>রিসেট করুন</span>
                </Button>
              </div>
            </div>

            {/* Popular tag chips (compact) */}
            {tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  জনপ্রিয় ট্যাগ:
                </span>
                {tags.slice(0, 10).map((t) => {
                  const isAct = selectedTag === t.name;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setSelectedTag(isAct ? "all" : t.name)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                        isAct
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent"
                      }`}
                    >
                      #{t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question List & Controls Section (Single Full Width Layout) */}
      <div className="space-y-4">
          {/* Top Bar: Sort, Grouping & Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === filteredQuestions.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-muted-foreground/30 accent-primary"
              />
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                {loadingQuestions && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {selectedIds.size > 0 ? (
                  <span className="font-medium text-foreground">
                    {toBengaliDigits(selectedIds.size)} / {toBengaliDigits(totalCount)} নির্বাচিত
                  </span>
                ) : (
                  <span className="font-semibold text-foreground">
                    মোট: {toBengaliDigits(totalCount)} টি প্রশ্ন
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Group by Chapter Toggle */}
              <Button
                type="button"
                size="sm"
                variant={groupByChapter ? "primary" : "outline"}
                onClick={() => setGroupByChapter((v) => !v)}
                className="h-8 text-xs gap-1.5"
                title="অধ্যায় অনুসারে বিন্যাস টগল করুন"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{groupByChapter ? "অধ্যায় অনুসারে বিন্যস্ত" : "অধ্যায় অনুসারে বিন্যাস"}</span>
              </Button>

              {selectedIds.size > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setIsCreatePaperFromSelectedOpen(true)}
                    className="h-8 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    প্রশ্নপত্র তৈরি করুন ({toBengaliDigits(selectedIds.size)})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setAddToPaperData({
                        open: true,
                        ids: Array.from(selectedIds)
                      })
                    }
                    className="h-8 text-xs"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" /> প্রশ্নপত্রে যোগ করুন
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget({ open: true, isBatch: true })}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> মুছে ফেলুন
                    </Button>
                  )}
                </>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>সাজান:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs font-medium"
                >
                  <option value="chapter">অধ্যায় ক্রম অনুসারে</option>
                  <option value="newest">সর্বশেষ সংযোজিত</option>
                  <option value="most_used">সবচেয়ে বেশি ব্যবহৃত</option>
                  <option value="title">শিরোনাম (অ &rarr; হ)</option>
                  <option value="oldest">প্রাচীনতম প্রথমে</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Pills (Board, Year, Chapter, Tag) */}
          {(selectedBoard !== "all" || selectedYear !== "all" || selectedTag !== "all" || selectedChapter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground text-[11px]">সক্রিয় ফিল্টার:</span>
              {selectedBoard !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 font-medium text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>বোর্ড: {getBengaliBoard(selectedBoard)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBoard("all")}
                    className="hover:text-foreground ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedYear !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 font-medium text-cyan-700 dark:text-cyan-400 text-[11px]">
                  <span>সাল: {getBengaliYear(selectedYear)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedYear("all")}
                    className="hover:text-foreground ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedChapter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 font-medium text-primary text-[11px]">
                  <span>অধ্যায়: {getBengaliChapter(selectedChapter)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedChapter("all")}
                    className="hover:text-foreground ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedTag !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 font-medium text-indigo-600 dark:text-indigo-400 text-[11px]">
                  <span>ট্যাগ: #{selectedTag}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTag("all")}
                    className="hover:text-foreground ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Questions Grid/List */}
          {loadingQuestions ? (
            <Card className="border-dashed border-primary/30 bg-card/60">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <h3 className="text-base font-semibold">প্রশ্নসমূহ লোড হচ্ছে...</h3>
                  <p className="mt-1 text-xs text-muted-foreground">ফিল্টার অনুযায়ী প্রশ্ন সংগ্রহ করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">কোনো প্রশ্ন পাওয়া যায়নি</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    আপনার ফিল্টারের সাথে মিলে এমন কোনো প্রশ্ন পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন অথবা রিসেট করুন।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClass("all");
                      setSelectedSubject("all");
                      setSelectedChapter("all");
                      setSelectedType("all");
                      setSelectedDifficulty("all");
                      setSelectedCategory("all");
                      setSearch("");
                    }}
                  >
                    ফিল্টার রিসেট করুন
                  </Button>
                  {user.role === "admin" && (
                    <Button onClick={() => setIsCreateOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-1" /> নতুন প্রশ্ন যুক্ত করুন
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {groupByChapter ? (
                <div className="space-y-4">
                  {groupedQuestions.map((group) => {
                    const isCollapsed = collapsedChapters.has(group.chapterName);
                    return (
                      <div key={group.chapterName} className="rounded-xl border bg-card/60 shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleChapterCollapse(group.chapterName)}
                          className="w-full flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left border-b"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">
                                {getBengaliChapter(group.chapterName)}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                <span className="font-semibold text-primary">{toBengaliDigits(group.items.length)} টি প্রশ্ন</span>
                                <span>&middot;</span>
                                <span>{toBengaliDigits(group.mcqCount)} টি নৈর্ব্যক্তিক</span>
                                <span>&middot;</span>
                                <span>{toBengaliDigits(group.cqCount)} টি সৃজনশীল</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {isCollapsed ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </div>
                        </button>
                        {!isCollapsed && (
                          <div className="p-3 space-y-3 bg-background/50">
                            {group.items.map((question) => renderQuestionCard(question))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((question) => renderQuestionCard(question))}
                </div>
              )}

              {/* Infinite Scroll Sentinel & Status */}
              <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center text-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-card/80 px-4 py-2 rounded-full border shadow-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>আরও প্রশ্ন লোড হচ্ছে...</span>
                  </div>
                )}
                {!hasMore && questions.length > 0 && (
                  <div className="text-xs text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50">
                    ✨ সব প্রশ্ন লোড হয়েছে (মোট {totalCount.toLocaleString()}টি প্রশ্ন)
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      {/* Edit / Create Question Modal */}
      {(isCreateOpen || editingQuestion) && (
        <QuestionFormModal
          open={isCreateOpen || Boolean(editingQuestion)}
          question={editingQuestion}
          categories={categories}
          hierarchy={hierarchy}
          popularTags={tags}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingQuestion(null);
          }}
          onSaved={handleQuestionSaved}
        />
      )}

      {/* JSON Question Bank Import Modal (Admin Only) */}
      {isJsonImportOpen && (
        <JsonImportModal
          open={isJsonImportOpen}
          onClose={() => setIsJsonImportOpen(false)}
          onSuccess={handleImportSuccess}
          hierarchy={hierarchy}
          initialClass={selectedClass !== "all" ? selectedClass : undefined}
          initialSubject={selectedSubject !== "all" ? selectedSubject : undefined}
          initialChapter={selectedChapter !== "all" ? selectedChapter : undefined}
        />
      )}

      {/* Smart Question Paper Generator Dialog */}
      <GeneratePaperDialog
        open={isGenerateOpen}
        user={user}
        onClose={() => setIsGenerateOpen(false)}
        preselectedClass={selectedClass !== "all" ? selectedClass : undefined}
        preselectedSubject={selectedSubject !== "all" ? selectedSubject : undefined}
        preselectedChapter={selectedChapter !== "all" ? selectedChapter : undefined}
        preselectedType={selectedType !== "all" ? selectedType : undefined}
      />

      {/* Add to Paper Modal */}
      <AddToPaperModal
        open={addToPaperData.open}
        questionIds={addToPaperData.ids}
        onClose={() => setAddToPaperData({ open: false, ids: [] })}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Delete Question{deleteTarget.isBatch ? "s" : ""}?</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {deleteTarget.isBatch
                    ? `Are you sure you want to delete ${selectedIds.size} selected questions? This cannot be undone.`
                    : "Are you sure you want to remove this question from your question bank?"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget({ open: false })}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Action Bar when questions are selected */}
      {selectedIds.size > 0 && (
        <aside
          aria-label="Selection Actions"
          className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[96%] sm:w-[94%] max-w-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-primary/40 bg-card px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl ring-1 ring-primary/20">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-xs">
                {selectedIds.size}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {selectedIds.size} {selectedIds.size === 1 ? "প্রশ্ন" : "টি প্রশ্ন"} নির্বাচিত
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  {selectedQuestionsList.filter((q) => (q.type || "mcq") === "mcq" && (!q.subQuestions || q.subQuestions.length === 0)).length} MCQs &middot;{" "}
                  {selectedQuestionsList.filter((q) => q.type === "cq" || (q.subQuestions && q.subQuestions.length > 0)).length} CQs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsCreatePaperFromSelectedOpen(true)}
                className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>প্রশ্নপত্র তৈরি</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setAddToPaperData({
                    open: true,
                    ids: Array.from(selectedIds)
                  })
                }
                className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                <span>Add</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-muted-foreground hover:text-foreground shrink-0"
                title="Deselect All (নির্বাচন বাতিল)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Create Paper From Selected Questions Modal */}
      {isCreatePaperFromSelectedOpen && (
        <CreatePaperFromSelectedModal
          open={isCreatePaperFromSelectedOpen}
          selectedQuestions={selectedQuestionsList}
          user={user}
          hierarchy={hierarchy}
          onClose={() => setIsCreatePaperFromSelectedOpen(false)}
          onSuccess={() => {
            setSelectedIds(new Set());
            setIsCreatePaperFromSelectedOpen(false);
          }}
        />
      )}
    </div>
  );
}
