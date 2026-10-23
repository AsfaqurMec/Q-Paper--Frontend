export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
};

export type UserSession = {
  id: string;
  name?: string;
  email?: string;
  role: "user" | "admin";
  plan: "free" | "small" | "pro" | "ultra" | "diamond" | "standard" | string;
  verified?: boolean;
  phone?: string;
  institute?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthPayload = {
  user: UserSession;
  accessToken: string;
  refreshToken: string;
};

export type DashboardData = {
  stats: {
    totalPapers: number;
    papersRemaining: number;
    currentPlan: string;
    planCode?: string;
    totalQuestions?: number;
    totalQuestionsLimit?: number;
    subscriptionExpiry: string;
    totalDownloads: number;
    questionBankCount: number;
  };
  charts: {
    papersCreated: Array<{ month: string; value: number }>;
    downloads: Array<{ month: string; value: number }>;
  };
  recentActivity: string[];
};

export type Plan = {
  code: string;
  name: string;
  price: number;
  interval: "lifetime" | "month" | "year" | "day" | string;
  duration?: string;
  durationDays?: number;
  paperLimit: number;
  questionLimit: number;
  totalQuestionsLimit: number;
  exports: Array<"pdf" | "docx">;
  importQuestion: boolean;
  watermark: boolean;
  questionBank: boolean;
  branding: boolean;
  randomGenerator: boolean;
  multipleVersions: boolean;
  description?: string;
  isActive?: boolean;
};

export type Paper = {
  id: string;
  ownerId?: string;
  name: string;
  subject: string;
  className: string;
  examType: string;
  duration: string;
  totalMarks: number;
  institute?: string;
  instructions?: string;
  questionNumberStyle: "numeric" | "upper-alpha" | "lower-alpha" | "roman";
  optionLabelStyle: "upper-alpha" | "bangla" | "lower-alpha" | "numeric";
  questionsPerPage: number;
  layout: "single" | "split";
  cqLayout?: "single" | "split";
  setName?: string;
  mcqSectionTitle?: string;
  cqSectionTitle?: string;
  sectionFlow?: "separate" | "single";
  status: "draft" | "published" | "archived";
  questions: Array<{
    id: string;
    number?: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    marks: number;
    explanation?: string;
    type?: "mcq" | "cq";
    options: Array<{ id: string; label: string; text: string; isCorrect: boolean }>;
    subQuestions?: Array<{ id: string; label?: string; text: string; marks: number; answer?: string; explanation?: string }>;
  }>;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  read: boolean;
};

export type TicketMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  category?: "billing" | "paper_generation" | "math_formatting" | "feature_request" | "general";
  priority?: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  replies: number;
  lastMessage?: string;
  messages?: TicketMessage[];
  createdAt?: string;
  updatedAt?: string;
};

export type BankSubQuestion = {
  id?: string;
  label: string;
  text: string;
  marks: number;
  answer?: string;
  explanation?: string;
};

export type BankQuestion = {
  id: string;
  ownerId?: string;
  classId?: string;
  subjectId?: string;
  chapterId?: string;
  className?: string;
  subject?: string;
  chapter?: string;
  category: string;
  type?: "mcq" | "cq" | "both";
  nature?: "theory" | "mathematical";
  difficulty: "easy" | "medium" | "hard" | string;
  board?: string;
  year?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  marks?: number;
  options: string[];
  correctIndex: number;
  subQuestions?: BankSubQuestion[];
  explanation?: string;
  tags?: string[];
  usageCount: number;
  createdAt: string;
  updatedAt?: string;
};

export type BankCategory = {
  name: string;
  count: number;
};

export type BankTag = {
  name: string;
  count: number;
};

export type BankBoard = {
  name: string;
  count: number;
};

export type BankYear = {
  name: string;
  count: number;
};

