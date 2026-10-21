"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Edit2,
  Eye,
  FileQuestion,
  Filter,
  GraduationCap,
  Layers,
  Library,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAppModal } from "@/components/modal-provider";
import { clientApi } from "@/lib/client-api";
import { toStandardDigits } from "@/lib/utils";
import type {
  AcademicClass,
  AcademicClassDetail,
  ClassHierarchy,
  CurriculumStats,
  ChapterDetail,
  ChapterEntity,
  SubjectDetail,
  SubjectEntity
} from "@/lib/api-types";

type TabMode = "classes" | "subjects" | "chapters" | "tree";

export function AdminCurriculumView({
  initialClasses = [],
  initialSubjects = [],
  initialChapters = [],
  initialStats = null,
  initialTree = []
}: {
  initialClasses?: AcademicClass[];
  initialSubjects?: SubjectEntity[];
  initialChapters?: ChapterEntity[];
  initialStats?: CurriculumStats | null;
  initialTree?: ClassHierarchy[];
}) {
  const { showConfirm } = useAppModal();
  const [activeTab, setActiveTab] = useState<TabMode>("classes");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [classes, setClasses] = useState<AcademicClass[]>(initialClasses);
  const [subjects, setSubjects] = useState<SubjectEntity[]>(initialSubjects);
  const [chapters, setChapters] = useState<ChapterEntity[]>(initialChapters);
  const [stats, setStats] = useState<CurriculumStats | null>(initialStats);
  const [tree, setTree] = useState<ClassHierarchy[]>(initialTree);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");

  // Tree Expansion state
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [classFormData, setClassFormData] = useState<{
    name: string;
    code: string;
    aliases: string;
    order: number | string;
    status: "active" | "inactive";
  }>({
    name: "",
    code: "",
    aliases: "",
    order: 0,
    status: "active"
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectEntity | null>(null);
  const [subjectFormData, setSubjectFormData] = useState<{
    classId: string;
    name: string;
    code: string;
    category: string;
    aliases: string;
    order: number | string;
    status: "active" | "inactive";
  }>({
    classId: "",
    name: "",
    code: "",
    category: "General",
    aliases: "",
    order: 0,
    status: "active"
  });

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterEntity | null>(null);
  const [chapterFormData, setChapterFormData] = useState<{
    classId: string;
    subjectId: string;
    chapterNumber: number | string;
    name: string;
    aliases: string;
    order: number | string;
    status: "active" | "inactive";
  }>({
    classId: "",
    subjectId: "",
    chapterNumber: 1,
    name: "",
    aliases: "",
    order: 0,
    status: "active"
  });

  // Detail Inspector Modals state
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    type: "class" | "subject" | "chapter";
    data: AcademicClassDetail | SubjectDetail | ChapterDetail | null;
    loading: boolean;
  }>({
    open: false,
    type: "class",
    data: null,
    loading: false
  });

  function showMessage(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  }

  // Load / Reload all curriculum data
  async function reloadAllData() {
    setLoading(true);
    try {
      const [clsData, subjData, chapData, statsData, treeData] = await Promise.all([
        clientApi.curriculumClasses("status=all"),
        clientApi.curriculumSubjects("status=all"),
        clientApi.curriculumChapters("status=all"),
        clientApi.curriculumStats().catch(() => null),
        clientApi.curriculumTree().catch(() => [])
      ]);
      setClasses(clsData || []);
      setSubjects(subjData || []);
      setChapters(chapData || []);
      if (statsData) setStats(statsData);
      if (treeData) setTree(treeData);
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to load curriculum data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (classes.length === 0) {
      reloadAllData();
    }
  }, []);

  // Filtered views
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.aliases?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [classes, statusFilter, searchQuery]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchClass = selectedClassFilter === "all" || s.classId === selectedClassFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.aliases?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchClass && matchStatus && matchSearch;
    });
  }, [subjects, selectedClassFilter, statusFilter, searchQuery]);

  const filteredChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const matchClass = selectedClassFilter === "all" || ch.classId === selectedClassFilter;
      const matchSubj = selectedSubjectFilter === "all" || ch.subjectId === selectedSubjectFilter;
      const matchStatus = statusFilter === "all" || ch.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.aliases?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(ch.chapterNumber) === searchQuery.trim();
      return matchClass && matchSubj && matchStatus && matchSearch;
    });
  }, [chapters, selectedClassFilter, selectedSubjectFilter, statusFilter, searchQuery]);

  // Subjects available for currently selected class in chapter form/filter
  const subjectsForSelectedClass = useMemo(() => {
    if (selectedClassFilter === "all") return subjects;
    return subjects.filter((s) => s.classId === selectedClassFilter);
  }, [subjects, selectedClassFilter]);

  const subjectsForChapterForm = useMemo(() => {
    if (!chapterFormData.classId) return subjects;
    return subjects.filter((s) => s.classId === chapterFormData.classId);
  }, [subjects, chapterFormData.classId]);

  // ==========================================
  // DETAIL INSPECTORS
  // ==========================================
  async function openClassDetails(id: string) {
    setDetailModal({ open: true, type: "class", data: null, loading: true });
    try {
      const details = await clientApi.curriculumClass(id);
      setDetailModal({ open: true, type: "class", data: details, loading: false });
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to load class details");
      setDetailModal({ open: false, type: "class", data: null, loading: false });
    }
  }

  async function openSubjectDetails(id: string) {
    setDetailModal({ open: true, type: "subject", data: null, loading: true });
    try {
      const details = await clientApi.curriculumSubject(id);
      setDetailModal({ open: true, type: "subject", data: details, loading: false });
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to load subject details");
      setDetailModal({ open: false, type: "subject", data: null, loading: false });
    }
  }

  async function openChapterDetails(id: string) {
    setDetailModal({ open: true, type: "chapter", data: null, loading: true });
    try {
      const details = await clientApi.curriculumChapter(id);
      setDetailModal({ open: true, type: "chapter", data: details, loading: false });
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to load chapter details");
      setDetailModal({ open: false, type: "chapter", data: null, loading: false });
    }
  }

  // ==========================================
  // CLASS ACTIONS
  // ==========================================
  function openCreateClassModal() {
    setEditingClass(null);
    setClassFormData({
      name: "",
      code: "",
      aliases: "",
      order: classes.length + 1,
      status: "active"
    });
    setIsClassModalOpen(true);
  }

  function openEditClassModal(cls: AcademicClass) {
    setEditingClass(cls);
    setClassFormData({
      name: cls.name,
      code: cls.code,
      aliases: cls.aliases?.join(", ") || "",
      order: cls.order,
      status: cls.status
    });
    setIsClassModalOpen(true);
  }

  async function handleSaveClass(e: React.FormEvent) {
    e.preventDefault();
    if (!classFormData.name.trim() || !classFormData.code.trim()) {
      showMessage("error", "Class name and code are required");
      return;
    }

    try {
      const payload = {
        name: classFormData.name.trim(),
        code: classFormData.code.trim().toUpperCase(),
        aliases: classFormData.aliases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        order: Number(toStandardDigits(String(classFormData.order))) || 0,
        status: classFormData.status
      };

      if (editingClass) {
        const updated = await clientApi.updateAcademicClass(editingClass.id, payload);
        setClasses((prev) => prev.map((c) => (c.id === editingClass.id ? { ...c, ...updated } : c)));
        showMessage("success", `Class "${updated.name}" updated successfully`);
      } else {
        const created = await clientApi.createAcademicClass(payload);
        setClasses((prev) => [...prev, created]);
        showMessage("success", `Class "${created.name}" created successfully`);
      }
      setIsClassModalOpen(false);
      reloadAllData();
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to save class");
    }
  }

  async function handleToggleClassStatus(cls: AcademicClass) {
    const nextStatus = cls.status === "active" ? "inactive" : "active";
    try {
      await clientApi.updateAcademicClass(cls.id, { status: nextStatus });
      setClasses((prev) => prev.map((c) => (c.id === cls.id ? { ...c, status: nextStatus } : c)));
      showMessage("success", `Class "${cls.name}" is now ${nextStatus}`);
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to update class status");
    }
  }

  function handleDeleteClass(id: string, name: string) {
    showConfirm({
      title: "শ্রেণি মুছে ফেলুন (Delete Class)",
      message: `আপনি কি নিশ্চিত যে "${name}" শ্রেণিটি মুছে ফেলতে চান? এই অ্যাকশনটি ফিরিয়ে আনা যাবে না।`,
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clientApi.deleteAcademicClass(id);
          setClasses((prev) => prev.filter((c) => c.id !== id));
          showMessage("success", `Class "${name}" deleted successfully`);
          reloadAllData();
        } catch (err: any) {
          showMessage("error", err?.message || "Failed to delete class");
        }
      }
    });
  }

  // ==========================================
  // SUBJECT ACTIONS
  // ==========================================
  function openCreateSubjectModal(defaultClassId?: string) {
    setEditingSubject(null);
    setSubjectFormData({
      classId: defaultClassId || (classes[0]?.id ?? ""),
      name: "",
      code: "",
      category: "General",
      aliases: "",
      order: subjects.length + 1,
      status: "active"
    });
    setIsSubjectModalOpen(true);
  }

  function openEditSubjectModal(subj: SubjectEntity) {
    setEditingSubject(subj);
    setSubjectFormData({
      classId: subj.classId,
      name: subj.name,
      code: subj.code,
      category: subj.category || "General",
      aliases: subj.aliases?.join(", ") || "",
      order: subj.order,
      status: subj.status
    });
    setIsSubjectModalOpen(true);
  }

  async function handleSaveSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectFormData.classId) {
      showMessage("error", "Please select a parent class");
      return;
    }
    if (!subjectFormData.name.trim()) {
      showMessage("error", "Subject name is required");
      return;
    }

    try {
      const payload = {
        classId: subjectFormData.classId,
        name: subjectFormData.name.trim(),
        code: subjectFormData.code.trim() ? subjectFormData.code.trim().toUpperCase() : "GEN",
        category: subjectFormData.category.trim() || "General",
        aliases: subjectFormData.aliases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        order: Number(toStandardDigits(String(subjectFormData.order))) || 0,
        status: subjectFormData.status
      };

      if (editingSubject) {
        const updated = await clientApi.updateSubject(editingSubject.id, payload);
        setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? { ...s, ...updated } : s)));
        showMessage("success", `Subject "${updated.name}" updated successfully`);
      } else {
        const created = await clientApi.createSubject(payload);
        setSubjects((prev) => [...prev, created]);
        showMessage("success", `Subject "${created.name}" created successfully`);
      }
      setIsSubjectModalOpen(false);
      reloadAllData();
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to save subject");
    }
  }

  async function handleToggleSubjectStatus(subj: SubjectEntity) {
    const nextStatus = subj.status === "active" ? "inactive" : "active";
    try {
      await clientApi.updateSubject(subj.id, { status: nextStatus });
      setSubjects((prev) => prev.map((s) => (s.id === subj.id ? { ...s, status: nextStatus } : s)));
      showMessage("success", `Subject "${subj.name}" is now ${nextStatus}`);
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to update subject status");
    }
  }

  function handleDeleteSubject(id: string, name: string) {
    showConfirm({
      title: "বিষয় মুছে ফেলুন (Delete Subject)",
      message: `আপনি কি নিশ্চিত যে "${name}" বিষয়টি মুছে ফেলতে চান? এর অধীনে থাকা সকল প্রশ্ন ও অধ্যায় প্রভাবিত হতে পারে।`,
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clientApi.deleteSubject(id);
          setSubjects((prev) => prev.filter((s) => s.id !== id));
          showMessage("success", `Subject "${name}" deleted successfully`);
          reloadAllData();
        } catch (err: any) {
          showMessage("error", err?.message || "Failed to delete subject");
        }
      }
    });
  }

  // ==========================================
  // CHAPTER ACTIONS
  // ==========================================
  function openCreateChapterModal(defaultClassId?: string, defaultSubjectId?: string) {
    setEditingChapter(null);
    const parentClassId = defaultClassId || (classes[0]?.id ?? "");
    const availableSubjs = defaultClassId
      ? subjects.filter((s) => s.classId === defaultClassId)
      : subjects;
    const parentSubjId = defaultSubjectId || (availableSubjs[0]?.id ?? "");

    // calculate next chapter number
    const existingChaptersInSubject = chapters.filter((c) => c.subjectId === parentSubjId);
    const nextNum = existingChaptersInSubject.length + 1;

    setChapterFormData({
      classId: parentClassId,
      subjectId: parentSubjId,
      chapterNumber: nextNum,
      name: "",
      aliases: "",
      order: nextNum,
      status: "active"
    });
    setIsChapterModalOpen(true);
  }

  function openEditChapterModal(chap: ChapterEntity) {
    setEditingChapter(chap);
    setChapterFormData({
      classId: chap.classId,
      subjectId: chap.subjectId,
      chapterNumber: chap.chapterNumber,
      name: chap.name,
      aliases: chap.aliases?.join(", ") || "",
      order: chap.order,
      status: chap.status
    });
    setIsChapterModalOpen(true);
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterFormData.subjectId) {
      showMessage("error", "Please select a parent subject");
      return;
    }
    if (!chapterFormData.name.trim()) {
      showMessage("error", "Chapter name is required");
      return;
    }

    try {
      const payload = {
        classId: chapterFormData.classId || undefined,
        subjectId: chapterFormData.subjectId,
        chapterNumber: Number(toStandardDigits(String(chapterFormData.chapterNumber))) || 1,
        name: chapterFormData.name.trim(),
        aliases: chapterFormData.aliases
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        order: Number(toStandardDigits(String(chapterFormData.order))) || 0,
        status: chapterFormData.status
      };

      if (editingChapter) {
        const updated = await clientApi.updateChapter(editingChapter.id, payload);
        setChapters((prev) => prev.map((ch) => (ch.id === editingChapter.id ? { ...ch, ...updated } : ch)));
        showMessage("success", `Chapter "${updated.name}" updated successfully`);
      } else {
        const created = await clientApi.createChapter(payload);
        setChapters((prev) => [...prev, created]);
        showMessage("success", `Chapter "${created.name}" created successfully`);
      }
      setIsChapterModalOpen(false);
      reloadAllData();
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to save chapter");
    }
  }

  async function handleToggleChapterStatus(chap: ChapterEntity) {
    const nextStatus = chap.status === "active" ? "inactive" : "active";
    try {
      await clientApi.updateChapter(chap.id, { status: nextStatus });
      setChapters((prev) => prev.map((ch) => (ch.id === chap.id ? { ...ch, status: nextStatus } : ch)));
      showMessage("success", `Chapter "${chap.name}" is now ${nextStatus}`);
    } catch (err: any) {
      showMessage("error", err?.message || "Failed to update chapter status");
    }
  }

  function handleDeleteChapter(id: string, name: string) {
    showConfirm({
      title: "অধ্যায় মুছে ফেলুন (Delete Chapter)",
      message: `আপনি কি নিশ্চিত যে "${name}" অধ্যায়টি মুছে ফেলতে চান?`,
      confirmText: "মুছে ফেলুন",
      cancelText: "বাতিল",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clientApi.deleteChapter(id);
          setChapters((prev) => prev.filter((ch) => ch.id !== id));
          showMessage("success", `Chapter "${name}" deleted successfully`);
          reloadAllData();
        } catch (err: any) {
          showMessage("error", err?.message || "Failed to delete chapter");
        }
      }
    });
  }

  // Tree toggle helpers
  function toggleTreeClass(classId: string) {
    setExpandedClasses((prev) => ({ ...prev, [classId]: !prev[classId] }));
  }

  function toggleTreeSubject(subjectId: string) {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Telemetry */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary text-primary-foreground font-bold tracking-wide">
              ADMINISTRATOR
            </Badge>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Library className="h-3.5 w-3.5 text-blue-600 inline" /> Academic Structure & Taxonomy
            </span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            Curriculum Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage academic classes, curriculum subjects, syllabus chapters, and question hierarchy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reloadAllData}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={openCreateClassModal}
            className="text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Class
          </Button>
          <Button
            size="sm"
            onClick={() => openCreateSubjectModal()}
            className="text-xs gap-1 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add Subject
          </Button>
          <Button
            size="sm"
            onClick={() => openCreateChapterModal()}
            className="text-xs gap-1 bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add Chapter
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs font-semibold shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Academic Classes
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalClasses ?? classes.length}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600">
                {stats?.activeClasses ?? classes.filter((c) => c.status === "active").length} active
              </span>
              <span>· {classes.filter((c) => c.status === "inactive").length} inactive</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalSubjects ?? subjects.length}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-blue-600">
                {stats?.activeSubjects ?? subjects.filter((s) => s.status === "active").length} active
              </span>
              <span>· {subjects.filter((s) => s.status === "inactive").length} inactive</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Syllabus Chapters
            </CardTitle>
            <Layers className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.totalChapters ?? chapters.length}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-purple-600">
                {stats?.activeChapters ?? chapters.filter((ch) => ch.status === "active").length} active
              </span>
              <span>· {chapters.filter((ch) => ch.status === "inactive").length} inactive</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Linked Questions
            </CardTitle>
            <Database className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(stats?.totalQuestions ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">
                {(stats?.linkedQuestions ?? 0).toLocaleString()}
              </span>
              <span>linked to curriculum</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex overflow-x-auto rounded-lg border bg-muted/40 p-1 text-xs font-medium no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "classes"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5 text-primary" /> Classes ({classes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "subjects"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 text-blue-500" /> Subjects ({subjects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chapters")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "chapters"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-purple-500" /> Chapters ({chapters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tree")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 transition-all shrink-0 ${
            activeTab === "tree"
              ? "bg-white dark:bg-slate-900 font-bold shadow-2xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Library className="h-3.5 w-3.5 text-emerald-600" /> Hierarchy Tree View
        </button>
      </div>

      {/* Controls Bar (Search & Filters) */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="h-8 text-xs w-[110px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Class filter for Subjects & Chapters */}
          {(activeTab === "subjects" || activeTab === "chapters") && (
            <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Filter Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Subject filter for Chapters */}
          {activeTab === "chapters" && (
            <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Filter Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectsForSelectedClass.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(searchQuery || statusFilter !== "all" || selectedClassFilter !== "all" || selectedSubjectFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setSelectedClassFilter("all");
                setSelectedSubjectFilter("all");
              }}
              className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ACADEMIC CLASSES */}
      {/* ======================================================== */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredClasses.length} of {classes.length} class(es)</span>
            <Button size="sm" variant="outline" onClick={openCreateClassModal} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> New Class
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="relative overflow-hidden transition-all hover:border-primary/50 shadow-2xs">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold">
                          {cls.code}
                        </Badge>
                        <Badge
                          variant={cls.status === "active" ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 ${
                            cls.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {cls.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold mt-1 text-foreground">
                        {cls.name}
                      </CardTitle>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Order: #{cls.order}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  {cls.aliases && cls.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cls.aliases.map((alias, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-0.5 rounded-sm bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {alias}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Telemetry pill */}
                  <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/30 p-2 text-center text-xs">
                    <div>
                      <span className="block font-bold text-foreground">{cls.subjectsCount ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground">Subjects</span>
                    </div>
                    <div>
                      <span className="block font-bold text-foreground">{cls.chaptersCount ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground">Chapters</span>
                    </div>
                    <div>
                      <span className="block font-bold text-foreground">{(cls.questionsCount ?? 0).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">Questions</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-muted/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openClassDetails(cls.id)}
                      className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="h-3 w-3" /> View Details
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleClassStatus(cls)}
                        className="h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {cls.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditClassModal(cls)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Class"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        title="Delete Class"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredClasses.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <GraduationCap className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="font-semibold text-sm">No academic classes match your search</p>
                <p className="text-xs mt-1">Try modifying your search or click below to create one.</p>
                <Button size="sm" onClick={openCreateClassModal} className="mt-3 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Create Academic Class
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SUBJECTS */}
      {/* ======================================================== */}
      {activeTab === "subjects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredSubjects.length} of {subjects.length} subject(s)</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openCreateSubjectModal(selectedClassFilter !== "all" ? selectedClassFilter : undefined)}
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3 w-3" /> New Subject
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subj) => (
              <Card key={subj.id} className="relative overflow-hidden transition-all hover:border-primary/50 shadow-2xs">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold">
                          {subj.code || "GEN"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {subj.category || "General"}
                        </Badge>
                        <Badge
                          variant={subj.status === "active" ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 ${
                            subj.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {subj.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold mt-1 text-foreground">
                        {subj.name}
                      </CardTitle>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Order: #{subj.order}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    <span>Class: <strong className="text-foreground">{subj.className || "Assigned Class"}</strong></span>
                  </div>

                  {subj.aliases && subj.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {subj.aliases.map((alias, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-0.5 rounded-sm bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {alias}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Telemetry pill */}
                  <div className="grid grid-cols-2 gap-1 rounded-md bg-muted/30 p-2 text-center text-xs">
                    <div>
                      <span className="block font-bold text-foreground">{subj.chaptersCount ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground">Chapters</span>
                    </div>
                    <div>
                      <span className="block font-bold text-foreground">{(subj.questionsCount ?? 0).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">Questions</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-muted/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openSubjectDetails(subj.id)}
                      className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="h-3 w-3" /> View Details
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSubjectStatus(subj)}
                        className="h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {subj.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditSubjectModal(subj)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Subject"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubject(subj.id, subj.name)}
                        className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        title="Delete Subject"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredSubjects.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="font-semibold text-sm">No subjects match your filter criteria</p>
                <p className="text-xs mt-1">Try modifying your filter or create a new subject.</p>
                <Button size="sm" onClick={() => openCreateSubjectModal()} className="mt-3 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Create Subject
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CHAPTERS */}
      {/* ======================================================== */}
      {activeTab === "chapters" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredChapters.length} of {chapters.length} chapter(s)</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openCreateChapterModal(
                  selectedClassFilter !== "all" ? selectedClassFilter : undefined,
                  selectedSubjectFilter !== "all" ? selectedSubjectFilter : undefined
                )
              }
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3 w-3" /> New Chapter
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredChapters.map((chap) => (
              <Card key={chap.id} className="relative overflow-hidden transition-all hover:border-primary/50 shadow-2xs">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold bg-muted/30">
                          Ch. {chap.chapterNumber}
                        </Badge>
                        <Badge
                          variant={chap.status === "active" ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 ${
                            chap.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {chap.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold mt-1 text-foreground line-clamp-2">
                        {chap.name}
                      </CardTitle>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Order: #{chap.order}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <BookOpen className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="truncate">Subject: <strong className="text-foreground">{chap.subjectName || "Subject"}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">Class: <strong className="text-foreground">{chap.className || "Class"}</strong></span>
                    </div>
                  </div>

                  {chap.aliases && chap.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {chap.aliases.map((alias, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-0.5 rounded-sm bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {alias}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Telemetry pill */}
                  <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/30 p-2 text-center text-xs">
                    <div>
                      <span className="block font-bold text-foreground">{chap.mcqCount ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground">MCQs</span>
                    </div>
                    <div>
                      <span className="block font-bold text-foreground">{chap.cqCount ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground">CQs</span>
                    </div>
                    <div>
                      <span className="block font-bold text-foreground">{chap.totalCount ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground">Total</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-muted/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openChapterDetails(chap.id)}
                      className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="h-3 w-3" /> View Details
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleChapterStatus(chap)}
                        className="h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {chap.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditChapterModal(chap)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Chapter"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChapter(chap.id, chap.name)}
                        className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        title="Delete Chapter"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredChapters.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <Layers className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="font-semibold text-sm">No chapters match your filter criteria</p>
                <p className="text-xs mt-1">Try modifying your filter or create a new chapter.</p>
                <Button size="sm" onClick={() => openCreateChapterModal()} className="mt-3 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Create Chapter
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: COMPLETE HIERARCHY TREE VIEW */}
      {/* ======================================================== */}
      {activeTab === "tree" && (
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Library className="h-4 w-4 text-emerald-600" />
                  Full Interactive Curriculum Tree
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expand each academic class and subject node to inspect chapter breakdowns and real-time bank counts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allCls: Record<string, boolean> = {};
                    const allSubj: Record<string, boolean> = {};
                    tree.forEach((c) => {
                      allCls[c.id || c.className] = true;
                      c.subjects.forEach((s) => {
                        allSubj[s.id || s.name] = true;
                      });
                    });
                    setExpandedClasses(allCls);
                    setExpandedSubjects(allSubj);
                  }}
                  className="h-7 text-xs"
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExpandedClasses({});
                    setExpandedSubjects({});
                  }}
                  className="h-7 text-xs"
                >
                  Collapse All
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {tree.map((clsNode) => {
              const clsKey = clsNode.id || clsNode.className;
              const isClsExpanded = !!expandedClasses[clsKey];

              return (
                <div key={clsKey} className="rounded-lg border bg-background/50 overflow-hidden">
                  {/* Class Header Node */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => toggleTreeClass(clsKey)}
                  >
                    <div className="flex items-center gap-2">
                      {isClsExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-bold text-sm text-foreground">{clsNode.className}</span>
                      {clsNode.code && (
                        <Badge variant="outline" className="font-mono text-[10px] font-semibold">
                          {clsNode.code}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary" className="text-[10px]">
                        {clsNode.subjects?.length || 0} Subjects
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {(clsNode.totalCount || 0).toLocaleString()} Questions
                      </Badge>
                      {clsNode.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClassDetails(clsNode.id!);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title="View Class Details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subjects under Class */}
                  {isClsExpanded && (
                    <div className="border-t bg-muted/20 p-3 space-y-2.5 pl-6 sm:pl-8">
                      {clsNode.subjects?.map((subjNode) => {
                        const subjKey = subjNode.id || subjNode.name;
                        const isSubjExpanded = !!expandedSubjects[subjKey];

                        return (
                          <div key={subjKey} className="rounded-md border bg-card overflow-hidden">
                            {/* Subject Node */}
                            <div
                              className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                              onClick={() => toggleTreeSubject(subjKey)}
                            >
                              <div className="flex items-center gap-2">
                                {isSubjExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="font-semibold text-xs text-foreground">{subjNode.name}</span>
                                {subjNode.code && (
                                  <Badge variant="outline" className="text-[9px] font-mono">
                                    {subjNode.code}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-[11px] text-muted-foreground">
                                  {subjNode.chapters?.length || 0} Ch.
                                </span>
                                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                  {subjNode.mcqCount} MCQ / {subjNode.cqCount} CQ
                                </Badge>
                                {subjNode.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openSubjectDetails(subjNode.id!);
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                    title="View Subject Details"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Chapters under Subject */}
                            {isSubjExpanded && (
                              <div className="border-t bg-background p-2.5 space-y-1.5 pl-6 sm:pl-8">
                                {subjNode.chapters?.map((chapNode) => (
                                  <div
                                    key={chapNode.id || chapNode.name}
                                    className="flex items-center justify-between rounded p-1.5 text-xs hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                        Ch. {chapNode.chapterNumber || "·"}
                                      </span>
                                      <span className="text-foreground">{chapNode.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground">
                                        {chapNode.mcqCount} MCQ · {chapNode.cqCount} CQ
                                      </span>
                                      {chapNode.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openChapterDetails(chapNode.id!)}
                                          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                          title="View Chapter Details"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {(!subjNode.chapters || subjNode.chapters.length === 0) && (
                                  <p className="text-[11px] text-muted-foreground italic py-1">
                                    No chapters recorded under this subject yet.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {(!clsNode.subjects || clsNode.subjects.length === 0) && (
                        <p className="text-xs text-muted-foreground italic py-1">
                          No subjects recorded under this class yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {tree.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No hierarchy tree available. Click refresh or create classes to begin.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT ACADEMIC CLASS */}
      {/* ======================================================== */}
      <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveClass}>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? `Edit Class: ${editingClass.name}` : "Create Academic Class"}
              </DialogTitle>
              <DialogDescription>
                Academic classes represent grade levels or examination tracks (e.g., SSC, HSC, Class 9).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div>
                <Label htmlFor="cls-name">Class Name *</Label>
                <Input
                  id="cls-name"
                  placeholder="e.g. Class 9-10 (SSC)"
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cls-code">Code *</Label>
                  <Input
                    id="cls-code"
                    placeholder="e.g. SSC"
                    value={classFormData.code}
                    onChange={(e) => setClassFormData({ ...classFormData, code: e.target.value })}
                    className="mt-1 uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cls-order">Display Order</Label>
                  <Input
                    id="cls-order"
                    type="text"
                    inputMode="numeric"
                    value={classFormData.order}
                    onChange={(e) => setClassFormData({ ...classFormData, order: toStandardDigits(e.target.value) })}
                    onBlur={() => {
                      if (classFormData.order === "") setClassFormData({ ...classFormData, order: 0 });
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cls-aliases">Aliases (Comma-separated)</Label>
                <Input
                  id="cls-aliases"
                  placeholder="e.g. SSC, Class 9, Class 10, নবম-দশম"
                  value={classFormData.aliases}
                  onChange={(e) => setClassFormData({ ...classFormData, aliases: e.target.value })}
                  className="mt-1"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Used for smart parser recognition during batch question imports.
                </span>
              </div>

              <div>
                <Label htmlFor="cls-status">Status</Label>
                <Select
                  value={classFormData.status}
                  onValueChange={(val: any) => setClassFormData({ ...classFormData, status: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Visible to users)</SelectItem>
                    <SelectItem value="inactive">Inactive (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsClassModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingClass ? "Save Changes" : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT SUBJECT */}
      {/* ======================================================== */}
      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveSubject}>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? `Edit Subject: ${editingSubject.name}` : "Create Subject"}
              </DialogTitle>
              <DialogDescription>
                Subjects are linked to a parent academic class and contain curriculum chapters.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div>
                <Label htmlFor="subj-class">Parent Academic Class *</Label>
                <Select
                  value={subjectFormData.classId}
                  onValueChange={(val) => setSubjectFormData({ ...subjectFormData, classId: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subj-name">Subject Name *</Label>
                <Input
                  id="subj-name"
                  placeholder="e.g. পদার্থবিজ্ঞান (Physics)"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="subj-code">Code</Label>
                  <Input
                    id="subj-code"
                    placeholder="e.g. PHY"
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                    className="mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="subj-cat">Category</Label>
                  <Input
                    id="subj-cat"
                    placeholder="e.g. Science, General"
                    value={subjectFormData.category}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, category: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subj-aliases">Aliases (Comma-separated)</Label>
                <Input
                  id="subj-aliases"
                  placeholder="e.g. Physics, পদার্থ, পদার্থ বিজ্ঞান"
                  value={subjectFormData.aliases}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, aliases: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="subj-order">Display Order</Label>
                  <Input
                    id="subj-order"
                    type="text"
                    inputMode="numeric"
                    value={subjectFormData.order}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, order: toStandardDigits(e.target.value) })}
                    onBlur={() => {
                      if (subjectFormData.order === "") setSubjectFormData({ ...subjectFormData, order: 0 });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="subj-status">Status</Label>
                  <Select
                    value={subjectFormData.status}
                    onValueChange={(val: any) => setSubjectFormData({ ...subjectFormData, status: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSubjectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingSubject ? "Save Changes" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CHAPTER */}
      {/* ======================================================== */}
      <Dialog open={isChapterModalOpen} onOpenChange={setIsChapterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveChapter}>
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? `Edit Chapter: ${editingChapter.name}` : "Create Chapter"}
              </DialogTitle>
              <DialogDescription>
                Chapters belong to a specific subject and group question bank items.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="chap-class">Parent Class</Label>
                  <Select
                    value={chapterFormData.classId}
                    onValueChange={(val) => {
                      setChapterFormData({ ...chapterFormData, classId: val, subjectId: "" });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="chap-subj">Parent Subject *</Label>
                  <Select
                    value={chapterFormData.subjectId}
                    onValueChange={(val) => {
                      const selectedSubj = subjects.find((s) => s.id === val);
                      setChapterFormData({
                        ...chapterFormData,
                        subjectId: val,
                        classId: selectedSubj?.classId || chapterFormData.classId
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsForChapterForm.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="chap-num">Chapter # *</Label>
                  <Input
                    id="chap-num"
                    type="text"
                    inputMode="numeric"
                    value={chapterFormData.chapterNumber}
                    onChange={(e) =>
                      setChapterFormData({ ...chapterFormData, chapterNumber: toStandardDigits(e.target.value) })
                    }
                    onBlur={() => {
                      if (!chapterFormData.chapterNumber) setChapterFormData({ ...chapterFormData, chapterNumber: 1 });
                    }}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="chap-name">Chapter Name *</Label>
                  <Input
                    id="chap-name"
                    placeholder="e.g. ১ম অধ্যায়: ভৌত রাশি ও পরিমাপ"
                    value={chapterFormData.name}
                    onChange={(e) => setChapterFormData({ ...chapterFormData, name: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="chap-aliases">Aliases (Comma-separated)</Label>
                <Input
                  id="chap-aliases"
                  placeholder="e.g. ভৌত রাশি, Chapter 1, Ch 1"
                  value={chapterFormData.aliases}
                  onChange={(e) => setChapterFormData({ ...chapterFormData, aliases: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="chap-order">Order</Label>
                  <Input
                    id="chap-order"
                    type="text"
                    inputMode="numeric"
                    value={chapterFormData.order}
                    onChange={(e) =>
                      setChapterFormData({ ...chapterFormData, order: toStandardDigits(e.target.value) })
                    }
                    onBlur={() => {
                      if (chapterFormData.order === "") setChapterFormData({ ...chapterFormData, order: 0 });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="chap-status">Status</Label>
                  <Select
                    value={chapterFormData.status}
                    onValueChange={(val: any) => setChapterFormData({ ...chapterFormData, status: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsChapterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingChapter ? "Save Changes" : "Create Chapter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL: DETAILED INSPECTOR VIEW */}
      {/* ======================================================== */}
      <Dialog
        open={detailModal.open}
        onOpenChange={(open) => setDetailModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailModal.loading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading entity details from database...</p>
            </div>
          ) : detailModal.data ? (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold">
                    {detailModal.type.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={detailModal.data.status === "active" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {detailModal.data.status}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold mt-1">
                  {detailModal.data.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ID: <code className="font-mono">{detailModal.data.id}</code>
                  {detailModal.data.createdAt && (
                    <span> · Created: {new Date(detailModal.data.createdAt).toLocaleDateString()}</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              {/* CLASS DETAILS */}
              {detailModal.type === "class" && (() => {
                const clsData = detailModal.data as AcademicClassDetail;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-3 text-center">
                      <div>
                        <span className="block text-lg font-bold text-foreground">
                          {clsData.totalSubjects ?? clsData.subjects?.length ?? 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Subjects Attached</span>
                      </div>
                      <div>
                        <span className="block text-lg font-bold text-foreground">
                          {clsData.totalChapters ?? 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Total Chapters</span>
                      </div>
                      <div>
                        <span className="block text-lg font-bold text-foreground">
                          {(clsData.totalQuestions ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Questions ({clsData.mcqCount ?? 0} MCQ / {clsData.cqCount ?? 0} CQ)
                        </span>
                      </div>
                    </div>

                    {clsData.aliases && clsData.aliases.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Recognized Aliases</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {clsData.aliases.map((alias, i) => (
                            <Badge key={i} variant="outline" className="text-[11px]">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-bold text-foreground">
                          Attached Subjects ({clsData.subjects?.length || 0})
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDetailModal((prev) => ({ ...prev, open: false }));
                            openCreateSubjectModal(clsData.id);
                          }}
                          className="h-6 text-[10px] gap-1"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add Subject
                        </Button>
                      </div>

                      <div className="rounded-lg border divide-y max-h-56 overflow-y-auto">
                        {clsData.subjects?.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2.5 hover:bg-muted/30">
                            <div>
                              <span className="font-semibold text-foreground">{s.name}</span>
                              <span className="font-mono text-[10px] text-muted-foreground ml-2">({s.code})</span>
                              <Badge variant="secondary" className="ml-2 text-[9px] py-0">
                                {s.category || "General"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {s.chaptersCount ?? 0} ch. · {(s.questionsCount ?? 0)} q.
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSubjectDetails(s.id)}
                                className="h-6 w-6 p-0"
                                title="View Subject Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {(!clsData.subjects || clsData.subjects.length === 0) && (
                          <div className="p-4 text-center text-muted-foreground text-xs">
                            No subjects attached to this class yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SUBJECT DETAILS */}
              {detailModal.type === "subject" && (() => {
                const subjData = detailModal.data as SubjectDetail;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-muted/30 p-3 text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Academic Class</span>
                        <span className="font-bold text-foreground truncate block">
                          {subjData.className || subjData.class?.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Category</span>
                        <span className="font-bold text-foreground block">{subjData.category || "General"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Chapters</span>
                        <span className="font-bold text-foreground block">{subjData.chapters?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Total Questions</span>
                        <span className="font-bold text-foreground block">
                          {(subjData.totalQuestions ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-bold text-foreground">
                          Chapters in this Subject ({subjData.chapters?.length || 0})
                        </Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDetailModal((prev) => ({ ...prev, open: false }));
                            openCreateChapterModal(subjData.classId, subjData.id);
                          }}
                          className="h-6 text-[10px] gap-1"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add Chapter
                        </Button>
                      </div>

                      <div className="rounded-lg border divide-y max-h-56 overflow-y-auto">
                        {subjData.chapters?.map((ch) => (
                          <div key={ch.id} className="flex items-center justify-between p-2.5 hover:bg-muted/30">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono font-bold text-[10px] text-muted-foreground">
                                Ch. {ch.chapterNumber}
                              </span>
                              <span className="font-semibold text-foreground truncate">{ch.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground">
                                {ch.mcqCount ?? 0} MCQ · {ch.cqCount ?? 0} CQ
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openChapterDetails(ch.id)}
                                className="h-6 w-6 p-0"
                                title="View Chapter Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {(!subjData.chapters || subjData.chapters.length === 0) && (
                          <div className="p-4 text-center text-muted-foreground text-xs">
                            No chapters recorded under this subject yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CHAPTER DETAILS */}
              {detailModal.type === "chapter" && (() => {
                const chapData = detailModal.data as ChapterDetail;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg bg-muted/30 p-3 text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Class</span>
                        <span className="font-bold text-foreground block truncate">
                          {chapData.className || chapData.class?.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Subject</span>
                        <span className="font-bold text-foreground block truncate">
                          {chapData.subjectName || chapData.subject?.name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Chapter Number</span>
                        <span className="font-bold text-foreground block">Chapter {chapData.chapterNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg border p-2.5 text-center">
                      <div>
                        <span className="block text-base font-bold text-foreground">{chapData.mcqCount ?? 0}</span>
                        <span className="text-[10px] text-muted-foreground">MCQs</span>
                      </div>
                      <div>
                        <span className="block text-base font-bold text-foreground">{chapData.cqCount ?? 0}</span>
                        <span className="text-[10px] text-muted-foreground">CQs</span>
                      </div>
                      <div>
                        <span className="block text-base font-bold text-foreground">
                          {(chapData.totalQuestions ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Total Questions</span>
                      </div>
                    </div>

                    {chapData.aliases && chapData.aliases.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Recognized Aliases</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chapData.aliases.map((alias, i) => (
                            <Badge key={i} variant="outline" className="text-[11px]">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {chapData.sampleQuestions && chapData.sampleQuestions.length > 0 && (
                      <div>
                        <Label className="font-bold text-foreground mb-1 block">
                          Recent Questions Sample
                        </Label>
                        <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                          {chapData.sampleQuestions.map((q) => (
                            <div key={q.id} className="p-2 text-xs flex items-center justify-between gap-2">
                              <span className="truncate text-foreground">{q.title}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge variant="outline" className="font-mono text-[9px] uppercase">
                                  {q.type}
                                </Badge>
                                {q.difficulty && (
                                  <Badge variant="secondary" className="text-[9px]">
                                    {q.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <DialogFooter className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailModal((prev) => ({ ...prev, open: false }))}
                >
                  Close
                </Button>
                {detailModal.type === "class" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDetailModal((prev) => ({ ...prev, open: false }));
                      openEditClassModal(detailModal.data as AcademicClass);
                    }}
                  >
                    Edit Class
                  </Button>
                )}
                {detailModal.type === "subject" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDetailModal((prev) => ({ ...prev, open: false }));
                      openEditSubjectModal(detailModal.data as SubjectEntity);
                    }}
                  >
                    Edit Subject
                  </Button>
                )}
                {detailModal.type === "chapter" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDetailModal((prev) => ({ ...prev, open: false }));
                      openEditChapterModal(detailModal.data as ChapterEntity);
                    }}
                  >
                    Edit Chapter
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
