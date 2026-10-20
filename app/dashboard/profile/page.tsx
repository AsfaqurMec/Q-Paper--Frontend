import type { Metadata } from "next";
import { api, requireUser } from "@/lib/api";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "My Profile - ExamCraft",
  description: "Manage your profile details, password, package limits and subscription"
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await requireUser();

  const [profileUser, plans, dashboardData, myRequests] = await Promise.all([
    api.profile().catch(() => currentUser),
    api.plans().catch(() => []),
    api.dashboard().catch(() => ({
      stats: {
        totalPapers: 0,
        papersRemaining: 0,
        currentPlan: currentUser.plan,
        planCode: currentUser.plan,
        totalQuestions: 0,
        totalQuestionsLimit: 60,
        subscriptionExpiry: "Active",
        totalDownloads: 0,
        questionBankCount: 0
      },
      charts: { papersCreated: [], downloads: [] },
      recentActivity: []
    })),
    api.myPaymentRequests().catch(() => [])
  ]);

  return (
    <ProfileView
      initialUser={profileUser || currentUser}
      plans={plans}
      dashboardStats={dashboardData.stats}
      myRequests={myRequests}
    />
  );
}
