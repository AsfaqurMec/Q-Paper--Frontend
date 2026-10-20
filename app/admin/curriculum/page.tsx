import { AppShell } from "@/components/app-shell";
import { AdminCurriculumView } from "@/components/admin-curriculum-view";
import { api, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage() {
  const user = await requireAdmin();
  const [classes, subjects, chapters, stats, tree] = await Promise.all([
    api.curriculumClasses("status=all").catch(() => []),
    api.curriculumSubjects("status=all").catch(() => []),
    api.curriculumChapters("status=all").catch(() => []),
    api.curriculumStats().catch(() => null),
    api.questionBankHierarchy().catch(() => [])
  ]);

  return (
    <AppShell user={user}>
      <AdminCurriculumView
        initialClasses={classes}
        initialSubjects={subjects}
        initialChapters={chapters}
        initialStats={stats}
        initialTree={tree}
      />
    </AppShell>
  );
}
