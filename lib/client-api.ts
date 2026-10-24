import type {
  AcademicClass,
  AcademicClassDetail,
  AdminDashboard,
  AdminPaperItem,
  AdminUser,
  ApiResponse,
  ChapterDetail,
  ChapterEntity,
  ClassHierarchy,
  CurriculumStats,
  Paper,
  PublicSharedPaperResponse,
  QuestionImportResult,
  SharedLink,
  SubjectDetail,
  SubjectEntity,
  SupportTicket,
  PaymentOption,
  PaymentRequest,
  Plan,
  UserSession
} from "@/lib/api-types";

async function unwrap<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: ApiResponse<T> | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // Body was not JSON
    }
  }

  // If payload indicates successful execution, return data
  if (payload && payload.success) {
    return payload.data;
  }

  if (!response.ok || !payload?.success) {
    const defaultMsg = response.status >= 500
      ? `Server error (${response.status})`
      : response.status === 404
        ? "Resource not found"
        : `Request failed (${response.status})`;
    let message = payload?.message;
    if (!message && text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed?.message) message = parsed.message;
      } catch {}
    }
    if (!message) {
      message = text && text.length < 250 && !text.includes("<html") && !text.trim().startsWith("{")
        ? text
        : defaultMsg;
    }
    throw new Error(message);
  }

  return (payload as any)?.data;
}

import { getDeviceHeaders } from "@/lib/device";

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const isAuthRoute = path.startsWith("/api/auth/") || path.startsWith("api/auth/");
  const isDirectApi = path === "/api/plans" || path === "api/plans";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = isAuthRoute || isDirectApi ? normalizedPath : `/api/backend${path.replace(/^\/api/, "")}`;
  const deviceHeaders = typeof window !== "undefined" ? getDeviceHeaders() : {};
  const response = await fetch(targetUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...deviceHeaders,
      ...options.headers
    }
  });
  return unwrap<T>(response);
}

