"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Eye,
  FileCode,
  FileText,
  FileUp,
  GraduationCap,
  Layers,
  LifeBuoy,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  TrendingUp,
  Upload,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, clientApi } from "@/lib/client-api";
import { useAppModal } from "@/components/modal-provider";
import { AdminCurriculumView } from "@/components/admin-curriculum-view";
import { AdminUserManagementView } from "@/components/admin-user-management-view";
import { AdminPlansView } from "@/components/admin-plans-view";
import type { AdminDashboard, AdminPaperItem, AdminUser, ClassHierarchy, PaymentOption, PaymentRequest, Plan, QuestionImportResult, SupportTicket } from "@/lib/api-types";
import { getBengaliSubject, getBengaliClass } from "@/lib/curriculum-bengali";

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

export function AdminDashboardView({
  initialStats,
  initialUsers,
  initialTickets,
  initialPapers = [],
  initialHierarchy = [],
  initialRequests = [],
  initialPaymentOptions = [],
  initialPlans = []
}: {
  initialStats: AdminDashboard;
  initialUsers: AdminUser[];
  initialTickets: SupportTicket[];
  initialPapers?: AdminPaperItem[];
  initialHierarchy?: ClassHierarchy[];
  initialRequests?: PaymentRequest[];
  initialPaymentOptions?: PaymentOption[];
  initialPlans?: Plan[];
}) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const initialTab =
    urlTab === "bank" || urlTab === "users" || urlTab === "papers" || urlTab === "curriculum" || urlTab === "plans" || urlTab === "tickets" || urlTab === "diagnostics"
      ? (urlTab as any)
      : "overview";

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "papers" | "bank" | "curriculum" | "plans" | "tickets" | "diagnostics">(initialTab);
  const { showAlert, showConfirm } = useAppModal();

  // Users state
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Papers state
  const [papers, setPapers] = useState<AdminPaperItem[]>(initialPapers);
  const [paperSearch, setPaperSearch] = useState("");
  const [paperSubjectFilter, setPaperSubjectFilter] = useState("all");
  const [deletingPaperId, setDeletingPaperId] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(initialTickets[0] || null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketReplyStatus, setTicketReplyStatus] = useState<string>("in_progress");
  const [ticketReplying, setTicketReplying] = useState(false);
  const [syncingTickets, setSyncingTickets] = useState(false);

  // Sync tickets function for Admin
  const syncAdminTickets = async (silent = true) => {
    if (!silent) setSyncingTickets(true);
    try {
      const fresh = await clientApi.adminGetTickets();
      if (Array.isArray(fresh)) {
        setTickets(fresh);
        if (selectedTicket) {
          const updatedActive = fresh.find((t) => t.id === selectedTicket.id);
          if (updatedActive) {
            setSelectedTicket(updatedActive);
          }
        }
      }
    } catch (e) {
      console.error("Admin ticket sync error", e);
    } finally {
      if (!silent) setSyncingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "tickets") return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncAdminTickets(true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, selectedTicket?.id]);

  // Question Bank Subject Filter
  const [bankSearch, setBankSearch] = useState("");

  // Question Bank JSON Import state
  const [showJsonImport, setShowJsonImport] = useState(initialTab === "bank" && searchParams.get("import") === "true");
  const [jsonInput, setJsonInput] = useState("");
  const [importMode, setImportMode] = useState<"skip_duplicates" | "update_existing" | "append">("skip_duplicates");
  const [importOwner, setImportOwner] = useState<"system" | "admin">("system");

  const [hierarchy, setHierarchy] = useState<ClassHierarchy[]>(initialHierarchy || []);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [customChapterInput, setCustomChapterInput] = useState("");

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<QuestionImportResult | null>(null);
  const [totalBankQuestions, setTotalBankQuestions] = useState(initialStats.totals.questions);

  // Fetch hierarchy if not provided
  useEffect(() => {
    if (!initialHierarchy || initialHierarchy.length === 0) {
      apiRequest<ClassHierarchy[]>("/api/question-bank/hierarchy")
        .then((data) => {
          if (Array.isArray(data)) setHierarchy(data);
        })
        .catch(() => {});
    }
  }, [initialHierarchy]);

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
      const firstCls = hierarchy[0].className;
      setSelectedClass(firstCls);

      const clsNode = hierarchy.find((c) => c.className === firstCls);
      const firstSubj = clsNode?.subjects[0]?.name || "";
      setSelectedSubject(firstSubj);

      const subjNode = clsNode?.subjects.find((s) => s.name === firstSubj);
      const firstChap = subjNode?.chapters[0]?.name || "";
      setSelectedChapter(firstChap);
    }
  }, [hierarchy, selectedClass]);

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
    setImportResult(null);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImportJson() {
    if (!selectedClass) {
      showMessage("error", "Please select a Class before importing");
      return;
    }
    if (!selectedSubject) {
      showMessage("error", "Please select a Subject before importing");
      return;
    }
    if (!jsonInput.trim()) {
      showMessage("error", "Please provide or paste JSON data");
      return;
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (parseErr: any) {
      showMessage("error", `Invalid JSON format: ${parseErr.message}`);
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
      if (res.inserted > 0) {
        setTotalBankQuestions((prev) => prev + res.inserted);
      }
      showMessage("success", `Processed ${res.totalReceived} question(s): ${res.inserted} inserted, ${res.updated} updated, ${res.skipped} skipped.`);
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to import questions to question bank");
    } finally {
      setImporting(false);
    }
  }

  // Status notification message
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  }

  // Handle User Plan Change
  async function handlePlanChange(userId: string, newPlan: "free" | "pro" | "ultra" | "standard") {
    try {
      await clientApi.adminUpdateUserPlan(userId, newPlan);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));
      showMessage("success", `User plan updated to ${newPlan.toUpperCase()}`);
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to update plan");
    }
  }

  // Handle User Role Toggle
  function handleRoleToggle(userId: string, currentRole: "user" | "admin") {
    const newRole = currentRole === "admin" ? "user" : "admin";
    showConfirm({
      title: "রোল পরিবর্তন (Change Role)",
      message: `আপনি কি নিশ্চিত যে এই ব্যবহারকারীর রোল ${newRole.toUpperCase()} এ পরিবর্তন করতে চান?`,
      confirmText: "পরিবর্তন করুন",
      cancelText: "বাতিল",
      onConfirm: async () => {
        try {
          await clientApi.adminUpdateUserRole(userId, newRole);
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
          showMessage("success", `User role changed to ${newRole.toUpperCase()}`);
        } catch (err: any) {
          showMessage("error", err?.message || "Failed to update role");
        }
      }
    });
  }

  // Handle User Delete
  function handleDeleteUser(userId: string) {
    showConfirm({
      title: "ব্যবহারকারী মুছে ফেলুন (Delete User)",
      message: "আপনি কি নিশ্চিত যে এই ব্যবহারকারীর অ্যাকাউন্ট চিরতরে মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।",
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clientApi.adminDeleteUser(userId);
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          showMessage("success", "User account deleted successfully");
        } catch (err: any) {
          showMessage("error", err?.message || "Failed to delete user");
        }
      }
    });
  }

  // Handle Paper Delete
  function handleDeletePaper(paperId: string) {
    showConfirm({
      title: "প্রশ্নপত্র মুছে ফেলুন (Delete Paper)",
      message: "আপনি কি নিশ্চিত যে এই প্রশ্নপত্র এবং এর সাথে সম্পর্কিত সকল শেয়ার লিংক মুছে ফেলতে চান?",
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          setDeletingPaperId(paperId);
          await clientApi.adminDeletePaper(paperId);
          setPapers((prev) => prev.filter((p) => p.id !== paperId));
          showMessage("success", "Paper and associated links removed");
        } catch (err: any) {
          showMessage("error", err?.message || "Failed to delete paper");
        } finally {
          setDeletingPaperId(null);
        }
      }
    });
  }

  // Handle Admin Reply to Ticket
  async function handleAdminTicketReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText.trim()) return;

    try {
      setTicketReplying(true);
      const updated = await clientApi.adminReplyTicket(selectedTicket.id, {
        message: ticketReplyText.trim(),
        status: ticketReplyStatus
      });

      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setTicketReplyText("");
      showMessage("success", "Official administrator response submitted!");
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to submit response");
    } finally {
      setTicketReplying(false);
    }
  }

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase());
      const matchesPlan = userPlanFilter === "all" || u.plan === userPlanFilter;
      const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
      return matchesSearch && matchesPlan && matchesRole;
    });
  }, [users, userSearch, userPlanFilter, userRoleFilter]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(paperSearch.toLowerCase()) ||
        p.ownerName?.toLowerCase().includes(paperSearch.toLowerCase()) ||
        p.ownerEmail?.toLowerCase().includes(paperSearch.toLowerCase()) ||
        p.subject?.toLowerCase().includes(paperSearch.toLowerCase());
      const matchesSubject = paperSubjectFilter === "all" || p.subject === paperSubjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [papers, paperSearch, paperSubjectFilter]);

  // Unique subjects in papers for filter
  const paperSubjects = useMemo(() => {
    return Array.from(new Set(papers.map((p) => p.subject).filter(Boolean)));
  }, [papers]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketStatusFilter === "all") return true;
      return t.status === ticketStatusFilter;
    });
  }, [tickets, ticketStatusFilter]);

  // Filtered question bank subjects
  const bankSubjects = useMemo(() => {
    const list = initialStats.questionBankAnalytics?.bySubject || [];
    if (!bankSearch.trim()) return list;
    return list.filter(
      (s) =>
        s.subject.toLowerCase().includes(bankSearch.toLowerCase()) ||
        s.className.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [initialStats.questionBankAnalytics, bankSearch]);

  // Calculations for KPI Cards
  const paidUsersCount = (initialStats.plans.pro || 0) + (initialStats.plans.ultra || 0) + (initialStats.plans.standard || 0);
  const paidPercent = Math.round((paidUsersCount / Math.max(1, initialStats.totals.users)) * 100);
  const bankTotals = initialStats.totals.questions;
  const openTicketCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary text-primary-foreground font-bold tracking-wide">
              ADMINISTRATOR
            </Badge>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" /> Master Operations Hub
            </span>
          </div>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
            System Operations & Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Real-time platform telemetry, database aggregations, user privileges, and curriculum intelligence.
          </p>
        </div>

        {/* Global Action Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {initialStats.system?.database && (
            <div className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground font-medium">DB:</span>
              <span className="font-semibold text-foreground">{initialStats.system.database.name}</span>
            </div>
          )}
          {initialStats.system?.uptimeFormatted && (
            <div className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground font-medium">Uptime:</span>
              <span className="font-semibold text-foreground font-mono">{initialStats.system.uptimeFormatted}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs font-semibold shadow-xs ${
            actionMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {actionMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Navigation Tab Bar */}
      <div className="flex overflow-x-auto rounded-lg border bg-muted/40 p-1 text-xs font-medium no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "overview"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-primary" /> Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "users"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-blue-500" /> Users ({users.length})
          {initialRequests.filter((r) => r.status === "pending").length > 0 && (
            <Badge className="ml-1 bg-amber-600 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
              {initialRequests.filter((r) => r.status === "pending").length}
            </Badge>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("papers")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "papers"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5 text-emerald-600" /> Papers ({papers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "bank"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-3.5 w-3.5 text-purple-500" /> Question Bank ({bankTotals.toLocaleString()})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("curriculum")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "curriculum"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Curriculum
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "plans"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BadgeDollarSign className="h-3.5 w-3.5 text-teal-600" /> প্যাকেজ ও প্ল্যান (Plans)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "tickets"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="h-3.5 w-3.5 text-amber-500" /> Support Desk
          {openTicketCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] px-1.5 py-0 h-4">
              {openTicketCount}
            </Badge>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("diagnostics")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "diagnostics"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="h-3.5 w-3.5 text-teal-600" /> Diagnostics & Security
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{initialStats.totals.users.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{paidUsersCount} paid</span>
                  <span>({paidPercent}%)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Est. MRR</CardTitle>
                <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">৳{initialStats.totals.revenue.toLocaleString()}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Pro (৳500) & Ultra (৳1000) tiers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Papers Created</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{initialStats.totals.papers.toLocaleString()}</div>
                <p className="text-[11px] text-muted-foreground mt-1">System-wide generated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Question Bank</CardTitle>
                <Database className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{initialStats.totals.questions.toLocaleString()}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Bengali Curriculum items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Shared Links</CardTitle>
                <Layers className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{initialStats.totals.sharedLinks.toLocaleString()}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Visits: {(initialStats.totals.sharedVisits || 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Support Desk</CardTitle>
                <Ticket className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{openTicketCount}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Pending open tickets</p>
              </CardContent>
            </Card>
          </div>

          {/* Grid: Subscription Breakdown + Server Telemetry */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subscription Breakdown */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Subscription & Tier Analytics
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Monthly Revenue ৳{initialStats.totals.revenue.toLocaleString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400" /> Free Plan
                    </span>
                    <span>
                      {initialStats.plans.free} users ({Math.round((initialStats.plans.free / Math.max(1, initialStats.totals.users)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full transition-all duration-500"
                      style={{ width: `${(initialStats.plans.free / Math.max(1, initialStats.totals.users)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> Pro Plan (৳500/mo)
                    </span>
                    <span>
                      {initialStats.plans.pro || 0} users (৳{((initialStats.plans.pro || 0) * 500).toLocaleString()})
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${((initialStats.plans.pro || 0) / Math.max(1, initialStats.totals.users)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-600" /> Ultra Plan (৳1,000/mo)
                    </span>
                    <span>
                      {initialStats.plans.ultra || 0} users (৳{((initialStats.plans.ultra || 0) * 1000).toLocaleString()})
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${((initialStats.plans.ultra || 0) / Math.max(1, initialStats.totals.users)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-xs flex items-center justify-between border">
                  <span className="text-muted-foreground font-medium">Paying Customer Conversion Rate</span>
                  <span className="font-bold text-foreground">{paidPercent}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Server & Runtime Diagnostics */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-teal-600" /> Platform & Server Runtime
                  </span>
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                    Active & Operational
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-md border bg-muted/30 p-2.5">
                    <div className="text-muted-foreground text-[11px]">Node.js Runtime</div>
                    <div className="font-mono font-bold text-foreground mt-0.5">{initialStats.system?.nodeVersion || "Node.js v22"}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-2.5">
                    <div className="text-muted-foreground text-[11px]">Host Environment</div>
                    <div className="font-mono font-bold text-foreground mt-0.5">{initialStats.system?.platform || "Windows/Linux"}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-2.5">
                    <div className="text-muted-foreground text-[11px]">Server Uptime</div>
                    <div className="font-mono font-bold text-primary mt-0.5">{initialStats.system?.uptimeFormatted || "Active"}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-2.5">
                    <div className="text-muted-foreground text-[11px]">MongoDB Cluster</div>
                    <div className="font-mono font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {initialStats.system?.database?.status === "connected" ? "Connected (TLS)" : "Online"}
                    </div>
                  </div>
                </div>

                {initialStats.system?.memory && (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>Heap Memory Usage</span>
                      <span className="font-mono">{initialStats.system.memory.heapUsedMb} MB / {initialStats.system.memory.heapTotalMb} MB</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round((initialStats.system.memory.heapUsedMb / Math.max(1, initialStats.system.memory.heapTotalMb)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Resident Set Size (RSS): {initialStats.system.memory.rssMb} MB</span>
                      <span>External: {initialStats.system.memory.externalMb} MB</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grid: Real-time Activity Feed + Popular Subjects */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Real-time Unified Activity Stream */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Real-time Platform Activity Stream
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    Live Events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y max-h-[420px] overflow-y-auto">
                {(initialStats.activityFeed || []).map((act) => (
                  <div key={act.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-start gap-3 text-xs">
                    <div className="mt-0.5 rounded-full p-1.5 shrink-0 bg-muted/80">
                      {act.type === "user_signup" && <Users className="h-3.5 w-3.5 text-blue-500" />}
                      {act.type === "paper_created" && <FileText className="h-3.5 w-3.5 text-primary" />}
                      {act.type === "support_ticket" && <Ticket className="h-3.5 w-3.5 text-amber-500" />}
                      {act.type === "shared_link" && <Layers className="h-3.5 w-3.5 text-teal-600" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground truncate">{act.title}</span>
                        {act.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 font-medium">
                            {act.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px] truncate">{act.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))}

                {(!initialStats.activityFeed || initialStats.activityFeed.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-xs">No recent platform activity logged yet.</div>
                )}
              </CardContent>
            </Card>

            {/* Popular Generated Subjects */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Popular Paper Subjects
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 space-y-2.5">
                {(initialStats.popularPaperSubjects || []).map((subj, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md border p-2.5 text-xs bg-muted/20">
                    <span className="font-semibold text-foreground truncate">{subj.subject}</span>
                    <Badge variant="secondary" className="text-xs font-mono font-bold">
                      {subj.count} papers
                    </Badge>
                  </div>
                ))}

                {(!initialStats.popularPaperSubjects || initialStats.popularPaperSubjects.length === 0) && (
                  <div className="py-8 text-center text-xs text-muted-foreground">No paper subject data yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: USERS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === "users" && (
        <AdminUserManagementView
          initialUsers={users}
          initialRequests={initialRequests}
          initialOptions={initialPaymentOptions}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 3: PAPERS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === "papers" && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Generated Papers Directory ({filteredPapers.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Platform-wide question papers generated by all users</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by paper title or author..."
                    value={paperSearch}
                    onChange={(e: any) => setPaperSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <Select value={paperSubjectFilter} onValueChange={setPaperSubjectFilter}>
                  <SelectTrigger className="text-xs h-8 w-36">
                    <SelectValue placeholder="বিষয়" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">সকল বিষয়</SelectItem>
                    {paperSubjects.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {getBengaliSubject(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[680px]">
              <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Paper Details</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Subject & Class</th>
                  <th className="p-3">Marks & Time</th>
                  <th className="p-3">Questions</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPapers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-foreground line-clamp-1">{p.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase">
                          {p.layout || "split"} column
                        </Badge>
                        <span>·</span>
                        <span>{p.examType}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{p.ownerName}</div>
                      <div className="text-muted-foreground text-[11px] font-mono">{p.ownerEmail}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{getBengaliSubject(p.subject)}</div>
                      <div className="text-muted-foreground text-[11px]">{getBengaliClass(p.className)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{p.totalMarks} Marks</div>
                      <div className="text-muted-foreground text-[11px]">{p.duration}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{p.questionsCount || 0} Questions</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.mcqCount || 0} MCQ · {p.cqCount || 0} CQ
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground text-[11px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" asChild>
                          <Link href={`/dashboard/papers/${p.id}` as any} target="_blank">
                            <Eye className="h-3 w-3" /> View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePaper(p.id)}
                          disabled={deletingPaperId === p.id}
                          title="Delete Paper"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredPapers.length && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No papers match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 4: QUESTION BANK INTELLIGENCE & JSON IMPORTER */}
      {/* ======================================================== */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-2xs">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Question Bank Repository
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage curriculum questions, view live subject inventory, and bulk import questions from JSON data.
              </p>
            </div>
            <Button
              onClick={() => setShowJsonImport(!showJsonImport)}
              className="gap-2 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
            >
              <FileCode className="h-4 w-4" />
              {showJsonImport ? "Hide JSON Importer" : "Import Questions (JSON)"}
            </Button>
          </div>

          {/* Collapsible JSON Importer Card */}
          {showJsonImport && (
            <Card className="border-primary/40 shadow-sm bg-card transition-all">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                      <FileUp className="h-4 w-4" /> Bulk Import Questions to Question Bank
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Provide raw JSON data (MCQ or CQ). The importer automatically normalizes questions, aligns curriculum metadata, and handles duplicate detection.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadSampleMcq}
                      className="text-xs h-7"
                    >
                      Sample MCQ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadSampleCq}
                      className="text-xs h-7"
                    >
                      Sample CQ
                    </Button>
                    <label className="inline-flex items-center gap-1 cursor-pointer text-xs font-medium px-2.5 py-1 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7">
                      <Upload className="h-3 w-3" />
                      <span>Upload .json</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    {jsonInput && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setJsonInput(""); setImportResult(null); }}
                        className="text-xs h-7 text-muted-foreground hover:text-destructive"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Target Curriculum Selectors (Class -> Subject -> Chapter) */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>Target Curriculum (Class, Subject &amp; Chapter)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      All questions in JSON will be assigned to this Class &amp; Subject
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Class */}
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        শ্রেণি (Class / Level) <span className="text-destructive">*</span>
                      </label>
                      <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {hierarchy.map((cls) => (
                            <SelectItem key={cls.className} value={cls.className}>
                              {cls.className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        বিষয় (Subject) <span className="text-destructive">*</span>
                      </label>
                      <Select
                        value={selectedSubject}
                        onValueChange={handleSubjectChange}
                        disabled={availableSubjects.length === 0}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder={availableSubjects.length ? "Select Subject" : "No subjects"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.map((s) => (
                            <SelectItem key={s.name} value={s.name}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chapter */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          অধ্যায় (Chapter)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomChapter(!isCustomChapter)}
                          className="text-[10px] text-primary hover:underline font-medium"
                        >
                          {isCustomChapter ? "Choose from List" : "+ Custom Chapter"}
                        </button>
                      </div>

                      {isCustomChapter ? (
                        <Input
                          placeholder="e.g. অধ্যায় ১: গতি"
                          value={customChapterInput}
                          onChange={(e: any) => setCustomChapterInput(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      ) : (
                        <Select
                          value={selectedChapter}
                          onValueChange={handleChapterChange}
                          disabled={availableChapters.length === 0}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder={availableChapters.length ? "Select Chapter" : "No chapters"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableChapters.map((ch) => (
                              <SelectItem key={ch.name} value={ch.name}>
                                {ch.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__custom__">+ Custom Chapter...</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Import Mode and Owner Grid */}
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

                {/* JSON Input Textarea */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-foreground">JSON Data</span>
                    <span className="text-muted-foreground">
                      {jsonInput ? `${jsonInput.length.toLocaleString()} characters` : "No class/subject/chapter required inside questions"}
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[\n  {\n    "type": "mcq",\n    "title": "ত্বরণের একক কোনটি?",\n    "options": ["m/s", "m/s²", "N", "J"],\n    "correctIndex": 1,\n    "difficulty": "medium",\n    "explanation": "ত্বরণ = বেগ / সময় = m/s²।"\n  }\n]`}
                    className="w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-xs font-mono focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={handleImportJson}
                    disabled={importing || !jsonInput.trim()}
                    className="text-xs h-9 px-5 gap-2 bg-primary font-semibold"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing to MongoDB...
                      </>
                    ) : (
                      <>
                        <FileUp className="h-3.5 w-3.5" /> Save Questions to Question Bank
                      </>
                    )}
                  </Button>
                </div>

                {/* Import Results Summary Display */}
                {importResult && (
                  <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-xs text-foreground">Import Process Completed</span>
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
                        <div className="text-[11px]">Skipped (Duplicate)</div>
                      </div>
                      <div className="rounded-md border bg-rose-50 dark:bg-rose-950/40 border-rose-200 p-2 text-rose-800 dark:text-rose-300">
                        <div className="text-lg font-bold font-mono">{importResult.errors.length}</div>
                        <div className="text-[11px]">Errors</div>
                      </div>
                    </div>

                    {importResult.sampleInserted.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">Sample Questions Added:</div>
                        <div className="divide-y rounded-md border bg-background text-xs">
                          {importResult.sampleInserted.map((item) => (
                            <div key={item.id} className="p-2 flex items-center justify-between gap-3">
                              <span className="truncate text-foreground font-medium">{item.title}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge variant="secondary" className="text-[10px] uppercase">{item.type}</Badge>
                                <span className="text-[10px] text-muted-foreground">{item.subject}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {importResult.errors.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-destructive uppercase">Issues Detected:</div>
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2 space-y-1 text-xs text-destructive max-h-32 overflow-y-auto">
                          {importResult.errors.map((err, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span>#{err.index + 1}:</span>
                              <span>{err.title ? `"${err.title}" - ` : ""}{err.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Question Bank High-level Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalBankQuestions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Live from curriculum database</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">
                  {(initialStats.questionBankAnalytics?.byType.mcq || 0).toLocaleString()} MCQ
                </div>
                <div className="text-xs text-muted-foreground">
                  {(initialStats.questionBankAnalytics?.byType.cq || 0).toLocaleString()} CQ (Creative Questions)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Difficulty Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-emerald-600">Easy: {initialStats.questionBankAnalytics?.byDifficulty.easy || 0}</span>
                  <span>·</span>
                  <span className="text-amber-600">Med: {initialStats.questionBankAnalytics?.byDifficulty.medium || 0}</span>
                  <span>·</span>
                  <span className="text-red-600">Hard: {initialStats.questionBankAnalytics?.byDifficulty.hard || 0}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Algorithmic difficulty distribution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nature Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-semibold text-foreground">
                  Theory: {(initialStats.questionBankAnalytics?.byNature.theory || 0).toLocaleString()} · Math: {(initialStats.questionBankAnalytics?.byNature.mathematical || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Bangla LaTeX 2D matrices verified</p>
              </CardContent>
            </Card>
          </div>

          {/* Dynamic Subject Breakdown Grid */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" /> Live Curriculum Subject Inventory ({bankSubjects.length} Subjects)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time counts aggregated directly from MongoDB</p>
                </div>

                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter subjects..."
                    value={bankSearch}
                    onChange={(e: any) => setBankSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bankSubjects.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-3.5 space-y-2 bg-slate-50 dark:bg-slate-900/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-foreground truncate">{s.subject}</h4>
                        <span className="text-[10px] text-muted-foreground">{s.className}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 shrink-0">
                        Live
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground font-medium">{s.chapters} অধ্যায়</span>
                      <span className="font-bold text-primary font-mono">{s.count.toLocaleString()} প্রশ্ন</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>MCQ: {s.mcqCount || 0}</span>
                      <span>CQ: {s.cqCount || 0}</span>
                    </div>
                  </div>
                ))}

                {!bankSubjects.length && (
                  <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                    No subjects matched your filter.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: CURRICULUM */}
      {/* ======================================================== */}
      {activeTab === "curriculum" && (
        <AdminCurriculumView initialTree={hierarchy} />
      )}

      {/* ======================================================== */}
      {/* TAB: PLANS & PACKAGES MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === "plans" && (
        <AdminPlansView initialPlans={initialPlans} />
      )}

      {/* ======================================================== */}
      {/* TAB 5: SUPPORT DESK */}
      {/* ======================================================== */}
      {activeTab === "tickets" && (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Left: Ticket List */}
          <Card className="h-fit">
            <CardHeader className="pb-3 border-b space-y-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <LifeBuoy className="h-4 w-4 text-primary" /> Tickets ({filteredTickets.length})
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => syncAdminTickets(false)}
                    disabled={syncingTickets}
                    className="h-6 w-6 p-0"
                    title="Sync tickets"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncingTickets ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    {tickets.filter((t) => t.status === "open").length} open
                  </Badge>
                </div>
              </div>

              {/* Ticket Status Filter */}
              <div className="flex rounded-md border bg-muted/40 p-0.5 text-xs">
                {["all", "open", "in_progress", "resolved", "closed"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTicketStatusFilter(st)}
                    className={`rounded px-2 py-1 text-[11px] capitalize flex-1 ${
                      ticketStatusFilter === st
                        ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st === "in_progress" ? "In Progress" : st}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y max-h-[600px] overflow-y-auto">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground line-clamp-1">{t.subject}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1 py-0 uppercase font-bold shrink-0 ${
                          t.status === "open"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : t.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : t.status === "closed"
                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                      <span className="truncate">From: {t.userName || "User"}</span>
                      <span className="flex items-center gap-1 shrink-0 font-mono">
                        <MessageSquare className="h-3 w-3" /> {t.replies || (t.messages?.length ? t.messages.length - 1 : 0)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!filteredTickets.length && (
                <div className="p-8 text-center text-xs text-muted-foreground">No support tickets match this filter.</div>
              )}
            </CardContent>
          </Card>

          {/* Right: Message Details & Admin Reply */}
          <Card className="flex flex-col min-h-[520px]">
            {selectedTicket ? (
              <>
                <CardHeader className="border-b pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-foreground">{selectedTicket.subject}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Author: {selectedTicket.userName} ({selectedTicket.userEmail}) · ID: {selectedTicket.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {selectedTicket.category || "General"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-xs uppercase font-bold ${
                          selectedTicket.status === "open"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : selectedTicket.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                        }`}
                      >
                        {selectedTicket.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[380px]">
                  {(selectedTicket.messages || []).map((msg, idx) => {
                    const isAdmin = msg.senderRole === "admin";
                    return (
                      <div key={idx} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/80 text-foreground border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-75 font-semibold">
                            <span>{msg.senderName} {isAdmin ? "(Support Lead)" : ""}</span>
                            <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                {/* Admin Reply Form */}
                <div className="border-t p-3.5 bg-muted/20 space-y-2.5">
                  <form onSubmit={handleAdminTicketReply} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Set ticket status after reply:</span>
                      <Select value={ticketReplyStatus} onValueChange={setTicketReplyStatus}>
                        <SelectTrigger className="text-xs h-7 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                          <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
                          <SelectItem value="closed" className="text-xs">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Write official administrator reply..."
                        value={ticketReplyText}
                        onChange={(e: any) => setTicketReplyText(e.target.value)}
                        className="text-xs flex-1"
                        disabled={ticketReplying}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="gap-1.5 text-xs shrink-0"
                        disabled={ticketReplying || !ticketReplyText.trim()}
                      >
                        <Send className="h-3.5 w-3.5" /> {ticketReplying ? "Sending..." : "Reply"}
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground text-sm">
                Select a ticket from the left panel to review the conversation.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: DIAGNOSTICS & SECURITY */}
      {/* ======================================================== */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Database & Collections Audit */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" /> Database Collections & Record Count
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="divide-y text-xs">
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-foreground">Registered Users (users)</span>
                    <span className="font-mono font-bold text-foreground">{initialStats.totals.users}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-foreground">Generated Papers (papers)</span>
                    <span className="font-mono font-bold text-foreground">{initialStats.totals.papers}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-foreground">Question Bank Items (questionBankItems)</span>
                    <span className="font-mono font-bold text-foreground">{initialStats.totals.questions}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-foreground">Public Shared Links (sharedLinks)</span>
                    <span className="font-mono font-bold text-foreground">{initialStats.totals.sharedLinks}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold text-foreground">Support Tickets (supportTickets)</span>
                    <span className="font-mono font-bold text-foreground">{tickets.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Audit Checklist */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Platform Security & Compliance Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                {[
                  { title: "Role-Based Access Control (RBAC)", desc: "Enforced at server level on all /api/admin/* endpoints" },
                  { title: "MongoDB TLS Transport", desc: "Encrypted connection to MongoDB cluster with failover" },
                  { title: "Bangla KaTeX Matrix Engine", desc: "Ensures 2D bracketed matrices preserve alignment in Bengali math" },
                  { title: "Tokenized Paper Sharing", desc: "Optional password hashing and instantaneous link revocation" },
                  { title: "XSS & HTML Sanitization", desc: "Strict sanitization on question formulas, titles, and explanations" },
                  { title: "Rate Limiting & Security Headers", desc: "Helmet enabled with strict CSP, CORS and frame protection" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-md bg-muted/40 p-2.5 border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
