"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Clipboard,
  Compass,
  Globe,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";
import type { BankQuestion } from "@/lib/api-types";

type TabMode = "url" | "bank" | "upload" | "templates";

type ImportImageModalProps = {
  open: boolean;
  onClose: () => void;
  onApplyImage: (imageUrl: string) => void;
  currentImageUrl?: string;
  questionTitle?: string;
  subjectContext?: string;
};

// Curated high-utility educational SVG diagram templates
const DIAGRAM_TEMPLATES = [
  {
    id: "right-triangle",
    title: "Right Triangle (সমকোণী ত্রিভুজ)",
    category: "Math / Geometry",
    svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <polygon points="40,140 200,140 40,30" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" />
  <rect x="40" y="125" width="15" height="15" fill="none" stroke="#16a34a" stroke-width="2" />
  <text x="30" y="25" font-size="12" font-family="sans-serif" font-weight="bold" fill="#15803d">A</text>
  <text x="25" y="155" font-size="12" font-family="sans-serif" font-weight="bold" fill="#15803d">B</text>
  <text x="205" y="155" font-size="12" font-family="sans-serif" font-weight="bold" fill="#15803d">C</text>
  <text x="20" y="90" font-size="11" font-family="sans-serif" fill="#374151">h (লম্ব)</text>
  <text x="115" y="160" font-size="11" font-family="sans-serif" fill="#374151">b (ভূমি)</text>
  <text x="130" y="80" font-size="11" font-family="sans-serif" fill="#374151">c (অতিভুজ)</text>
</svg>`
  },
  {
    id: "cartesian-plane",
    title: "Coordinate Plane (স্থানাঙ্ক ব্যবস্থা)",
    category: "Math / Graph",
    svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
    </marker>
  </defs>
  <line x1="20" y1="90" x2="220" y2="90" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="120" y1="165" x2="120" y2="15" stroke="#374151" stroke-width="2" marker-end="url(#arrow)" />
  <text x="222" y="94" font-size="11" font-weight="bold" fill="#1f2937">X</text>
  <text x="12" y="94" font-size="11" font-weight="bold" fill="#1f2937">X'</text>
  <text x="116" y="12" font-size="11" font-weight="bold" fill="#1f2937">Y</text>
  <text x="116" y="176" font-size="11" font-weight="bold" fill="#1f2937">Y'</text>
  <circle cx="120" cy="90" r="3" fill="#ef4444" />
  <text x="124" y="103" font-size="10" fill="#6b7280">O(0,0)</text>
  <circle cx="170" cy="50" r="3.5" fill="#2563eb" />
  <text x="175" y="48" font-size="10" font-weight="bold" fill="#2563eb">P(x, y)</text>
</svg>`
  },
  {
    id: "simple-circuit",
    title: "Electric Circuit (বর্তনী ও রোধ)",
    category: "Physics",
    svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <rect x="35" y="35" width="170" height="110" fill="none" stroke="#2563eb" stroke-width="2" rx="4" />
  <rect x="90" y="30" width="60" height="10" fill="#ffffff" />
  <path d="M 90 35 L 98 25 L 106 45 L 114 25 L 122 45 L 130 25 L 138 45 L 144 35 L 150 35" fill="none" stroke="#dc2626" stroke-width="2.5" />
  <text x="110" y="20" font-size="11" font-family="sans-serif" font-weight="bold" fill="#dc2626">R (রোধ)</text>
  <rect x="95" y="140" width="50" height="10" fill="#ffffff" />
  <line x1="110" y1="135" x2="110" y2="155" stroke="#16a34a" stroke-width="3" />
  <line x1="122" y1="140" x2="122" y2="150" stroke="#16a34a" stroke-width="1.5" />
  <text x="103" y="132" font-size="10" font-weight="bold" fill="#16a34a">+</text>
  <text x="123" y="132" font-size="10" font-weight="bold" fill="#16a34a">-</text>
  <text x="135" y="150" font-size="11" font-weight="bold" fill="#16a34a">V</text>
  <text x="45" y="95" font-size="10" fill="#2563eb">I →</text>
</svg>`
  },
  {
    id: "simple-pendulum",
    title: "Simple Pendulum (সরল দোলক)",
    category: "Physics",
    svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <line x1="70" y1="20" x2="170" y2="20" stroke="#374151" stroke-width="3" />
  <line x1="120" y1="20" x2="120" y2="140" stroke="#9ca3af" stroke-dasharray="3,3" stroke-width="1.5" />
  <line x1="120" y1="20" x2="160" y2="125" stroke="#2563eb" stroke-width="2" />
  <circle cx="160" cy="125" r="12" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" />
  <circle cx="120" cy="140" r="10" fill="#e5e7eb" stroke="#9ca3af" stroke-dasharray="2,2" stroke-width="1.5" />
  <path d="M 120 70 A 50 50 0 0 1 133 67" fill="none" stroke="#dc2626" stroke-width="1.5" />
  <text x="125" y="85" font-size="10" fill="#dc2626">θ</text>
  <text x="135" y="60" font-size="10" fill="#2563eb">L</text>
  <text x="175" y="130" font-size="11" font-weight="bold" fill="#1e3a8a">m (বব)</text>
</svg>`
  },
  {
    id: "inclined-plane",
    title: "Inclined Plane (আনত তল)",
    category: "Physics",
    svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <polygon points="30,140 210,140 210,50" fill="#f8fafc" stroke="#475569" stroke-width="2.5" />
  <path d="M 60 140 A 30 30 0 0 0 54 125" fill="none" stroke="#dc2626" stroke-width="1.5" />
  <text x="65" y="135" font-size="10" fill="#dc2626">θ</text>
  <g transform="translate(130, 90) rotate(-26.5)">
    <rect x="-15" y="-20" width="30" height="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" rx="2" />
    <text x="-6" y="-6" font-size="10" font-weight="bold" fill="#ffffff">m</text>
  </g>
  <text x="110" y="158" font-size="10" fill="#475569">Base</text>
  <text x="215" y="98" font-size="10" fill="#475569">h</text>
</svg>`
  },
  {
    id: "circle-geometry",
    title: "Circle & Arc (বৃত্ত ও চাপ)",
    category: "Math / Geometry",
    svg: `<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
  <circle cx="120" cy="90" r="55" fill="#f0f9ff" stroke="#0284c7" stroke-width="2" />
  <circle cx="120" cy="90" r="3" fill="#0369a1" />
  <line x1="120" y1="90" x2="175" y2="90" stroke="#0369a1" stroke-width="1.8" />
  <line x1="120" y1="90" x2="159" y2="51" stroke="#0369a1" stroke-width="1.8" />
  <path d="M 140 90 A 20 20 0 0 0 134 76" fill="none" stroke="#e11d48" stroke-width="1.8" />
  <text x="138" y="82" font-size="10" fill="#e11d48">θ</text>
  <text x="110" y="94" font-size="10" font-weight="bold" fill="#0369a1">O</text>
  <text x="145" y="104" font-size="10" fill="#0369a1">r</text>
  <text x="180" y="94" font-size="10" font-weight="bold" fill="#0284c7">A</text>
  <text x="163" y="47" font-size="10" font-weight="bold" fill="#0284c7">B</text>
  <text x="175" y="70" font-size="10" fill="#e11d48">s = rθ</text>
</svg>`
  }
];

export function ImportImageModal({
  open,
  onClose,
  onApplyImage,
  currentImageUrl = "",
  questionTitle = "",
  subjectContext = ""
}: ImportImageModalProps) {
  const [tab, setTab] = useState<TabMode>("url");
  const [selectedImage, setSelectedImage] = useState<string>(currentImageUrl);
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  // Bank questions state
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankSearch, setBankSearch] = useState(subjectContext || "");
  const [selectedBankSubject, setSelectedBankSubject] = useState<string>("all");

  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");

  // Sync with currentImageUrl when modal opens
  useEffect(() => {
    if (open) {
      setSelectedImage(currentImageUrl || "");
      if (currentImageUrl && !currentImageUrl.startsWith("data:") && !currentImageUrl.startsWith("<svg")) {
        setUrlInput(currentImageUrl);
      } else {
        setUrlInput("");
      }
      setUrlPreviewError(false);
      setUploadError("");
      setUploadFileName("");
    }
  }, [open, currentImageUrl]);

  // Load bank questions that contain images when switching to bank tab
  useEffect(() => {
    if (open && tab === "bank" && bankQuestions.length === 0) {
      setLoadingBank(true);
      apiRequest<BankQuestion[]>("/api/question-bank?hasImage=true&limit=all")
        .then((items) => {
          if (Array.isArray(items)) {
            // Keep items with non-empty imageUrl
            setBankQuestions(items.filter((q) => Boolean(q.imageUrl && q.imageUrl.trim())));
          }
        })
        .catch(() => {
          // Fallback to general list if hasImage filter isn't active
          apiRequest<BankQuestion[]>("/api/question-bank?limit=all")
            .then((all) => {
              if (Array.isArray(all)) {
                setBankQuestions(all.filter((q) => Boolean(q.imageUrl && q.imageUrl.trim())));
              }
            })
            .catch(() => {});
        })
        .finally(() => setLoadingBank(false));
    }
  }, [open, tab, bankQuestions.length]);

  // Filtered bank questions
  const filteredBankQuestions = useMemo(() => {
    return bankQuestions.filter((q) => {
      if (selectedBankSubject !== "all") {
        const matchesSubj =
          (q.subject && q.subject.toLowerCase() === selectedBankSubject.toLowerCase()) ||
          (q.category && q.category.toLowerCase() === selectedBankSubject.toLowerCase());
        if (!matchesSubj) return false;
      }
      if (!bankSearch.trim()) return true;
      const term = bankSearch.toLowerCase();
      return (
        (q.title && q.title.toLowerCase().includes(term)) ||
        (q.subtitle && q.subtitle.toLowerCase().includes(term)) ||
        (q.subject && q.subject.toLowerCase().includes(term)) ||
        (q.chapter && q.chapter.toLowerCase().includes(term)) ||
        (q.board && q.board.toLowerCase().includes(term))
      );
    });
  }, [bankQuestions, bankSearch, selectedBankSubject]);

  // Distinct subjects from bank questions with images
  const bankSubjects = useMemo(() => {
    const set = new Set<string>();
    bankQuestions.forEach((q) => {
      if (q.subject) set.add(q.subject);
      else if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [bankQuestions]);

  if (!open) return null;

  async function handlePasteClipboard() {
    try {
      setUrlPreviewError(false);
      // Try to read image from clipboard first
      if (navigator.clipboard && "read" in navigator.clipboard) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result);
                setSelectedImage(dataUrl);
                setUrlInput(dataUrl.slice(0, 50) + "...");
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        } catch {
          // Clipboard read permission might be denied, fall back to text
        }
      }

      // Fall back to reading text (URL or SVG)
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const trimmed = text.trim();
        setUrlInput(trimmed);
        setSelectedImage(trimmed);
      }
    } catch (err) {
      console.warn("Could not read clipboard:", err);
    }
  }

  function handleUrlChange(val: string) {
    setUrlInput(val);
    setUrlPreviewError(false);
    setSelectedImage(val.trim());
  }

  async function handleFileUpload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image file must be 10MB or smaller.");
      return;
    }
    setUploadError("");
    setIsUploading(true);
    setUploadFileName(file.name);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read local file"));
        reader.readAsDataURL(file);
      });

      // Attempt backend upload to Cloudinary
      try {
        const uploadRes = await apiRequest<{ imageUrl: string }>("/api/uploads/image", {
          method: "POST",
          body: JSON.stringify({ folder: "questions", fileName: file.name, imageData: dataUrl })
        });
        if (uploadRes?.imageUrl) {
          setSelectedImage(uploadRes.imageUrl);
          setIsUploading(false);
          return;
        }
      } catch (backendErr) {
        // Fallback to storing dataUrl directly if Cloudinary fails or is unconfigured
        console.warn("[ImportImage] Cloudinary upload fallback to data URL:", backendErr);
      }

      // If backend fails or not configured, dataUrl is completely valid
      setSelectedImage(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process image file");
    } finally {
      setIsUploading(false);
    }
  }

  function handleApply() {
    if (selectedImage.trim()) {
      onApplyImage(selectedImage.trim());
      onClose();
    }
  }

  function handleRemove() {
    onApplyImage("");
    setSelectedImage("");
    onClose();
  }

  const isSvg = selectedImage.trim().startsWith("<svg");
  const isDataUrl = selectedImage.trim().startsWith("data:image/");
  const isHttpUrl = selectedImage.trim().startsWith("http://") || selectedImage.trim().startsWith("https://");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "calc(100vh - 2.5rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3.5 sm:px-5 py-3 bg-muted/20">
          <div>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Import Question Image (প্রশ্ন চিত্র ইমপোর্ট)</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Add diagrams, formula figures, or geometry charts from Web URL, Question Bank, or Device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b bg-muted/10 px-3.5 sm:px-5 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
              tab === "url"
                ? "border-primary text-primary bg-background rounded-t-lg shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Image URL / Web Link</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("bank")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
              tab === "bank"
                ? "border-primary text-primary bg-background rounded-t-lg shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Question Bank Diagrams</span>
            {bankQuestions.length > 0 && (
              <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                {bankQuestions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("templates")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
              tab === "templates"
                ? "border-primary text-primary bg-background rounded-t-lg shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Diagram Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
              tab === "upload"
                ? "border-primary text-primary bg-background rounded-t-lg shadow-2xs"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Device File</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="overflow-y-auto flex-1 p-3.5 sm:p-5 space-y-4">
          {/* TAB 1: WEB URL / SVG */}
          {tab === "url" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Image Link or SVG Code
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasteClipboard}
                    className="h-7 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <Clipboard className="h-3 w-3" />
                    Paste from Clipboard
                  </Button>
                </div>
                <textarea
                  rows={3}
                  value={urlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste direct image URL (https://...jpg/.png), Data URL (data:image/...), or raw <svg>...</svg> code"
                  className="w-full rounded-md border bg-background p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Supports HTTPS image links, Base64 data URLs, and vector SVG codes.
                </p>
              </div>

              {/* Sample Quick Links */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-medium text-muted-foreground">Quick test examples:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleUrlChange(
                      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Cartesian-coordinate-system.svg/300px-Cartesian-coordinate-system.svg.png"
                    )
                  }
                  className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] hover:bg-muted"
                >
                  Cartesian Graph
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUrlChange(
                      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Rtriangle.svg/300px-Rtriangle.svg.png"
                    )
                  }
                  className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] hover:bg-muted"
                >
                  Right Triangle
                </button>
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => handleUrlChange("")}
                    className="text-[11px] text-destructive hover:underline ml-auto"
                  >
                    Clear Input
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUESTION BANK DIAGRAMS */}
          {tab === "bank" && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search diagrams by question, chapter, or keyword..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="h-8.5 w-full rounded-md border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {bankSearch && (
                    <button
                      type="button"
                      onClick={() => setBankSearch("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {bankSubjects.length > 0 && (
                  <select
                    value={selectedBankSubject}
                    onChange={(e) => setSelectedBankSubject(e.target.value)}
                    className="h-8.5 rounded-md border bg-background px-2.5 text-xs font-medium"
                  >
                    <option value="all">All Subjects</option>
                    {bankSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {loadingBank && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading diagrams from question bank...</span>
                </div>
              )}

              {!loadingBank && filteredBankQuestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed text-center p-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-semibold">No bank questions with images found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {bankSearch
                      ? `No diagram matches "${bankSearch}". Try a different search keyword.`
                      : "The question bank currently does not have any questions with diagrams. You can upload or link an image using the other tabs."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {bankSearch && (
                      <Button variant="outline" size="sm" onClick={() => setBankSearch("")} className="text-xs">
                        Clear Search
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setTab("templates")} className="text-xs">
                      Use Diagram Template
                    </Button>
                  </div>
                </div>
              )}

              {!loadingBank && filteredBankQuestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {filteredBankQuestions.map((bq) => {
                    const isSelected = selectedImage === bq.imageUrl;
                    const bqIsSvg = bq.imageUrl?.trim().startsWith("<svg");
                    return (
                      <button
                        key={bq.id}
                        type="button"
                        onClick={() => setSelectedImage(bq.imageUrl || "")}
                        className={`group relative flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                            : "bg-background hover:border-primary/60 hover:shadow-2xs"
                        }`}
                      >
                        {/* Thumbnail Container */}
                        <div className="relative mb-2 flex h-28 w-full items-center justify-center rounded-lg border bg-white p-1 overflow-hidden">
                          {bqIsSvg ? (
                            <div
                              className="h-full w-full flex items-center justify-center [&>svg]:max-h-full [&>svg]:w-auto"
                              dangerouslySetInnerHTML={{ __html: bq.imageUrl || "" }}
                            />
                          ) : (
                            <img
                              src={bq.imageUrl}
                              alt=""
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          )}
                          {isSelected && (
                            <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Title & Subject */}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[11px] font-medium text-foreground group-hover:text-primary">
                            {bq.title || "Untitled Question"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {bq.subject && (
                              <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-semibold text-muted-foreground">
                                {bq.subject}
                              </span>
                            )}
                            {bq.chapter && (
                              <span className="rounded bg-muted/60 px-1.5 py-0.2 text-[9px] text-muted-foreground truncate max-w-[120px]">
                                {bq.chapter}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIAGRAM TEMPLATES */}
          {tab === "templates" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select a ready-to-use vector SVG diagram commonly used in Mathematics, Physics, and Geometry:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {DIAGRAM_TEMPLATES.map((tpl) => {
                  const isSelected = selectedImage === tpl.svg;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedImage(tpl.svg)}
                      className={`group relative flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                          : "bg-background hover:border-primary/60 hover:shadow-2xs"
                      }`}
                    >
                      <div className="relative mb-2 flex h-28 w-full items-center justify-center rounded-lg border bg-white p-1 overflow-hidden">
                        <div
                          className="h-full w-full flex items-center justify-center [&>svg]:max-h-full [&>svg]:w-auto"
                          dangerouslySetInnerHTML={{ __html: tpl.svg }}
                        />
                        {isSelected && (
                          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-foreground group-hover:text-primary">
                        {tpl.title}
                      </p>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">{tpl.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: UPLOAD FROM DEVICE */}
          {tab === "upload" && (
            <div className="space-y-4">
              <label
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                  isUploading
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary hover:bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs font-medium">Processing & uploading {uploadFileName}...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Click to browse or drop an image file here
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        PNG, JPG, WEBP, GIF, or SVG (Up to 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </label>

              {uploadError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Image Preview Section */}
          <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Selected Image Preview</span>
                {selectedImage && (
                  <span className="rounded bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                    {isSvg ? "SVG Vector" : isDataUrl ? "Uploaded File" : isHttpUrl ? "Web Image" : "Custom Image"}
                  </span>
                )}
              </span>
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImage("")}
                  className="text-[11px] text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear Selection
                </button>
              )}
            </div>

            {selectedImage ? (
              <div className="flex items-center justify-center rounded-lg border bg-white p-3 min-h-[140px] max-h-[220px] overflow-hidden">
                {isSvg ? (
                  <div
                    className="max-h-48 w-auto flex items-center justify-center [&>svg]:max-h-48 [&>svg]:w-auto"
                    dangerouslySetInnerHTML={{ __html: selectedImage }}
                  />
                ) : (
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-h-48 w-auto object-contain rounded"
                    onError={() => setUrlPreviewError(true)}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60 text-xs">
                <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                <span>No image selected yet. Choose a method above to import an image.</span>
              </div>
            )}

            {urlPreviewError && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Preview could not be rendered from this URL. Verify the link is accessible.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t bg-muted/20 px-3.5 sm:px-5 py-3 shrink-0">
          <div>
            {currentImageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove Current Image
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedImage.trim()}
              onClick={handleApply}
              className="gap-1.5 text-xs font-semibold"
            >
              <Check className="h-3.5 w-3.5" />
              Apply Image to Question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
