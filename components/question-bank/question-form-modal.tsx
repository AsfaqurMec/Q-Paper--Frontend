"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Check, Globe, ImagePlus, Layers, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/math-renderer";
import { ImportImageModal } from "@/components/import-image-modal";
import { apiRequest } from "@/lib/client-api";
import { extractChapterNumber, toStandardDigits } from "@/lib/utils";
import type { BankQuestion, BankSubQuestion, BankTag, ClassHierarchy } from "@/lib/api-types";

type QuestionFormProps = {
  open: boolean;
  question?: BankQuestion | null;
  categories: string[];
  hierarchy?: ClassHierarchy[];
  popularTags?: BankTag[];
  onClose: () => void;
  onSaved: (question: BankQuestion) => void;
};

type FormSubQuestion = Omit<BankSubQuestion, "marks"> & { marks: number | string };

const DEFAULT_SUBQUESTIONS: FormSubQuestion[] = [
  { label: "ক", text: "", marks: 1, answer: "", explanation: "" },
  { label: "খ", text: "", marks: 2, answer: "", explanation: "" },
  { label: "গ", text: "", marks: 3, answer: "", explanation: "" },
  { label: "ঘ", text: "", marks: 4, answer: "", explanation: "" }
];

const BD_BOARDS = [
  { label: "ঢাকা বোর্ড (Dhaka Board)", bangla: "ঢাকা বোর্ড", english: "Dhaka Board" },
  { label: "রাজশাহী বোর্ড (Rajshahi Board)", bangla: "রাজশাহী বোর্ড", english: "Rajshahi Board" },
  { label: "চট্টগ্রাম বোর্ড (Chittagong Board)", bangla: "চট্টগ্রাম বোর্ড", english: "Chittagong Board" },
  { label: "কুমিল্লা বোর্ড (Comilla Board)", bangla: "কুমিল্লা বোর্ড", english: "Comilla Board" },
  { label: "যশোর বোর্ড (Jessore Board)", bangla: "যশোর বোর্ড", english: "Jessore Board" },
  { label: "বরিশাল বোর্ড (Barisal Board)", bangla: "বরিশাল বোর্ড", english: "Barisal Board" },
  { label: "সিলেট বোর্ড (Sylhet Board)", bangla: "সিলেট বোর্ড", english: "Sylhet Board" },
  { label: "দিনাজপুর বোর্ড (Dinajpur Board)", bangla: "দিনাজপুর বোর্ড", english: "Dinajpur Board" },
  { label: "ময়মনসিংহ বোর্ড (Mymensingh Board)", bangla: "ময়মনসিংহ বোর্ড", english: "Mymensingh Board" },
  { label: "মাদ্রাসা বোর্ড (Madrasah Board)", bangla: "মাদ্রাসা বোর্ড", english: "Madrasah Board" },
  { label: "কারিগরি বোর্ড (Technical Board)", bangla: "কারিগরি বোর্ড", english: "Technical Board" },
  { label: "সকল বোর্ড (All Boards)", bangla: "সকল বোর্ড", english: "All Boards" }
];

const BD_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];

function toBengaliDigits(str: string): string {
  const map: Record<string, string> = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
  };
  return str.replace(/[0-9]/g, (d) => map[d] || d);
}

