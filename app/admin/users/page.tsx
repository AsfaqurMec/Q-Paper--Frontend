import { AppShell } from "@/components/app-shell";
import { AdminUserManagementView } from "@/components/admin-user-management-view";
import { api, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const [users, requestsResult, options] = await Promise.all([
    api.adminUsers().catch(() => []),
    api.adminPaymentRequests().catch(() => ({ requests: [], total: 0, pendingCount: 0 })),
    api.adminPaymentOptions().catch(() => [])
  ]);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ইউজার ম্যানেজমেন্ট ও পেমেন্ট রিকোয়েস্ট (User Management)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            পেন্ডিং প্যাকেজ আপগ্রেড রিকোয়েস্টসমূহ অনুমোদন করুন, ব্যবহারকারী একাউন্ট পরিচালনা করুন এবং পেমেন্ট গেটওয়ে কনফিগার করুন।
          </p>
        </div>

        <AdminUserManagementView
          initialUsers={users}
          initialRequests={requestsResult.requests}
          initialOptions={options}
        />
      </div>
    </AppShell>
  );
}
