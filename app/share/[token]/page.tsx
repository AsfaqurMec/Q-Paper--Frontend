"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaperPreview } from "@/components/paper-preview";
import { fetchPublicSharedPaper } from "@/lib/client-api";
import type { PublicSharedPaperResponse } from "@/lib/api-types";
import {
  getBengaliClass,
  getBengaliSubject,
  getBengaliPaperTitle,
  toBengaliDigits
} from "@/lib/curriculum-bengali";

export default function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicSharedPaperResponse | null>(null);
  const [password, setPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Extreme protection states
  const [isObscured, setIsObscured] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const notifySecurityWarning = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setSecurityToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 3500);
  }, []);

  async function loadPaper(pwd?: string) {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublicSharedPaper(token, pwd);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load shared question paper");
    } finally {
      setLoading(false);
      setSubmittingPassword(false);
    }
  }

  useEffect(() => {
    loadPaper();
  }, [token]);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmittingPassword(true);
    loadPaper(password.trim());
  }

  // Extreme protection listeners
  useEffect(() => {
    // 1. Keyboard shortcut blocking (Ctrl+P, Ctrl+S, Ctrl+C, Ctrl+A, Ctrl+U, F12, DevTools, PrintScreen)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Print: Ctrl+P / Cmd+P
      if (isCtrlOrMeta && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        notifySecurityWarning("⚠️ প্রশ্নপত্র প্রিন্ট বা এক্সপোর্ট করা কঠোরভাবে নিষিদ্ধ!");
        return false;
      }

      // Save: Ctrl+S / Cmd+S
      if (isCtrlOrMeta && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        notifySecurityWarning("⚠️ পেজ বা প্রশ্নপত্র সংরক্ষণ করা সম্পূর্ণ নিষিদ্ধ!");
        return false;
      }

      // Copy: Ctrl+C / Cmd+C
      if (isCtrlOrMeta && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        e.stopPropagation();
        notifySecurityWarning("⚠️ কন্টেন্ট কপি করা কঠোরভাবে নিষিদ্ধ!");
        return false;
      }

      // Select All: Ctrl+A / Cmd+A
      if (isCtrlOrMeta && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cut: Ctrl+X / Cmd+X
      if (isCtrlOrMeta && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // View Source: Ctrl+U / Cmd+U
      if (isCtrlOrMeta && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // DevTools: F12 or Ctrl+Shift+I/J/C
      if (
        e.key === "F12" ||
        (isCtrlOrMeta && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        notifySecurityWarning("⚠️ ডেভেলপার টুলস অ্যাক্সেস নিষিদ্ধ!");
        return false;
      }

      // PrintScreen Key / Screenshot shortcut
      if (e.key === "PrintScreen" || e.key === "Snapshot" || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        setIsObscured(true);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        notifySecurityWarning("⚠️ স্ক্রিনশট গ্রহণ কঠোরভাবে নিষিদ্ধ!");
        return false;
      }
    };

    // 2. Prevent right-click context menu entirely
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      notifySecurityWarning("⚠️ রাইট ক্লিক এবং কনটেক্সট মেনু নিষ্ক্রিয় করা হয়েছে!");
      return false;
    };

    // 3. Prevent copy, cut, paste, drag
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "");
      }
      notifySecurityWarning("⚠️ কন্টেন্ট কপি করা নিষিদ্ধ!");
      return false;
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 4. Clear any accidental text selection immediately
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        selection.removeAllRanges();
      }
    };

    // 5. Anti-screenshot & Snipping Tool protection via blur & visibilitychange
    // When Snipping Tool, Windows+Shift+S, Lightshot, or another app gains focus to take a screenshot,
    // this window blurs: we instantly shield/blackout the view!
    const handleWindowBlur = () => {
      setIsObscured(true);
    };

    const handleWindowFocus = () => {
      setIsObscured(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsObscured(true);
      } else {
        setIsObscured(false);
      }
    };

    // 6. BeforePrint event interceptor
    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      setIsObscured(true);
      notifySecurityWarning("⚠️ প্রিন্ট ও এক্সপোর্ট করা কঠোরভাবে নিষিদ্ধ!");
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("copy", handleCopy, true);
    window.addEventListener("cut", handleCut, true);
    window.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("selectionchange", handleSelectionChange, true);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("copy", handleCopy, true);
      window.removeEventListener("cut", handleCut, true);
      window.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("selectionchange", handleSelectionChange, true);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [notifySecurityWarning]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">প্রশ্নপত্র লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">প্রশ্নপত্র পাওয়া যায়নি</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> হোম পেজে ফিরে যান
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data?.isProtected && !data.paper) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">পাসওয়ার্ড সুরক্ষিত প্রশ্নপত্র</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {data.paperName} · {data.subject} ({data.className})
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  অ্যাক্সেস পাসওয়ার্ড লিখুন
                </label>
                <Input
                  type="password"
                  placeholder="পাসওয়ার্ড প্রদান করুন"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submittingPassword}>
                {submittingPassword ? "যাচাই করা হচ্ছে..." : "প্রশ্নপত্র দেখুন"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paper = data?.paper;
  if (!paper) return null;

  return (
    <div
      className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none relative"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
    >
      {/* Strict Print Blocker Stylesheet */}
      <style jsx global>{`
        @media print {
          html, body, #__next, div, main, header, section, article {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          body::before {
            content: "⚠️ প্রিন্ট বা এক্সপোর্ট কঠোরভাবে নিষিদ্ধ! এই প্রশ্নপত্রটি সম্পূর্ণ কপি ও স্ক্রিনশট সুরক্ষিত।" !important;
            display: block !important;
            visibility: visible !important;
            font-size: 24pt !important;
            color: #dc2626 !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-top: 150px !important;
            font-family: sans-serif !important;
          }
        }
        ::selection {
          background: transparent !important;
          color: inherit !important;
        }
        ::-moz-selection {
          background: transparent !important;
          color: inherit !important;
        }
      `}</style>

      {/* Floating Security Warning Notification */}
      {securityToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl ring-2 ring-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{securityToast}</span>
          </div>
        </div>
      )}

      {/* Anti-Screenshot / Blur Shield on Window Unfocus / PrtScn */}
      {isObscured && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-6 text-center text-white select-none">
          <div className="rounded-full bg-red-500/20 p-5 text-red-400 mb-4 ring-8 ring-red-500/10">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            স্ক্রিনশট ও অননুমোদিত ক্যাপচার প্রতিরোধ সক্রিয়
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
            কন্টেন্ট সুরক্ষার স্বার্থে স্ক্রিনশট বা অন্য উইন্ডোতে ফোকাস করার সময় প্রশ্নপত্রটি সাময়িকভাবে গোপন রাখা হয়েছে। পুনরায় দেখতে নিচের বোতামে ক্লিক করে উইন্ডো সক্রিয় করুন।
          </p>
          <Button
            variant="outline"
            onClick={() => setIsObscured(false)}
            className="mt-6 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 text-xs"
          >
            প্রশ্নপত্র দেখতে ক্লিক করুন
          </Button>
        </div>
      )}

      {/* Top Navbar for Public View - NO EXPORT BUTTONS */}
      <header className="sticky top-0 z-40 border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
              Q
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-950 dark:text-slate-50 line-clamp-1">
                {getBengaliPaperTitle(paper.name, paper.className, paper.subject)}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {getBengaliClass(paper.className)}
                </Badge>
                <span>·</span>
                <span>{getBengaliSubject(paper.subject)}</span>
                <span>·</span>
                <span>{toBengaliDigits(paper.questions?.length || 0)} টি প্রশ্ন</span>
              </div>
            </div>
          </div>

          {/* Strict Security Badge - Replaces any Export/Print buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>সুরক্ষিত ভিউ (কপি ও স্ক্রিনশট নিষিদ্ধ)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 relative">
        {/* Dynamic Forensic Watermark Matrix across the whole content */}
        <div
          className="pointer-events-none select-none absolute inset-0 z-30 overflow-hidden flex flex-wrap gap-16 p-8 items-center justify-center opacity-[0.06] dark:opacity-[0.09]"
          aria-hidden="true"
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="transform -rotate-25 text-xs font-bold tracking-widest text-slate-900 dark:text-slate-100 whitespace-nowrap"
            >
              🔒 PROTECTED QUESTION · DO NOT COPY OR CAPTURE · {token}
            </div>
          ))}
        </div>

        {/* Paper Content Display */}
        <div
          className="rounded-xl border bg-white dark:bg-slate-900 p-2 sm:p-4 md:p-6 shadow-sm relative pointer-events-auto"
          onContextMenu={(e) => {
            e.preventDefault();
            notifySecurityWarning("⚠️ রাইট ক্লিক নিষিদ্ধ!");
          }}
          onCopy={(e) => {
            e.preventDefault();
            notifySecurityWarning("⚠️ কন্টেন্ট কপি করা নিষিদ্ধ!");
          }}
        >
          <PaperPreview
            paper={{
              institute: "Q-Paper Shared Examination",
              name: paper.name,
              subject: paper.subject,
              className: paper.className,
              duration: paper.duration,
              totalMarks: paper.totalMarks,
              instructions: paper.instructions,
              questionsPerPage: paper.questionsPerPage || 10,
              layout: paper.layout || "split",
              cqLayout: paper.cqLayout || paper.layout || "split",
              setName: paper.setName,
              mcqSectionTitle: paper.mcqSectionTitle,
              cqSectionTitle: paper.cqSectionTitle
            }}
            questions={paper.questions as any}
            layout={paper.layout || "split"}
            cqLayout={paper.cqLayout || paper.layout || "split"}
          />
        </div>
      </main>
    </div>
  );
}
