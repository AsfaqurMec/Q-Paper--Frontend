import { useMemo, useState } from "react";
import { BadgeCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { MathRenderer } from "@/components/math-renderer";
import { sanitizeSvg } from "@/lib/sanitize";

export type PreviewQuestion = {
  id: string;
  number?: string;
  type: "mcq" | "cq";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  marks: number;
  options: Array<{ id: string; label: string; text: string; isCorrect?: boolean }>;
  subQuestions?: Array<{ id: string; label?: string; text: string; marks: number }>;
};

type PaperPreviewProps = {
  paper?: {
    institute?: string;
    name: string;
    subject: string;
    className: string;
    duration: string;
    totalMarks: number;
    instructions?: string;
    questionsPerPage: number;
    layout: "single" | "split";
    cqLayout?: "single" | "split";
    optionLabelStyle?: "upper-alpha" | "bangla" | "lower-alpha" | "numeric";
    setName?: string;
    mcqSectionTitle?: string;
    cqSectionTitle?: string;
  };
  questions?: PreviewQuestion[];
  layout?: "single" | "split";
  cqLayout?: "single" | "split";
  questionsPerPage?: number;
  activeSet?: string;
  onMoveQuestion?: (fromIndex: number, toIndex: number) => void;
  onUpdateQuestionSerial?: (questionId: string, newSerial: string) => void;
};

const fallbackQuestions: PreviewQuestion[] = [
  {
    id: "sample-1",
    type: "mcq",
    title: "কাজ করার সামর্থ্যকে কী বলে?",
    marks: 1,
    options: [
      { id: "a", label: "A", text: "বল" },
      { id: "b", label: "B", text: "শক্তি" },
      { id: "c", label: "C", text: "ক্ষমতা" },
      { id: "d", label: "D", text: "ত্বরণ" }
    ]
  },
  {
    id: "sample-2",
    type: "mcq",
    title: "কাজের এসআই (SI) একক কোনটি?",
    marks: 1,
    options: [
      { id: "a", label: "A", text: "জুল (J)" },
      { id: "b", label: "B", text: "ওয়াট (W)" },
      { id: "c", label: "C", text: "প্যাসকেল (Pa)" },
      { id: "d", label: "D", text: "নিউটন (N)" }
    ]
  }
];

function estimateQuestionHeight(q: PreviewQuestion, isSplit: boolean): number {
  const lineChars = isSplit ? 38 : 78;
  const titleLines = Math.max(1, Math.ceil((q.title || "").length / lineChars));
  let h = 26 + titleLines * 16;
  if (q.subtitle) {
    const subLines = Math.max(1, Math.ceil(q.subtitle.length / lineChars));
    h += subLines * 14 + 4;
  }
  if (q.imageUrl) h += isSplit ? 100 : 120;
  if (q.type === "cq" && q.subQuestions?.length) {
    h += q.subQuestions.length * (isSplit ? 32 : 26) + 6;
  } else if (q.options?.length) {
    h += Math.ceil(q.options.length / 2) * 22 + 6;
  }
  return h + 10;
}

function splitForPage<T extends PreviewQuestion>(items: T[], perPage: number = 10, pageIndex: number = 0, isSplit: boolean = true) {
  const maxColHeight = pageIndex === 0 ? 540 : 660;
  const maxLeftCapacity = perPage > 0 ? Math.ceil(perPage / 2) : Infinity;
  let leftHeight = 0;
  let splitIndex = items.length;

  for (let i = 0; i < items.length; i++) {
    const h = estimateQuestionHeight(items[i], isSplit);
    // If left already has items and adding this exceeds left column height or capacity:
    // Shift this question and remainder to right column!
    if (i > 0 && (leftHeight + h > maxColHeight || i >= maxLeftCapacity)) {
      splitIndex = i;
      break;
    }
    leftHeight += h;
  }

  return {
    left: items.slice(0, splitIndex),
    right: items.slice(splitIndex)
  };
}

function paginatePreviewQuestions(
  questions: PreviewQuestion[],
  isMcqSplit: boolean,
  isCqSplit: boolean,
  perPage: number
): PreviewQuestion[][] {
  const pages: PreviewQuestion[][] = [];
  let currentIndex = 0;

  while (currentIndex < questions.length) {
    const pageIndex = pages.length;
    const maxColHeight = pageIndex === 0 ? 540 : 660;
    const maxPageCapacity = perPage > 0 ? perPage : Infinity;
    const maxLeftCapacity = perPage > 0 ? Math.ceil(perPage / 2) : Infinity;

    const pageItems: PreviewQuestion[] = [];
    let leftH = 0;
    let rightH = 0;
    let inLeft = true;

    while (currentIndex < questions.length) {
      const q = questions[currentIndex];
      const qSplit = q.type === "cq" ? isCqSplit : isMcqSplit;
      const h = estimateQuestionHeight(q, qSplit);

      if (qSplit) {
        if (inLeft) {
          if (pageItems.length > 0 && (leftH + h > maxColHeight || pageItems.length >= maxLeftCapacity)) {
            // Shift to right side of the page
            inLeft = false;
          } else {
            pageItems.push(q);
            leftH += h;
            currentIndex++;
            continue;
          }
        }

        // Now placing in right column
        if (pageItems.length > 0 && (rightH + h > maxColHeight || pageItems.length >= maxPageCapacity)) {
          // Cannot fit in right column either, shift to next page!
          break;
        }

        pageItems.push(q);
        rightH += h;
        currentIndex++;
      } else {
        // Single column layout
        if (pageItems.length > 0 && (leftH + h > maxColHeight || pageItems.length >= maxPageCapacity)) {
          break;
        }
        pageItems.push(q);
        leftH += h;
        currentIndex++;
      }
    }

    pages.push(pageItems);
  }

  return pages.length ? pages : [[]];
}

function toBn(n: number | string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => bn[Number(d)]);
}

