import { redirect } from "next/navigation";
import { QuestionCreationWizard } from "@/components/question-creation-wizard";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

import type { Route } from "next";

export default async function PaperQuestionsPage({
  params,
  searchParams
}: {
  params: Promise<{ paperId: string }>;
  searchParams: Promise<{ method?: string; importType?: string }>;
}) {
  const { paperId } = await params;
  const query = await searchParams;
  const [paper, user] = await Promise.all([
    api.paper(paperId),
    getSessionUser()
  ]);
  const initialMethod = query.method === "automatic" || query.method === "manual" ? query.method : undefined;
  const initialImportType = query.importType === "image" || query.importType === "pdf" || query.importType === "docx" ? query.importType : undefined;

  // If paper already has questions, regular users cannot edit them
  if (paper.questions && paper.questions.length > 0) {
    if (user?.role !== "admin") {
      redirect("/dashboard/my-questions");
    }
    if (!initialMethod) {
      const hasCq = paper.questions.some((q) => q.type === "cq");
      redirect(`/dashboard/papers/${paperId}/import-questions/${hasCq ? "cq" : "mcq"}` as Route);
    }
  }

  return (
    <QuestionCreationWizard
      paper={paper}
      initialMethod={initialMethod}
      initialImportType={initialImportType}
      userPlan={user?.plan || "free"}
      userRole={user?.role || "user"}
    />
  );
}
