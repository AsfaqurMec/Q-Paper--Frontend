import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminRequestDetailsView } from "@/components/admin-request-details-view";
import { api, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  try {
    const requestDetails = await api.adminPaymentRequest(id);
    if (!requestDetails) return notFound();

    return (
      <AppShell user={user}>
        <AdminRequestDetailsView
          initialRequest={requestDetails}
          userStats={{
            user: requestDetails.user,
            paperCount: requestDetails.userPaperCount
          }}
        />
      </AppShell>
    );
  } catch (error) {
    return notFound();
  }
}
