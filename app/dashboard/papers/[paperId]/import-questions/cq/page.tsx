import { redirect } from "next/navigation";
import { QuestionEditor } from "@/components/question-editor";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export default async function CqQuestionsPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const [paper, user] = await Promise.all([
    api.paper(paperId),
    getSessionUser()
  ]);

  if (user?.role !== "admin" && paper.questions && paper.questions.length > 0) {
    redirect("/dashboard/my-questions");
  }

  return <QuestionEditor paper={paper} initialType="cq" lockType userRole={user?.role || "user"} userPlan={user?.plan || "free"} />;
}
