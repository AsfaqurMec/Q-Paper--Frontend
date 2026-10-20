import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperActions } from "@/components/paper-actions";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export default async function MyQuestionsPage() {
  const [papers, user] = await Promise.all([
    api.papers(),
    getSessionUser()
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-primary">My Questions</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">Previously created papers</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Open a saved paper to review, export, or delete it. Created questions are automatically deleted after 45 days.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/papers/new">
            <FileQuestion className="h-4 w-4" />
            Create Paper
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{papers.length} saved paper{papers.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {papers.map((paper) => (
            <div key={paper.id} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border px-2 py-0.5 text-xs font-medium uppercase">{paper.status}</span>
                  <p className="text-xs text-muted-foreground">
                    {paper.subject} - {paper.className} - {paper.examType}
                  </p>
                </div>
                <p className="mt-2 text-sm font-medium">{paper.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paper.questions.length} question{paper.questions.length === 1 ? "" : "s"} - {paper.totalMarks} marks - {paper.duration}
                </p>
              </div>
              <PaperActions
                paperId={paper.id}
                paperName={paper.name}
                questionType={paper.questions[0]?.type}
                userPlan={user?.plan || "free"}
                userRole={user?.role || "user"}
              />
            </div>
          ))}
          {!papers.length && <p className="text-sm text-muted-foreground">No saved papers yet. Create a paper first.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