export type BankPaginatedResponse = {
  items: BankQuestion[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

export type ChapterHierarchy = {
  id?: string;
  classId?: string;
  subjectId?: string;
  chapterNumber?: number;
  name: string;
  nameBn?: string;
  mcqCount: number;
  cqCount: number;
  totalCount: number;
};

export type SubjectHierarchy = {
  id?: string;
  classId?: string;
  name: string;
  nameBn?: string;
  code?: string;
  category?: string;
  mcqCount: number;
  cqCount: number;
  totalCount: number;
  chapters: ChapterHierarchy[];
};

export type ClassHierarchy = {
  id?: string;
  className: string;
  nameBn?: string;
  code?: string;
  mcqCount: number;
  cqCount: number;
  totalCount: number;
  subjects: SubjectHierarchy[];
};

export type AcademicClass = {
  id: string;
  name: string;
  nameBn?: string;
  code: string;
  aliases: string[];
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  subjectsCount?: number;
  chaptersCount?: number;
  questionsCount?: number;
};

export type AcademicClassDetail = AcademicClass & {
  subjects: Array<SubjectEntity & { chaptersCount: number; questionsCount: number }>;
  totalSubjects: number;
  totalChapters: number;
  totalQuestions: number;
  mcqCount: number;
  cqCount: number;
};

export type SubjectEntity = {
  id: string;
  classId: string;
  className?: string;
  name: string;
  nameBn?: string;
  code: string;
  category: string;
  aliases: string[];
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  chaptersCount?: number;
  questionsCount?: number;
};

export type SubjectDetail = SubjectEntity & {
  class?: AcademicClass | null;
  chapters: Array<ChapterEntity & { mcqCount: number; cqCount: number; totalCount: number }>;
  totalChapters: number;
  totalQuestions: number;
  mcqCount: number;
  cqCount: number;
};

export type ChapterEntity = {
  id: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  chapterNumber: number;
  name: string;
  nameBn?: string;
  aliases?: string[];
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  mcqCount?: number;
  cqCount?: number;
  totalCount?: number;
};

export type ChapterDetail = ChapterEntity & {
  subject?: SubjectEntity | null;
  class?: AcademicClass | null;
  totalQuestions?: number;
  sampleQuestions?: Array<{ id: string; title: string; type?: string; difficulty?: string }>;
};

export type CurriculumStats = {
  totalClasses: number;
  activeClasses: number;
  totalSubjects: number;
  activeSubjects: number;
  totalChapters: number;
  activeChapters: number;
  totalQuestions: number;
  linkedQuestions: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "small" | "pro" | "ultra" | "diamond" | "standard";
  verified: boolean;
  paperCount: number;
  createdAt: string;
  updatedAt?: string;
};

export type AdminPaperItem = {
  id: string;
  name: string;
  subject: string;
  className: string;
  examType: string;
  duration: string;
  totalMarks: number;
  layout: "single" | "split";
  status: "draft" | "published" | "archived";
  questionsCount: number;
  mcqCount: number;
  cqCount: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPlan: "free" | "small" | "pro" | "ultra" | "diamond" | "standard";
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboard = {
  totals: {
    users: number;
    papers: number;
    questions: number;
    sharedLinks: number;
    sharedVisits?: number;
    protectedSharedLinks?: number;
    openTickets: number;
    pendingPaymentRequests?: number;
    revenue: number;
  };
  plans: {
    free: number;
    small?: number;
    pro: number;
    ultra: number;
    diamond?: number;
    standard?: number;
  };
  system?: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
      externalMb: number;
    };
    database: {
      status: "connected" | "disconnected";
      name: string;
      host: string;
    };
  };
  questionBankAnalytics?: {
    bySubject: Array<{
      subject: string;
      className: string;
      count: number;
      chapters: number;
      mcqCount: number;
      cqCount: number;
    }>;
    byType: {
      mcq: number;
      cq: number;
    };
    byDifficulty: {
      easy: number;
      medium: number;
      hard: number;
    };
    byNature: {
      theory: number;
      mathematical: number;
    };
  };
  popularPaperSubjects?: Array<{
    subject: string;
    count: number;
  }>;
  activityFeed?: Array<{
    id: string;
    type: "user_signup" | "paper_created" | "support_ticket" | "shared_link";
    title: string;
    subtitle: string;
    timestamp: string;
    badge?: string;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    plan: "free" | "small" | "pro" | "ultra" | "diamond" | "standard";
    createdAt: string;
  }>;
  recentTickets: Array<{
    id: string;
    userName: string;
    userEmail: string;
    subject: string;
    status: string;
    category: string;
    priority: string;
    replies: number;
    updatedAt: string;
  }>;
};

export type SharedLink = {
  id: string;
  token?: string;
  paperId?: string;
  paperName?: string;
  subject?: string;
  className?: string;
  url: string;
  mode: "view_only" | "download_pdf" | string;
  protected: boolean;
  visits: number;
  createdAt?: string;
};

export type PublicSharedPaperResponse = {
  isProtected: boolean;
  paperName?: string;
  subject?: string;
  className?: string;
  mode?: "view_only" | "download_pdf";
  visits?: number;
  paper?: Paper;
};

export type QuestionImportResult = {
  totalReceived: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ index: number; title?: string; error: string }>;
  sampleInserted: Array<{ id: string; title: string; type: string; subject: string; className: string }>;
};

export type PaymentOption = {
  id: string;
  title: string;
  subtitle: string;
  number: string;
  instruction?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export type PaymentRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  planCode: "small" | "pro" | "ultra" | "diamond" | "standard";
  planName: string;
  amount: number;
  paymentOptionId: string;
  paymentOptionTitle: string;
  paymentOptionSubtitle: string;
  paymentOptionNumber: string;
  transactionId: string;
  senderNumber?: string;
  customerNote?: string;
  status: PaymentRequestStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
  user?: AdminUser | null;
  userPaperCount?: number;
};



