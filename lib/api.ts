import { redirect } from "next/navigation";
import { getAccessToken, getSessionUser } from "@/lib/auth";
import type {
  AcademicClass,
  AcademicClassDetail,
  AdminDashboard,
  AdminPaperItem,
  AdminUser,
  ApiResponse,
  BankBoard,
  BankCategory,
  BankQuestion,
  BankTag,
  BankYear,
  ChapterDetail,
  ChapterEntity,
  ClassHierarchy,
  CurriculumStats,
  DashboardData,
  Notification,
  Paper,
  Plan,
  PublicSharedPaperResponse,
  QuestionImportResult,
  SharedLink,
  SubjectDetail,
  SubjectEntity,
  SupportTicket,
  PaymentOption,
  PaymentRequest,
  UserSession
} from "@/lib/api-types";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

async function unwrap<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: ApiResponse<T> | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // Non-JSON response
    }
  }
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || (text && text.length < 250 && !text.includes("<html") ? text : `API request failed (${response.status})`));
  }
  return payload.data;
}

async function apiGet<T>(path: string) {
  const token = await getAccessToken();
  if (!token) redirect("/login");

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/dashboard");
  return unwrap<T>(response);
}

async function apiMutate<T>(path: string, method: "POST" | "PATCH" | "DELETE" | "PUT", body?: unknown) {
  const token = await getAccessToken();
  if (!token) redirect("/login");

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/dashboard");
  return unwrap<T>(response);
}

export async function fetchPublicSharedPaper(token: string, password?: string): Promise<PublicSharedPaperResponse> {
  const url = new URL(`${API_URL}/api/shared-links/public/${token}`);
  if (password) url.searchParams.set("password", password);
  const response = await fetch(url.toString(), { cache: "no-store" });
  return unwrap<PublicSharedPaperResponse>(response);
}

export async function requireUser() {
  const user = await getSessionUser();
  const token = await getAccessToken();
  if (!user || !token) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

import { DEFAULT_PLANS } from "@/lib/plan-constants";
export { DEFAULT_PLANS };


export async function fetchPlans(): Promise<Plan[]> {
  const candidateUrls = Array.from(
    new Set([
      `${API_URL}/api/plans`,
      "http://127.0.0.1:5001/api/plans",
      "http://localhost:5001/api/plans",
      "http://127.0.0.1:5000/api/plans",
      "http://localhost:5000/api/plans"
    ])
  );

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        const list = json?.data || json;
        if (Array.isArray(list) && list.length > 0) {
          return [...list].sort((a: Plan, b: Plan) => Number(a.price || 0) - Number(b.price || 0));
        }
      }
    } catch {
      // Continue to next URL
    }
  }

  return [...DEFAULT_PLANS].sort((a: Plan, b: Plan) => Number(a.price || 0) - Number(b.price || 0));
}