export function QuestionFormModal({
  open,
  question,
  categories,
  hierarchy = [],
  popularTags = [],
  onClose,
  onSaved
}: QuestionFormProps) {
  const isEditing = Boolean(question);

  const [type, setType] = useState<"mcq" | "cq" | "both">("mcq");
  const [nature, setNature] = useState<"theory" | "mathematical">("theory");
  const [className, setClassName] = useState("নবম-দশম শ্রেণি (SSC)");
  const [subject, setSubject] = useState("পদার্থবিজ্ঞান");
  const [chapter, setChapter] = useState("");
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [customChapterInput, setCustomChapterInput] = useState("");

  const [board, setBoard] = useState("");
  const [year, setYear] = useState("");

  const [category, setCategory] = useState(categories[0] || "Physics");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showBoardHelper, setShowBoardHelper] = useState(false);
  const [boardIndex, setBoardIndex] = useState(0);
  const [boardExam, setBoardExam] = useState("SSC");
  const [boardYear, setBoardYear] = useState("2024");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [marks, setMarks] = useState<number | string>(1);
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [subQuestions, setSubQuestions] = useState<FormSubQuestion[]>(DEFAULT_SUBQUESTIONS);
  const [explanation, setExplanation] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Available subjects for the selected class
  const availableSubjects = useMemo(() => {
    const cls = hierarchy.find((c) => c.className === className);
    return cls ? cls.subjects : [];
  }, [hierarchy, className]);

  // Available chapters for the selected subject (sorted numerically)
  const availableChapters = useMemo(() => {
    const subj = availableSubjects.find((s) => s.name === subject);
    if (!subj) return [];
    return [...subj.chapters].sort((a, b) => {
      const numA = extractChapterNumber(a.name);
      const numB = extractChapterNumber(b.name);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [availableSubjects, subject]);

  // Initialize form data
  useEffect(() => {
    if (question) {
      setType(question.type || "mcq");
      setNature(question.nature || "theory");
      setClassName(question.className || "নবম-দশম শ্রেণি (SSC)");
      setSubject(question.subject || question.category);
      setChapter(question.chapter || "");
      setCustomChapterInput(question.chapter || "");
      setIsCustomChapter(false);

      if (!categories.includes(question.category)) {
        setCategory("__custom__");
        setCustomCategory(question.category);
        setIsCustomCategory(true);
      } else {
        setCategory(question.category);
        setCustomCategory("");
      }

      setDifficulty((question.difficulty as any) || "medium");
      setBoard(question.board || "");
      setYear(question.year || "");
      setTitle(question.title || "");
      setSubtitle(question.subtitle || "");
      setImageUrl(question.imageUrl || "");
      setMarks(question.marks || (question.type === "cq" ? 10 : 1));
      setOptions(question.options && question.options.length >= 2 ? [...question.options] : ["", "", "", ""]);
      setCorrectIndex(typeof question.correctIndex === "number" ? question.correctIndex : 0);

      if (question.subQuestions && question.subQuestions.length > 0) {
        setSubQuestions(question.subQuestions.map((sq) => ({ ...sq })));
      } else {
        setSubQuestions(DEFAULT_SUBQUESTIONS);
      }

      setExplanation(question.explanation || "");
      setTags(question.tags && Array.isArray(question.tags) ? [...question.tags] : []);
    } else {
      setType("mcq");
      setNature("theory");
      const initialClass = hierarchy[0]?.className || "নবম-দশম শ্রেণি (SSC)";
      setClassName(initialClass);
      const initialSubj = hierarchy[0]?.subjects[0]?.name || "পদার্থবিজ্ঞান";
      setSubject(initialSubj);
      const initialChap = hierarchy[0]?.subjects[0]?.chapters[0]?.name || "General";
      setChapter(initialChap);
      setCustomChapterInput(initialChap);
      setIsCustomChapter(false);

      setCategory(categories[0] || "Physics");
      setCustomCategory("");
      setIsCustomCategory(false);
      setDifficulty("medium");
      setBoard("");
      setYear("");
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      setMarks(1);
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      setSubQuestions(DEFAULT_SUBQUESTIONS);
      setExplanation("");
      setTags([]);
    }
    setError("");
    setShowPreview(false);
  }, [question, categories, hierarchy, open]);

  if (!open) return null;

  function handleClassChange(newClass: string) {
    setClassName(newClass);
    const cls = hierarchy.find((c) => c.className === newClass);
    if (cls && cls.subjects.length > 0) {
      setSubject(cls.subjects[0].name);
      if (cls.subjects[0].chapters.length > 0) {
        const sortedCh = [...cls.subjects[0].chapters].sort((a, b) => extractChapterNumber(a.name) - extractChapterNumber(b.name));
        setChapter(sortedCh[0].name);
        setIsCustomChapter(false);
      } else {
        setChapter("General");
      }
    }
  }

  function handleSubjectChange(newSubject: string) {
    setSubject(newSubject);
    const subj = availableSubjects.find((s) => s.name === newSubject);
    if (subj && subj.chapters.length > 0) {
      const sortedCh = [...subj.chapters].sort((a, b) => extractChapterNumber(a.name) - extractChapterNumber(b.name));
      setChapter(sortedCh[0].name);
      setIsCustomChapter(false);
    } else {
      setChapter("General");
    }
  }

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tagToRemove: string) {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }

  function handleBoardHelperAdd() {
    const selectedBoard = BD_BOARDS[boardIndex] || BD_BOARDS[0];
    const banglaYear = toBengaliDigits(boardYear);

    const boardBanglaTag = `${selectedBoard.bangla} ${banglaYear}`;
    const examYearTag = `${boardExam} ${boardYear}`;
    const generalTag = "বোর্ড প্রশ্ন";

    const toAdd = [boardBanglaTag, examYearTag, generalTag];
    setTags((prev) => {
      const next = [...prev];
      for (const t of toAdd) {
        if (!next.includes(t)) next.push(t);
      }
      return next;
    });
  }

  function handleOptionChange(index: number, value: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }

  function addOption() {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (correctIndex === index) {
      setCorrectIndex(0);
    } else if (correctIndex > index) {
      setCorrectIndex((curr) => curr - 1);
    }
  }

  function updateSubQuestion(index: number, patch: Partial<BankSubQuestion>) {
    setSubQuestions((prev) =>
      prev.map((sq, i) => (i === index ? { ...sq, ...patch } : sq))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const activeCategory = isCustomCategory ? customCategory.trim() : (category.trim() || subject.trim());
    if (!activeCategory) {
      setError("Please specify a category or subject.");
      return;
    }

    if (!title.trim()) {
      setError(type === "cq" ? "Stem / উদ্দীপক is required." : "Question title is required.");
      return;
    }

    let filledOptions: string[] = [];
    if (type === "mcq") {
      filledOptions = options.map((opt) => opt.trim());
      if (filledOptions.some((opt) => !opt)) {
        setError("All options must have content.");
        return;
      }
      if (correctIndex >= options.length || correctIndex < 0) {
        setError("Please designate a valid correct answer.");
        return;
      }
    } else {
      // CQ Validation
      if (subQuestions.some((sq) => !sq.text.trim())) {
        setError("All sub-questions (ক, খ, গ, ঘ) must have question text.");
        return;
      }
    }

    const finalChapter = isCustomChapter ? customChapterInput.trim() : chapter.trim();
    if (!finalChapter) {
      setError("Please select or enter a chapter.");
      return;
    }

    const selectedCls = hierarchy.find((c) => c.className === className);
    const selectedSubj = selectedCls?.subjects.find((s) => s.name === subject);
    const selectedChap = selectedSubj?.chapters.find((ch) => ch.name === finalChapter);

    const classId = selectedCls?.id || question?.classId;
    const subjectId = selectedSubj?.id || question?.subjectId;
    const chapterId = selectedChap?.id || question?.chapterId;

    try {
      setIsSubmitting(true);
      const payload: any = {
        classId,
        subjectId,
        chapterId,
        className,
        subject: subject.trim() || activeCategory,
        chapter: finalChapter,
        category: activeCategory,
        type,
        nature,
        difficulty,
        board: board.trim() || undefined,
        year: year.trim() || undefined,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        marks: type === "cq"
          ? subQuestions.reduce((s, sq) => s + (Number(toStandardDigits(sq.marks)) || 0), 0)
          : (Number(toStandardDigits(marks)) || 1),
        options: type === "mcq" ? filledOptions : [],
        correctIndex: type === "mcq" ? correctIndex : 0,
        subQuestions: type === "cq"
          ? subQuestions.map((sq) => ({ ...sq, marks: Number(toStandardDigits(sq.marks)) || 1 }))
          : undefined,
        explanation: explanation.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined
      };

      if (isEditing && question) {
        const updated = await apiRequest<BankQuestion>(`/api/question-bank/${question.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        onSaved(updated);
      } else {
        const created = await apiRequest<BankQuestion>("/api/question-bank", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        onSaved(created);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10MB or smaller.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      try {
        const upload = await apiRequest<{ imageUrl: string }>("/api/uploads/image", {
          method: "POST",
          body: JSON.stringify({ folder: "questions", fileName: file.name, imageData: dataUrl })
        });
        if (upload?.imageUrl) {
          setImageUrl(upload.imageUrl);
          return;
        }
      } catch (uploadErr) {
        console.warn("[QuestionFormModal] Backend upload fallback to data URL:", uploadErr);
      }
      setImageUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4 md:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold">{isEditing ? "Edit Question" : "Add Question to Bank"}</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Supports LaTeX math ($...$) &middot; MCQ &amp; CQ
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto flex-1 min-h-0 px-3.5 sm:px-5 py-3 sm:py-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

          {/* Question Type & Nature Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type:</span>
              <div className="flex rounded-lg border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => { setType("mcq"); setMarks(1); }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    type === "mcq" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Check className="h-3 w-3" /> MCQ
                </button>
                <button
                  type="button"
                  onClick={() => { setType("cq"); setMarks(10); }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    type === "cq" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="h-3 w-3" /> CQ (Creative)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ধরন (Nature):</span>
              <div className="flex rounded-lg border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setNature("theory")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    nature === "theory" ? "border-primary bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📖 তত্ত্বীয় (Theory)
                </button>
                <button
                  type="button"
                  onClick={() => setNature("mathematical")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    nature === "mathematical" ? "border-primary bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔢 গাণিতিক (Math)
                </button>
              </div>
            </div>
          </div>

          {/* Curriculum Hierarchy Row: Class, Subject, Chapter */}
          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>কারিকুলাম ও অধ্যায় (Syllabus &amp; Chapter)</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Class Selector */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">শ্রেণি (Class / Level)</label>
                {hierarchy.length > 0 ? (
                  <select
                    value={className}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                  >
                    {hierarchy.map((cls) => (
                      <option key={cls.className} value={cls.className}>
                        {cls.className}
                      </option>
                    ))}
                    <option value="__custom__">Custom Class...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                  />
                )}
              </div>

              {/* Subject Selector */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">বিষয় (Subject)</label>
                {availableSubjects.length > 0 ? (
                  <select
                    value={subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. পদার্থবিজ্ঞান, রসায়ন"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                  />
                )}
              </div>

              {/* Chapter Selector */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-muted-foreground">অধ্যায় (Chapter)</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomChapter(!isCustomChapter)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {isCustomChapter ? "List" : "Custom"}
                  </button>
                </div>
                {isCustomChapter || availableChapters.length === 0 ? (
                  <input
                    type="text"
                    placeholder="e.g. অধ্যায় ১: ভৌত রাশি"
                    value={customChapterInput}
                    onChange={(e) => setCustomChapterInput(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                  />
                ) : (
                  <select
                    value={chapter}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsCustomChapter(true);
                      } else {
                        setChapter(e.target.value);
                      }
                    }}
                    className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                  >
                    {availableChapters.map((ch) => (
                      <option key={ch.name} value={ch.name}>
                        {ch.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Chapter...</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Dedicated Board & Year Fields */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-500/5 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              <BookOpen className="h-3.5 w-3.5 text-amber-600" />
              <span>বোর্ড ও পরীক্ষার সাল (Board & Year)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">বোর্ড (Education Board)</label>
                <select
                  value={board}
                  onChange={(e) => {
                    setBoard(e.target.value);
                    if (e.target.value && !tags.includes("বোর্ড প্রশ্ন")) {
                      setTags((prev) => [...prev, "বোর্ড প্রশ্ন"]);
                    }
                  }}
                  className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                >
                  <option value="">কোনো বোর্ড নয় (None / General)</option>
                  {[
                    "ঢাকা বোর্ড", "রাজশাহী বোর্ড", "চট্টগ্রাম বোর্ড", "কুমিল্লা বোর্ড",
                    "যশোর বোর্ড", "বরিশাল বোর্ড", "সিলেট বোর্ড", "দিনাজপুর বোর্ড",
                    "ময়মনসিংহ বোর্ড", "মাদ্রাসা বোর্ড", "কারিগরি বোর্ড"
                  ].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">পরীক্ষার সাল (Exam Year)</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border bg-background px-2.5 text-xs font-medium"
                >
                  <option value="">কোনো সাল নয় (None)</option>
                  {["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"].map((y) => (
                    <option key={y} value={y}>{y} ({toBengaliDigits(y)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags & Keywords */}
          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>ট্যাগসমূহ (Tags &amp; Keywords)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBoardHelper(!showBoardHelper)}
                className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-all"
              >
                ✨ {showBoardHelper ? "Close Board Helper" : "📌 Board Helper"}
              </button>
            </div>

            {/* Board Question Quick-Add Assistant */}
            {showBoardHelper && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
                <div className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <span>বোর্ড প্রশ্ন অ্যাসিস্ট্যান্ট (Quick Tag Generator)</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">বোর্ড (Board)</label>
                    <select
                      value={boardIndex}
                      onChange={(e) => setBoardIndex(Number(e.target.value))}
                      className="mt-0.5 h-8 w-full rounded border bg-background px-2 text-xs"
                    >
                      {BD_BOARDS.map((b, idx) => (
                        <option key={idx} value={idx}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">পরীক্ষা (Exam)</label>
                    <select
                      value={boardExam}
                      onChange={(e) => setBoardExam(e.target.value)}
                      className="mt-0.5 h-8 w-full rounded border bg-background px-2 text-xs"
                    >
                      <option value="SSC">SSC</option>
                      <option value="HSC">HSC</option>
                      <option value="Dakhil">Dakhil</option>
                      <option value="Alim">Alim</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">সাল (Year)</label>
                    <select
                      value={boardYear}
                      onChange={(e) => setBoardYear(e.target.value)}
                      className="mt-0.5 h-8 w-full rounded border bg-background px-2 text-xs"
                    >
                      {BD_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} ({toBengaliDigits(yr)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleBoardHelperAdd}
                    className="h-7 text-xs bg-primary text-primary-foreground"
                  >
                    + Add Board Tags ({BD_BOARDS[boardIndex]?.bangla} {toBengaliDigits(boardYear)})
                  </Button>
                </div>
              </div>
            )}

            {/* Current Tags Chips */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
              {tags.length === 0 ? (
                <span className="text-[11px] text-muted-foreground italic">No tags added yet. Type below or use the Board Helper.</span>
              ) : (
                tags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    #{tg}
                    <button
                      type="button"
                      onClick={() => removeTag(tg)}
                      className="hover:text-destructive focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Tag Input Field */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type tag (e.g. ঢাকা বোর্ড ২০২৩, গাণিতিক সমস্যা) &amp; press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                className="h-8 flex-1 rounded-md border bg-background px-2.5 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(tagInput)}
                className="h-8 text-xs"
              >
                + Add Tag
              </Button>
            </div>

            {/* Popular Tags suggestions */}
            {popularTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">জনপ্রিয় ট্যাগ:</span>
                {popularTags.slice(0, 8).map((pt) => {
                  const already = tags.includes(pt.name);
                  return (
                    <button
                      key={pt.name}
                      type="button"
                      disabled={already}
                      onClick={() => addTag(pt.name)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] transition-all ${
                        already
                          ? "opacity-40 border-muted text-muted-foreground cursor-default"
                          : "border-border bg-background hover:border-primary hover:text-primary"
                      }`}
                    >
                      + {pt.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Difficulty & Marks */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <div className="mt-1 flex h-9 rounded-md border bg-muted/40 p-0.5">
                {(["easy", "medium", "hard"] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 rounded text-xs font-medium capitalize transition-all ${
                      difficulty === diff ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Total Marks</label>
              <input
                type="text"
                inputMode="decimal"
                value={type === "cq" ? subQuestions.reduce((s, sq) => s + (Number(toStandardDigits(sq.marks)) || 0), 0) : marks}
                onChange={(e) => {
                  const val = toStandardDigits(e.target.value);
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setMarks(val);
                  }
                }}
                onBlur={() => {
                  const num = parseFloat(toStandardDigits(marks));
                  setMarks(isNaN(num) || num <= 0 ? 1 : num);
                }}
                disabled={type === "cq"}
                placeholder="1"
                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-xs"
              />
            </div>
          </div>

          {/* Title or Stem */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                {type === "cq" ? "Stem / উদ্দীপক (Context Scenario)" : "Question Title"}
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-primary hover:underline"
              >
                {showPreview ? "Hide Preview" : "Show Math Preview"}
              </button>
            </div>
            <textarea
              rows={type === "cq" ? 4 : 2}
              placeholder={type === "cq" ? "Describe the experimental scenario, data table, or physical context..." : "e.g. What is the value of $\\sin^2\\theta + \\cos^2\\theta$?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
            {showPreview && title && (
              <div className="mt-2 rounded-md border bg-muted/30 p-3 text-xs">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">Preview:</p>
                <MathRenderer text={title} />
              </div>
            )}
          </div>

          {/* Question Image (Optional) */}
          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">প্রশ্ন চিত্র (Question Image - Optional)</p>
                <p className="text-[11px] text-muted-foreground">Add a diagram, formula figure, circuit, or geometry chart</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImageModalOpen(true)}
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
                    onChange={(event) => handleImageUpload(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
            {imageUrl && (
              <div className="mt-2 flex items-start gap-3">
                {imageUrl.trim().startsWith("<svg") ? (
                  <div
                    className="h-24 w-32 rounded-lg border overflow-hidden flex items-center justify-center bg-white p-1 [&>svg]:max-h-full [&>svg]:w-auto shrink-0 shadow-xs"
                    dangerouslySetInnerHTML={{ __html: imageUrl }}
                  />
                ) : (
                  <img src={imageUrl} alt="" className="h-24 w-32 rounded-lg border object-contain bg-white shrink-0 shadow-xs" />
                )}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageModalOpen(true)}
                    className="text-xs text-primary hover:bg-primary/10 h-7 px-2 justify-start"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Change / Re-import
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageUrl("")}
                    className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 justify-start"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove Image
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* MCQ: Options */}
          {type === "mcq" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Options (Click circle to select the correct answer)
                </label>
                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Option
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-2">
                {options.map((option, index) => {
                  const label = String.fromCharCode(65 + index);
                  const isCorrect = correctIndex === index;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Mark option ${label} as correct`}
                        onClick={() => setCorrectIndex(index)}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                          isCorrect
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-muted-foreground/30 text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {isCorrect ? <Check className="h-4 w-4" /> : label}
                      </button>
                      <input
                        type="text"
                        placeholder={`Option ${label}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className={`h-9 flex-1 rounded-md border px-3 text-xs bg-background ${
                          isCorrect ? "border-primary/60 ring-1 ring-primary/30" : ""
                        }`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          aria-label={`Delete option ${label}`}
                          onClick={() => removeOption(index)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CQ: 4 Sub-questions */}
          {type === "cq" && (
            <div className="space-y-3 rounded-xl border bg-muted/10 p-3.5">
              <label className="text-xs font-semibold text-foreground">
                Creative Question Parts (NCTB 4-Part Structure)
              </label>
              <div className="space-y-3">
                {subQuestions.map((sq, idx) => (
                  <div key={idx} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          {sq.label}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {idx === 0 ? "জ্ঞানমূলক (Knowledge)" : idx === 1 ? "অনুধাবনমূলক (Comprehension)" : idx === 2 ? "প্রয়োগমূলক (Application)" : "উচ্চতর দক্ষতা (Higher-order)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Marks:</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={sq.marks}
                          onChange={(e) => {
                            const val = toStandardDigits(e.target.value);
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                              updateSubQuestion(idx, { marks: val as any });
                            }
                          }}
                          onBlur={() => {
                            const num = parseFloat(toStandardDigits(sq.marks));
                            updateSubQuestion(idx, { marks: isNaN(num) || num <= 0 ? 1 : num });
                          }}
                          className="w-14 h-6 rounded border bg-background px-1.5 text-xs text-center font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder={`Question (${sq.label}) text...`}
                      value={sq.text}
                      onChange={(e) => updateSubQuestion(idx, { text: e.target.value })}
                      className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                    />

                    <input
                      type="text"
                      placeholder={`Answer / Rubric for (${sq.label}) — Optional`}
                      value={sq.answer || ""}
                      onChange={(e) => updateSubQuestion(idx, { answer: e.target.value })}
                      className="h-8 w-full rounded-md border bg-background px-2.5 text-xs text-muted-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">General Explanation (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Theoretical background or solution notes."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background p-2.5 text-xs outline-none focus:border-primary resize-y"
            />
          </div>

          </form>
        </div>

        {/* FOOTER — fixed at bottom */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3 sm:py-4 border-t bg-card shrink-0">
          <p className="text-[11px] text-muted-foreground">* Required fields</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} onClick={handleSubmit as any}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Question" : "Save to Bank"}
            </Button>
          </div>
        </div>

      </div>

      {/* Import Image Modal */}
      <ImportImageModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onApplyImage={(url) => setImageUrl(url)}
        currentImageUrl={imageUrl}
        questionTitle={title}
        subjectContext={subject}
      />
    </div>
  );
}
