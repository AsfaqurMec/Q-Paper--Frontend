import { redirect } from "next/navigation";
import { QuestionImportView } from "@/components/question-import-view";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export default async function ImportQuestionsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const papers = await api.papers().catch(() => []);

  return <QuestionImportView user={user} existingPapers={papers} />;
}