function QuestionBlock({
  question,
  index,
  globalIndex,
  isBangla = true,
  optionLabelStyle,
  onMoveQuestion,
  onUpdateQuestionSerial,
  draggedIndex,
  dragOverIndex,
  setDraggedIndex,
  setDragOverIndex
}: {
  question: PreviewQuestion;
  index: number;
  globalIndex: number;
  isBangla?: boolean;
  optionLabelStyle?: string;
  onMoveQuestion?: (fromIndex: number, toIndex: number) => void;
  onUpdateQuestionSerial?: (questionId: string, newSerial: string) => void;
  draggedIndex?: number | null;
  dragOverIndex?: number | null;
  setDraggedIndex?: (idx: number | null) => void;
  setDragOverIndex?: (idx: number | null) => void;
}) {
  const markLabel = isBangla
    ? `${toBn(question.marks || 1)} নম্বর`
    : `${question.marks || 1} mark${Number(question.marks || 1) === 1 ? "" : "s"}`;
  const rawSerial = question.number && question.number.trim()
    ? question.number.trim()
    : (isBangla ? `${toBn(index + 1)}` : `${index + 1}`);
  const serial = rawSerial.endsWith(".") || rawSerial.endsWith("।") ? rawSerial : `${rawSerial}.`;
  const cleanTitle = (question.title || "Untitled question").replace(/^(\d+|[\u09E6-\u09EF]+|[A-Za-z]+)[\.\:\)]\s*/, "");

  const isDraggingThis = draggedIndex === globalIndex;
  const isDragOverThis = dragOverIndex === globalIndex;

  const banglaOptMap: Record<string, string> = {
    A: "(ক)", B: "(খ)", C: "(গ)", D: "(ঘ)",
    a: "(ক)", b: "(খ)", c: "(গ)", d: "(ঘ)",
    "১": "(ক)", "২": "(খ)", "৩": "(গ)", "৪": "(ঘ)",
    "ক": "(ক)", "খ": "(খ)", "গ": "(গ)", "ঘ": "(ঘ)"
  };

  const banglaCqMap: Record<string, string> = {
    A: "(ক)", B: "(খ)", C: "(গ)", D: "(ঘ)",
    a: "(ক)", b: "(খ)", c: "(গ)", d: "(ঘ)",
    "১": "(ক)", "২": "(খ)", "৩": "(গ)", "৪": "(ঘ)",
    "ক": "(ক)", "খ": "(খ)", "গ": "(গ)", "ঘ": "(ঘ)"
  };

  return (
    <div
      onDragOver={(e) => {
        if (onMoveQuestion && draggedIndex !== null) {
          e.preventDefault();
          if (dragOverIndex !== globalIndex) {
            setDragOverIndex?.(globalIndex);
          }
        }
      }}
      onDragLeave={() => {
        if (onMoveQuestion && dragOverIndex === globalIndex) {
          setDragOverIndex?.(null);
        }
      }}
      onDrop={(e) => {
        if (onMoveQuestion) {
          e.preventDefault();
          const from = draggedIndex ?? Number(e.dataTransfer.getData("text/plain"));
          if (!isNaN(from) && from !== globalIndex) {
            onMoveQuestion(from, globalIndex);
          }
          setDraggedIndex?.(null);
          setDragOverIndex?.(null);
        }
      }}
      className={cn(
        "break-inside-avoid rounded-md border border-slate-200 p-2.5 text-slate-900 bg-white shadow-2xs transition-all duration-150",
        isDragOverThis && "ring-2 ring-teal-500 border-teal-500 bg-teal-50/40 shadow-md scale-[1.01]",
        isDraggingThis && "opacity-40 border-dashed border-teal-400"
      )}
    >
      {/* Question Header: Serial number clearly on the left (with edit & drag if interactive), question text beside it */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 font-semibold text-slate-900 leading-snug flex-1 min-w-0">
          {/* Drag Handle */}
          {onMoveQuestion && (
            <div
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData("text/plain", String(globalIndex));
                e.dataTransfer.effectAllowed = "move";
                setDraggedIndex?.(globalIndex);
              }}
              onDragEnd={() => {
                setDraggedIndex?.(null);
                setDragOverIndex?.(null);
              }}
              className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors -ml-1 shrink-0 select-none"
              title="Drag and drop to change question serial / order"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Serial Number (Editable or Static) */}
          {onUpdateQuestionSerial ? (
            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={question.number !== undefined && question.number !== "" ? question.number : (isBangla ? toBn(globalIndex + 1) : String(globalIndex + 1))}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdateQuestionSerial(question.id, e.target.value);
                }}
                title="Click to edit question serial number (e.g. 1, ১, Q1)"
                aria-label={`Question serial ${globalIndex + 1}`}
                className="h-6 w-9 shrink-0 rounded border border-slate-300 bg-slate-50/90 text-center text-xs font-bold text-slate-900 shadow-2xs hover:border-teal-500 hover:bg-white focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-colors"
              />
              <span className="font-bold text-slate-800 text-xs">.</span>
            </div>
          ) : (
            <span className="shrink-0 font-bold text-slate-950 min-w-[22px]">{serial}</span>
          )}

          <div className="flex-1 min-w-0">
            <MathRenderer text={cleanTitle} />
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-slate-500 font-medium whitespace-nowrap pt-0.5">{markLabel}</span>
      </div>

      {/* Subtitle / context (indented to match question body) */}
      {question.subtitle && (
        <div className="mt-1 ml-6 sm:ml-7 text-xs text-slate-600">
          <MathRenderer as="p" text={question.subtitle} />
        </div>
      )}

      {/* Image (indented to match question body) */}
      {question.imageUrl && (
        <div className="mt-2 ml-6 sm:ml-7">
          {question.imageUrl.trim().startsWith("<svg") ? (
            <div
              className="max-h-36 overflow-auto [&>svg]:max-h-36 [&>svg]:w-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(question.imageUrl) }}
            />
          ) : (
            <img src={question.imageUrl} alt="" className="max-h-36 rounded-sm border object-contain" />
          )}
        </div>
      )}

      {/* CQ Sub-questions: Indented to the right of the serial number */}
      {question.type === "cq" ? (
        <div className="mt-2.5 ml-6 sm:ml-7 space-y-1.5 text-xs text-slate-700">
          {(question.subQuestions ?? []).map((item, itemIndex) => {
            const fallbackLabel = isBangla
              ? ["(ক)", "(খ)", "(গ)", "(ঘ)"][itemIndex] || `(${toBn(itemIndex + 1)})`
              : `${String.fromCharCode(97 + itemIndex)}.`;
            const displayLabel = item.label
              ? (isBangla ? (banglaCqMap[item.label] || (item.label.includes("(") ? item.label : `(${item.label})`)) : `${item.label}.`)
              : fallbackLabel;

            return (
              <div key={item.id || itemIndex} className="flex items-start justify-between gap-2 border-b border-slate-100/80 pb-1 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 shrink-0 min-w-[20px]">{displayLabel}</span>
                  <span className="flex-1 min-w-0 leading-snug">
                    <MathRenderer text={item.text || "Question"} />
                  </span>
                </div>
                <span className="text-slate-500 shrink-0 text-[11px] font-medium pl-2">
                  {isBangla ? `${toBn(item.marks)} নম্বর` : `${item.marks} mark${Number(item.marks) === 1 ? "" : "s"}`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* MCQ Options: Indented to the right of the serial number */
        <div className="mt-2.5 ml-6 sm:ml-7 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-700">
          {question.options.map((option, optIdx) => {
            const isBanglaOptions = optionLabelStyle === "bangla" || (!optionLabelStyle && isBangla);
            const fallbackLabel = isBanglaOptions
              ? ["(ক)", "(খ)", "(গ)", "(ঘ)"][optIdx] || `(${toBn(optIdx + 1)})`
              : (option.label ? (option.label.endsWith(".") || option.label.includes("(") ? option.label : `(${option.label})`) : `(${String.fromCharCode(65 + optIdx)})`);
            const displayLabel = isBanglaOptions
              ? (banglaOptMap[option.label] || fallbackLabel)
              : fallbackLabel;

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-start gap-1.5 leading-snug",
                  option.isCorrect && "font-semibold text-teal-700"
                )}
              >
                <span className="shrink-0 font-medium min-w-[18px] text-slate-800">{displayLabel}</span>
                <span className="flex-1 min-w-0">
                  <MathRenderer text={option.text || "Option"} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHeadline({
  titleBangla,
  titleEnglish,
  isBangla,
  instructions
}: {
  titleBangla: string;
  titleEnglish: string;
  isBangla: boolean;
  instructions?: string;
}) {
  return (
    <div className="col-span-full my-3 rounded border border-slate-300 bg-slate-100/90 px-3 py-1.5 text-slate-900">
      <div className="font-bold text-xs sm:text-sm">
        <span>{isBangla ? titleBangla : titleEnglish}</span>
      </div>
      {instructions && <p className="mt-0.5 text-[11px] text-slate-600 italic">{instructions}</p>}
    </div>
  );
}

export function PaperPreview({
  paper,
  questions,
  layout,
  cqLayout,
  questionsPerPage,
  activeSet,
  onMoveQuestion,
  onUpdateQuestionSerial
}: PaperPreviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const resolvedLayout = paper?.layout ?? layout ?? "split";
  const resolvedCqLayout = paper?.cqLayout ?? cqLayout ?? paper?.layout ?? layout ?? "split";
  const resolvedQuestionsPerPage = Number(paper?.questionsPerPage ?? questionsPerPage ?? 10);
  const resolvedQuestions = questions?.length ? questions : fallbackQuestions;
  const isMcqSplit = resolvedLayout === "split";
  const isCqSplit = resolvedCqLayout === "split";
  const setName = activeSet || paper?.setName;

  // Language detection (Bangla vs English)
  const isBangla = useMemo(() => {
    const textToCheck = `${paper?.subject || ""} ${paper?.name || ""} ${resolvedQuestions[0]?.title || ""}`;
    return /[\u0980-\u09FF]/.test(textToCheck) || !(paper?.subject?.toLowerCase().includes("english"));
  }, [paper, resolvedQuestions]);

  // Separate MCQs and CQs
  const mcqs = useMemo(() => resolvedQuestions.filter((q) => (q.type || "mcq") === "mcq"), [resolvedQuestions]);
  const cqs = useMemo(() => resolvedQuestions.filter((q) => q.type === "cq"), [resolvedQuestions]);

  const mcqTotalMarks = useMemo(() => mcqs.reduce((sum: number, q: PreviewQuestion) => sum + (q.marks || 1), 0), [mcqs]);
  const cqTotalMarks = useMemo(() => cqs.reduce((sum: number, q: PreviewQuestion) => sum + (q.marks || 10), 0), [cqs]);
  const hasBoth = mcqs.length > 0 && cqs.length > 0;

  // Paginate questions
  const pages = paginatePreviewQuestions(resolvedQuestions, isMcqSplit, isCqSplit, resolvedQuestionsPerPage);

  const renderQuestionBlock = (question: PreviewQuestion, displayIndex: number) => {
    const globalIndex = resolvedQuestions.findIndex((q) => q.id === question.id);
    return (
      <QuestionBlock
        key={question.id}
        question={question}
        index={displayIndex}
        globalIndex={globalIndex >= 0 ? globalIndex : displayIndex}
        isBangla={isBangla}
        optionLabelStyle={paper?.optionLabelStyle}
        onMoveQuestion={onMoveQuestion}
        onUpdateQuestionSerial={onUpdateQuestionSerial}
        draggedIndex={draggedIndex}
        dragOverIndex={dragOverIndex}
        setDraggedIndex={setDraggedIndex}
        setDragOverIndex={setDragOverIndex}
      />
    );
  };

  return (
    <div className="paper-preview space-y-4 rounded-lg border bg-card p-2 sm:p-3.5 md:p-4">
      {onMoveQuestion && (
        <div className="flex items-center justify-between rounded-md border border-teal-200 bg-teal-50/70 px-2.5 py-1.5 text-xs text-teal-900 shadow-2xs">
          <span className="flex items-center gap-1.5 font-medium">
            <GripVertical className="h-4 w-4 text-teal-700" />
            <span>
              <strong>Drag questions</strong> to reorder serials &bull; Click serial number box to edit directly
            </span>
          </span>
          <span className="text-[11px] font-semibold text-teal-700 hidden xs:inline">Live Preview</span>
        </div>
      )}

      {pages.map((pageQuestions, pageIndex) => {
        const pageMcqs = pageQuestions.filter((q) => (q.type || "mcq") === "mcq");
        const pageCqs = pageQuestions.filter((q) => q.type === "cq");

        // Determine if section headlines start on this page
        const isFirstPage = pageIndex === 0;
        const prevPagesQuestions = pages.slice(0, pageIndex).flat();
        const prevMcqCount = prevPagesQuestions.filter((q) => (q.type || "mcq") === "mcq").length;
        const prevCqCount = prevPagesQuestions.filter((q) => q.type === "cq").length;

        const showMcqHeader = pageMcqs.length > 0 && prevMcqCount === 0;
        const showCqHeader = pageCqs.length > 0 && prevCqCount === 0;

        const mcqSplit = isMcqSplit ? splitForPage(pageMcqs, resolvedQuestionsPerPage, pageIndex, true) : { left: pageMcqs, right: [] };
        const cqSplit = isCqSplit ? splitForPage(pageCqs, resolvedQuestionsPerPage, pageIndex, true) : { left: pageCqs, right: [] };

        return (
          <div key={pageIndex} className="mx-auto min-h-[520px] max-w-3xl rounded-sm bg-white p-3.5 sm:p-6 md:p-8 text-slate-950 shadow-soft">
            {isFirstPage && (
              <div className="border-b pb-4 text-center">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-10 sm:w-16 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-teal-700 truncate">{paper?.institute ?? ""}</p>
                  {setName ? (() => {
                    const banglaSetMap: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
                    const displaySet = isBangla ? (banglaSetMap[setName.toUpperCase()] || setName) : setName;
                    return (
                      <span className="inline-flex items-center rounded-md bg-teal-50 border border-teal-300 px-2 py-0.5 text-xs font-bold text-teal-800 shrink-0">
                        {isBangla ? `সেট: ${displaySet}` : `Set: ${displaySet}`}
                      </span>
                    );
                  })() : <span className="w-10 sm:w-16 shrink-0" />}
                </div>
                <h2 className="mt-1.5 text-lg sm:text-xl font-bold">{paper?.name ?? "Model Test Examination"}</h2>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-slate-700">
                  <span>{paper?.className ?? "Class 10"}</span>
                  <span>{paper?.subject ?? "General"}</span>
                  <span>{isBangla ? `সময়: ${paper?.duration ?? "২ ঘণ্টা"}` : `Time: ${paper?.duration ?? "2 hours"}`}</span>
                  <span>{isBangla ? `পূর্ণমান: ${paper?.totalMarks ?? 100}` : `Marks: ${paper?.totalMarks ?? 100}`}</span>
                </div>
                {paper?.instructions && <p className="mt-2.5 text-xs text-slate-600">{paper.instructions}</p>}
              </div>
            )}

            {/* MCQ SECTION */}
            {pageMcqs.length > 0 && (
              <div className={isFirstPage ? "mt-4" : ""}>
                {showMcqHeader && (
                  <SectionHeadline
                    titleBangla={paper?.mcqSectionTitle?.trim() || (hasBoth ? "ক-বিভাগ: বহু-নির্বাচনী প্রশ্ন" : "বহু-নির্বাচনী প্রশ্ন")}
                    titleEnglish={paper?.mcqSectionTitle?.trim() || (hasBoth ? "Section A: Multiple Choice Questions (MCQ)" : "Multiple Choice Questions (MCQ)")}
                    isBangla={isBangla}
                    instructions={
                      isBangla
                        ? "সকল প্রশ্নের উত্তর দিতে হবে। প্রতিটি প্রশ্নের মান ১।"
                        : "Answer all questions. Each question carries 1 mark."
                    }
                  />
                )}

                {isMcqSplit ? (
                  <div className="relative grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -translate-x-1/2" />
                    <div className="space-y-3">
                      {mcqSplit.left.map((question, index) => renderQuestionBlock(question, prevMcqCount + index))}
                    </div>
                    <div className="space-y-3">
                      {mcqSplit.right.map((question, index) => renderQuestionBlock(question, prevMcqCount + mcqSplit.left.length + index))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-y-3 text-sm">
                    {pageMcqs.map((question, index) => renderQuestionBlock(question, prevMcqCount + index))}
                  </div>
                )}
              </div>
            )}

            {/* CQ SECTION (DYNAMIC: 2 SPLIT LAYOUT OR SINGLE LAYOUT) */}
            {pageCqs.length > 0 && (
              <div className={pageMcqs.length > 0 ? "mt-6" : isFirstPage ? "mt-4" : ""}>
                {showCqHeader && (
                  <SectionHeadline
                    titleBangla={paper?.cqSectionTitle?.trim() || (hasBoth ? "খ-বিভাগ: সৃজনশীল প্রশ্ন" : "সৃজনশীল প্রশ্ন")}
                    titleEnglish={paper?.cqSectionTitle?.trim() || (hasBoth ? "Section B: Creative Questions (CQ)" : "Creative Questions (CQ)")}
                    isBangla={isBangla}
                    instructions={
                      isBangla
                        ? "প্রতিটি উদ্দীপক পড়ে সংশ্লিষ্ট প্রশ্নগুলোর উত্তর দাও। প্রতিটির মান ১০ (১+২+৩+৪)।"
                        : "Read each scenario carefully and answer all sub-questions (10 marks each)."
                    }
                  />
                )}

                {isCqSplit ? (
                  <div className="relative grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -translate-x-1/2" />
                    <div className="space-y-3">
                      {cqSplit.left.map((question, index) => renderQuestionBlock(question, mcqs.length + prevCqCount + index))}
                    </div>
                    <div className="space-y-3">
                      {cqSplit.right.map((question, index) => renderQuestionBlock(question, mcqs.length + prevCqCount + cqSplit.left.length + index))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-y-3 text-sm">
                    {pageCqs.map((question, index) => renderQuestionBlock(question, mcqs.length + prevCqCount + index))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t pt-4 text-xs text-slate-500">
              <span>Page {pageIndex + 1} of {pages.length}</span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-teal-700" />
                {setName ? `Set ${setName} - Answer key active` : "Answer key updates automatically"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