export const api = {
  profile: () => apiGet<UserSession>("/api/auth/me"),
  dashboard: () => apiGet<DashboardData>("/api/dashboard"),
  plans: fetchPlans,
  papers: () => apiGet<Paper[]>("/api/papers"),
  paper: (id: string) => apiGet<Paper>(`/api/papers/${id}`),
  questionBank: (query?: string) => apiGet<BankQuestion[]>(`/api/question-bank${query ? `?${query}` : ""}`),
  questionBankCategories: () => apiGet<BankCategory[]>("/api/question-bank/categories"),
  questionBankTags: () => apiGet<BankTag[]>("/api/question-bank/tags"),
  questionBankBoards: () => apiGet<BankBoard[]>("/api/question-bank/boards"),
  questionBankYears: () => apiGet<BankYear[]>("/api/question-bank/years"),
  questionBankHierarchy: () => apiGet<ClassHierarchy[]>("/api/question-bank/hierarchy"),
  notifications: () => apiGet<Notification[]>("/api/notifications"),
  supportTickets: () => apiGet<SupportTicket[]>("/api/support/tickets"),
  ticket: (id: string) => apiGet<SupportTicket>(`/api/support/tickets/${id}`),
  createTicket: (data: { subject: string; category?: string; priority?: string; message: string }) =>
    apiMutate<SupportTicket>("/api/support/tickets", "POST", data),
  replyTicket: (id: string, data: { message: string; status?: string }) =>
    apiMutate<SupportTicket>(`/api/support/tickets/${id}/replies`, "POST", data),
  updateTicketStatus: (id: string, status: string) =>
    apiMutate<SupportTicket>(`/api/support/tickets/${id}/status`, "PATCH", { status }),
  sharedLinks: () => apiGet<SharedLink[]>("/api/shared-links"),
  createSharedLink: (data: { paperId: string; mode: string; password?: string }) =>
    apiMutate<SharedLink>("/api/shared-links", "POST", data),
  deleteSharedLink: (id: string) =>
    apiMutate<{ id: string }>(`/api/shared-links/${id}`, "DELETE"),
  adminDashboard: () => apiGet<AdminDashboard>("/api/admin/dashboard"),
  adminPlans: () => apiGet<Plan[]>("/api/admin/plans"),
  adminUsers: (query?: string) => apiGet<AdminUser[]>(`/api/admin/users${query ? `?${query}` : ""}`),
  adminUpdateUserPlan: (id: string, plan: string) =>
    apiMutate<{ id: string; plan: string }>(`/api/admin/users/${id}/plan`, "PATCH", { plan }),
  adminUpdateUserRole: (id: string, role: "user" | "admin") =>
    apiMutate<{ id: string; role: string }>(`/api/admin/users/${id}/role`, "PATCH", { role }),
  adminDeleteUser: (id: string) =>
    apiMutate<{ id: string }>(`/api/admin/users/${id}`, "DELETE"),
  adminTickets: (status?: string) =>
    apiGet<SupportTicket[]>(`/api/admin/tickets${status ? `?status=${status}` : ""}`),
  adminReplyTicket: (id: string, data: { message: string; status?: string }) =>
    apiMutate<SupportTicket>(`/api/admin/tickets/${id}/reply`, "POST", data),
  adminPapers: (query?: string) =>
    apiGet<{ papers: AdminPaperItem[]; total: number }>(`/api/admin/papers${query ? `?${query}` : ""}`),
  adminImportQuestionBankJson: (data: unknown, query?: string) =>
    apiMutate<QuestionImportResult>(`/api/admin/question-bank/import-json${query ? `?${query}` : ""}`, "POST", data),
  curriculumStats: () => apiGet<CurriculumStats>("/api/curriculum/stats"),
  curriculumClasses: (query?: string) => apiGet<AcademicClass[]>(`/api/curriculum/classes${query ? `?${query}` : ""}`),
  curriculumClass: (id: string) => apiGet<AcademicClassDetail>(`/api/curriculum/classes/${id}`),
  createAcademicClass: (data: unknown) => apiMutate<AcademicClass>("/api/curriculum/classes", "POST", data),
  updateAcademicClass: (id: string, data: unknown) => apiMutate<AcademicClass>(`/api/curriculum/classes/${id}`, "PUT", data),
  deleteAcademicClass: (id: string, force = false) => apiMutate<{ id: string }>(`/api/curriculum/classes/${id}${force ? "?force=true" : ""}`, "DELETE"),
  curriculumSubjects: (query?: string) => apiGet<SubjectEntity[]>(`/api/curriculum/subjects${query ? `?${query}` : ""}`),
  curriculumSubject: (id: string) => apiGet<SubjectDetail>(`/api/curriculum/subjects/${id}`),
  createSubject: (data: unknown) => apiMutate<SubjectEntity>("/api/curriculum/subjects", "POST", data),
  updateSubject: (id: string, data: unknown) => apiMutate<SubjectEntity>(`/api/curriculum/subjects/${id}`, "PUT", data),
  deleteSubject: (id: string, force = false) => apiMutate<{ id: string }>(`/api/curriculum/subjects/${id}${force ? "?force=true" : ""}`, "DELETE"),
  curriculumChapters: (query?: string) => apiGet<ChapterEntity[]>(`/api/curriculum/chapters${query ? `?${query}` : ""}`),
  curriculumChapter: (id: string) => apiGet<ChapterDetail>(`/api/curriculum/chapters/${id}`),
  createChapter: (data: unknown) => apiMutate<ChapterEntity>("/api/curriculum/chapters", "POST", data),
  updateChapter: (id: string, data: unknown) => apiMutate<ChapterEntity>(`/api/curriculum/chapters/${id}`, "PUT", data),
  deleteChapter: (id: string, force = false) => apiMutate<{ id: string }>(`/api/curriculum/chapters/${id}${force ? "?force=true" : ""}`, "DELETE"),
  paymentOptions: () => apiGet<PaymentOption[]>("/api/billing/payment-options"),
  myPaymentRequests: () => apiGet<PaymentRequest[]>("/api/billing/my-requests"),
  adminPaymentOptions: () => apiGet<PaymentOption[]>("/api/admin/payment-options"),
  adminPaymentRequests: (query?: string) =>
    apiGet<{ requests: PaymentRequest[]; total: number; pendingCount: number }>(`/api/admin/payment-requests${query ? `?${query}` : ""}`),
  adminPaymentRequest: (id: string) =>
    apiGet<PaymentRequest & { user: AdminUser | null; userPaperCount: number }>(`/api/admin/payment-requests/${id}`),
  adminApprovePaymentRequest: (id: string, data?: { note?: string }) =>
    apiMutate<unknown>(`/api/admin/payment-requests/${id}/approve`, "POST", data || {}),
  adminRejectPaymentRequest: (id: string, data?: { reason?: string }) =>
    apiMutate<unknown>(`/api/admin/payment-requests/${id}/reject`, "POST", data || {})
};

