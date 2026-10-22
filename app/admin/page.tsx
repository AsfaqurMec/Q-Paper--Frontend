import { AppShell } from "@/components/app-shell";
import { AdminDashboardView } from "@/components/admin-dashboard-view";
import { api, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [adminStats, users, tickets, papersResult, hierarchy, requestsResult, paymentOptions, plans] = await Promise.all([
    api.adminDashboard(),
    api.adminUsers(),
    api.adminTickets(),
    api.adminPapers().catch(() => ({ papers: [], total: 0 })),
    api.questionBankHierarchy().catch(() => []),
    api.adminPaymentRequests().catch(() => ({ requests: [], total: 0, pendingCount: 0 })),
    api.adminPaymentOptions().catch(() => []),
    api.adminPlans().catch(() => [])
  ]);

  return (
    <AppShell user={user}>
      <AdminDashboardView
        initialStats={adminStats}
        initialUsers={users}
        initialTickets={tickets}
        initialPapers={papersResult.papers}
        initialHierarchy={hierarchy}
        initialRequests={requestsResult.requests}
        initialPaymentOptions={paymentOptions}
        initialPlans={plans}
      />
    </AppShell>
  );
}