export async function fetchPublicSharedPaper(token: string, password?: string): Promise<PublicSharedPaperResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  if (password) {
    const response = await fetch(`${apiUrl}/api/shared-links/public/${token}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store"
    });
    return unwrap<PublicSharedPaperResponse>(response);
  }
  const response = await fetch(`${apiUrl}/api/shared-links/public/${token}`, { cache: "no-store" });
  return unwrap<PublicSharedPaperResponse>(response);
}

export const clientApi = {
  plans: () =>
    apiRequest<Plan[]>("/api/plans"),
  getProfile: () =>
    apiRequest<UserSession>("/api/auth/profile"),
  updateProfile: (data: {
    name?: string;
    phone?: string;
    institute?: string;
    instituteLogo?: string;
    instituteBranding?: boolean;
  }) => apiRequest<UserSession>("/api/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest<UserSession>("/api/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
  getTickets: () =>
    apiRequest<SupportTicket[]>("/api/support/tickets"),
  getTicket: (id: string) =>
    apiRequest<SupportTicket>(`/api/support/tickets/${id}`),
  createTicket: (data: { subject: string; category?: string; priority?: string; message: string }) =>
    apiRequest<SupportTicket>("/api/support/tickets", { method: "POST", body: JSON.stringify(data) }),
  replyTicket: (id: string, data: { message: string; status?: string }) =>
    apiRequest<SupportTicket>(`/api/support/tickets/${id}/replies`, { method: "POST", body: JSON.stringify(data) }),
  updateTicketStatus: (id: string, status: string) =>
    apiRequest<SupportTicket>(`/api/support/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  createSharedLink: (data: { paperId: string; mode: string; password?: string }) =>
    apiRequest<SharedLink>("/api/shared-links", { method: "POST", body: JSON.stringify(data) }),
  deleteSharedLink: (id: string) =>
    apiRequest<{ id: string }>(`/api/shared-links/${id}`, { method: "DELETE" }),
  adminGetPlans: () =>
    apiRequest<Plan[]>("/api/admin/plans"),
  adminCreatePlan: (data: Partial<Plan>) =>
    apiRequest<Plan>("/api/admin/plans", { method: "POST", body: JSON.stringify(data) }),
  adminUpdatePlan: (code: string, data: Partial<Plan>) =>
    apiRequest<Plan>(`/api/admin/plans/${code}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeletePlan: (code: string) =>
    apiRequest<{ deleted: boolean }>(`/api/admin/plans/${code}`, { method: "DELETE" }),
  adminUpdateUserPlan: (id: string, plan: string) =>
    apiRequest<{ id: string; plan: string }>(`/api/admin/users/${id}/plan`, { method: "PATCH", body: JSON.stringify({ plan }) }),
  adminUpdateUserRole: (id: string, role: "user" | "admin") =>
    apiRequest<{ id: string; role: string }>(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  adminDeleteUser: (id: string) =>
    apiRequest<{ id: string }>(`/api/admin/users/${id}`, { method: "DELETE" }),
  adminGetTickets: (status?: string) =>
    apiRequest<SupportTicket[]>(`/api/admin/tickets${status ? `?status=${status}` : ""}`),
  adminReplyTicket: (id: string, data: { message: string; status?: string }) =>
    apiRequest<SupportTicket>(`/api/admin/tickets/${id}/reply`, { method: "POST", body: JSON.stringify(data) }),
  adminPapers: (query?: string) =>
    apiRequest<{ papers: AdminPaperItem[]; total: number }>(`/api/admin/papers${query ? `?${query}` : ""}`),
  adminDeletePaper: (id: string) =>
    apiRequest<{ id: string }>(`/api/admin/papers/${id}`, { method: "DELETE" }),
  generatePaper: (data: any) =>
    apiRequest<Paper>("/api/question-bank/generate-paper", { method: "POST", body: JSON.stringify(data) }),
  adminImportQuestionBankJson: (data: unknown, query?: string) =>
    apiRequest<QuestionImportResult>(`/api/admin/question-bank/import-json${query ? `?${query}` : ""}`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  curriculumStats: () =>
    apiRequest<CurriculumStats>("/api/curriculum/stats"),
  curriculumClasses: (query?: string) =>
    apiRequest<AcademicClass[]>(`/api/curriculum/classes${query ? `?${query}` : ""}`),
  curriculumClass: (id: string) =>
    apiRequest<AcademicClassDetail>(`/api/curriculum/classes/${id}`),
  createAcademicClass: (data: unknown) =>
    apiRequest<AcademicClass>("/api/curriculum/classes", { method: "POST", body: JSON.stringify(data) }),
  updateAcademicClass: (id: string, data: unknown) =>
    apiRequest<AcademicClass>(`/api/curriculum/classes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAcademicClass: (id: string, force = false) =>
    apiRequest<{ id: string }>(`/api/curriculum/classes/${id}${force ? "?force=true" : ""}`, { method: "DELETE" }),
  curriculumSubjects: (query?: string) =>
    apiRequest<SubjectEntity[]>(`/api/curriculum/subjects${query ? `?${query}` : ""}`),
  curriculumSubject: (id: string) =>
    apiRequest<SubjectDetail>(`/api/curriculum/subjects/${id}`),
  createSubject: (data: unknown) =>
    apiRequest<SubjectEntity>("/api/curriculum/subjects", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id: string, data: unknown) =>
    apiRequest<SubjectEntity>(`/api/curriculum/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubject: (id: string, force = false) =>
    apiRequest<{ id: string }>(`/api/curriculum/subjects/${id}${force ? "?force=true" : ""}`, { method: "DELETE" }),
  curriculumChapters: (query?: string) =>
    apiRequest<ChapterEntity[]>(`/api/curriculum/chapters${query ? `?${query}` : ""}`),
  curriculumChapter: (id: string) =>
    apiRequest<ChapterDetail>(`/api/curriculum/chapters/${id}`),
  createChapter: (data: unknown) =>
    apiRequest<ChapterEntity>("/api/curriculum/chapters", { method: "POST", body: JSON.stringify(data) }),
  updateChapter: (id: string, data: unknown) =>
    apiRequest<ChapterEntity>(`/api/curriculum/chapters/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteChapter: (id: string, force = false) =>
    apiRequest<{ id: string }>(`/api/curriculum/chapters/${id}${force ? "?force=true" : ""}`, { method: "DELETE" }),
  curriculumTree: (onlyActive = false) =>
    apiRequest<ClassHierarchy[]>(`/api/curriculum/tree${onlyActive ? "?onlyActive=true" : ""}`),
  getPaymentOptions: () =>
    apiRequest<PaymentOption[]>("/api/billing/payment-options"),
  submitCheckout: (data: {
    planCode: string;
    paymentOptionId: string;
    transactionId: string;
    senderNumber?: string;
    customerNote?: string;
  }) =>
    apiRequest<PaymentRequest>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getMyPaymentRequests: () =>
    apiRequest<PaymentRequest[]>("/api/billing/my-requests"),
  adminPaymentOptions: () =>
    apiRequest<PaymentOption[]>("/api/admin/payment-options"),
  adminCreatePaymentOption: (data: {
    title: string;
    subtitle: string;
    number: string;
    instruction?: string;
    isActive?: boolean;
  }) =>
    apiRequest<PaymentOption>("/api/admin/payment-options", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  adminUpdatePaymentOption: (
    id: string,
    data: Partial<{
      title: string;
      subtitle: string;
      number: string;
      instruction: string;
      isActive: boolean;
    }>
  ) =>
    apiRequest<PaymentOption>(`/api/admin/payment-options/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  adminDeletePaymentOption: (id: string) =>
    apiRequest<{ id: string }>(`/api/admin/payment-options/${id}`, {
      method: "DELETE"
    }),
  adminPaymentRequests: (query?: string) =>
    apiRequest<{ requests: PaymentRequest[]; total: number; pendingCount: number }>(
      `/api/admin/payment-requests${query ? `?${query}` : ""}`
    ),
  adminPaymentRequest: (id: string) =>
    apiRequest<PaymentRequest & { user: AdminUser | null; userPaperCount: number }>(
      `/api/admin/payment-requests/${id}`
    ),
  adminApprovePaymentRequest: (id: string, note?: string) =>
    apiRequest<{ request: PaymentRequest; user: any }>(`/api/admin/payment-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note })
    }),
  adminRejectPaymentRequest: (id: string, reason?: string) =>
    apiRequest<PaymentRequest>(`/api/admin/payment-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
};


