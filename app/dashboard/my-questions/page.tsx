import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaperActions } from "@/components/paper-actions";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import {
  getBengaliClass,
  getBengaliSubject,
  getBengaliPaperTitle,
  getBengaliExamType,
  formatBengaliDuration,
  toBengaliDigits
} from "@/lib/curriculum-bengali";

export default async function MyQuestionsPage() {
  const [papers, user] = await Promise.all([
    api.papers(),
    getSessionUser()
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-primary">সংরক্ষিত প্রশ্নপত্র</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">পূর্বের তৈরিকৃত প্রশ্নপত্রসমূহ</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">তৈরিকৃত প্রশ্নপত্র দেখতে, এক্সপোর্ট করতে বা মুছে ফেলতে পারেন।</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/papers/new">
            <FileQuestion className="h-4 w-4" />
            নতুন প্রশ্নপত্র
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{toBengaliDigits(papers.length)} টি সংরক্ষিত প্রশ্নপত্র</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {papers.map((paper) => (
            <div key={paper.id} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border px-2 py-0.5 text-xs font-medium uppercase">{paper.status}</span>
                  <p className="text-xs text-muted-foreground">
                    {getBengaliSubject(paper.subject)} - {getBengaliClass(paper.className)} - {getBengaliExamType(paper.examType)}
                  </p>
                </div>
                <p className="mt-2 text-sm font-semibold">{getBengaliPaperTitle(paper.name, paper.className, paper.subject)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {toBengaliDigits(paper.questions.length)}টি প্রশ্ন - পূর্ণমান: {toBengaliDigits(paper.totalMarks)} - সময়: {formatBengaliDuration(paper.duration)}
                </p>
              </div>
              <PaperActions
                paperId={paper.id}
                paperName={getBengaliPaperTitle(paper.name, paper.className, paper.subject)}
                className={paper.className}
                subject={paper.subject}
                questionType={paper.questions[0]?.type}
                userPlan={user?.plan || "free"}
                userRole={user?.role || "user"}
                activeSet={paper.setName}
              />
            </div>
          ))}
          {!papers.length && <p className="text-sm text-muted-foreground">এখনো কোনো প্রশ্নপত্র তৈরি করা হয়নি। প্রথমে একটি প্রশ্ন তৈরি করুন।</p>}
        </CardContent>
      </Card>
    </div>
  );
}
