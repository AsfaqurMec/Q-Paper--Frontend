import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Layers,
  LifeBuoy,
  Printer,
  Share2,
  Wand2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardQuickGenerator } from "@/components/dashboard-quick-generator";
import { PaperActions } from "@/components/paper-actions";
import { api } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

const FEATURED_SUBJECTS = [
  { name: "উচ্চতর গণিত ১ম পত্র", className: "HSC", chapters: 10, total: "3,800+", color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20" },
  { name: "পদার্থবিজ্ঞান ১ম পত্র", className: "HSC", chapters: 10, total: "3,800+", color: "from-teal-500/10 to-emerald-500/10 border-teal-500/20" },
  { name: "রসায়ন ১ম পত্র", className: "HSC", chapters: 5, total: "3,800+", color: "from-purple-500/10 to-pink-500/10 border-purple-500/20" },
  { name: "উচ্চতর গণিত ২য় পত্র", className: "HSC", chapters: 10, total: "3,800+", color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20" },
  { name: "পদার্থবিজ্ঞান ২য় পত্র", className: "HSC", chapters: 11, total: "3,800+", color: "from-emerald-500/10 to-green-500/10 border-emerald-500/20" },
  { name: "রসায়ন ২য় পত্র", className: "HSC", chapters: 5, total: "3,800+", color: "from-rose-500/10 to-orange-500/10 border-rose-500/20" },
  { name: "তথ্য ও যোগাযোগ প্রযুক্তি", className: "HSC", chapters: 6, total: "3,800+", color: "from-amber-500/10 to-yellow-500/10 border-amber-500/20" },
  { name: "সাধারণ গণিত", className: "SSC", chapters: 17, total: "3,800+", color: "from-sky-500/10 to-blue-500/10 border-sky-500/20" }
];

export default async function DashboardPage() {
  const [dashboard, papers, sharedLinks, user] = await Promise.all([
    api.dashboard(),
    api.papers(),
    api.sharedLinks().catch(() => []),
    getSessionUser()
  ]);

  const totalPapers = papers.length;
  const totalQuestionsInBank = 72226;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-primary border-primary/30 font-bold">
              শিক্ষক ড্যাশবোর্ড
            </Badge>
            <Badge className={
              dashboard.stats.currentPlan === "Ultra"
                ? "bg-purple-600 text-white font-semibold text-xs"
                : dashboard.stats.currentPlan === "Pro"
                ? "bg-blue-600 text-white font-semibold text-xs"
                : "bg-slate-700 text-white font-semibold text-xs"
            }>
              প্যাকেজ: {dashboard.stats.currentPlan}
            </Badge>
            {dashboard.stats.currentPlan === "Free" && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                ({totalPapers}/২টি প্রশ্নপত্র তৈরি)
              </span>
            )}
            <span className="text-xs text-muted-foreground font-medium">Q-Paper Exam Suite</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            পরীক্ষা ও প্রশ্নপত্র কমান্ড সেন্টার
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/dashboard/question-bank">
              <BookOpen className="h-4 w-4 text-primary" />
              প্রশ্ন ব্যাংক
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/dashboard/share">
              <Share2 className="h-4 w-4 text-primary" />
              শেয়ার লিংক
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
            <Link href="/dashboard/papers/new">
              <FilePlus2 className="h-4 w-4" />
              নতুন প্রশ্নপত্র
            </Link>
          </Button>
        </div>
      </div>

      {/* Practical Quick Metric Stats */}
      <div className="grid gap-2.5 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">মোট তৈরি প্রশ্নপত্র</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalPapers}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">প্রশ্ন ব্যাংকে প্রশ্ন</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalQuestionsInBank.toLocaleString()} টি</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">৪-সেট ওএমআর</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">ক, খ, গ, ঘ</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">সক্রিয় শেয়ার লিংক</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{sharedLinks.length} টি</p>
          </div>
        </Card>
      </div>

      {/* Instant 1-Click Paper Generator Widget */}
      <DashboardQuickGenerator />

      {/* Main Two-Column Layout: Recent Papers & Subject Explorer */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left: Real Previous Papers List with Direct Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                পূর্ববর্তী প্রশ্নপত্রসমূহ ({papers.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                আপনার তৈরি প্রশ্নপত্র সরাসরি প্রিন্ট, ডাউনলোড ও শেয়ার করুন
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/dashboard/papers/new">
                <FilePlus2 className="h-3.5 w-3.5 mr-1" /> নতুন প্রশ্নপত্র
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/papers/${paper.id}/questions`}
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate"
                    >
                      {paper.name}
                    </Link>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                      {paper.className}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground flex-wrap">
                    <span className="text-foreground font-medium">{paper.subject}</span>
                    <span>·</span>
                    <span>{paper.questions?.length || 0} টি প্রশ্ন</span>
                    <span>·</span>
                    <span>পূর্ণমান: {paper.totalMarks || 100}</span>
                    <span>·</span>
                    <span>সময়: {paper.duration || "১ ঘণ্টা"}</span>
                  </div>
                </div>

                {/* Direct Actions */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                  {user?.role === "admin" && (
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium">
                      <Link href={`/dashboard/papers/${paper.id}/questions`}>
                        সম্পাদনা
                      </Link>
                    </Button>
                  )}
                  <PaperActions
                    paperId={paper.id}
                    paperName={paper.name}
                    questionType={paper.questions?.[0]?.type}
                    userPlan={user?.plan || "free"}
                    userRole={user?.role || "user"}
                    activeSet={paper.setName}
                  />
                </div>
              </div>
            ))}

            {!papers.length && (
              <div className="p-10 text-center space-y-3">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-semibold text-foreground">এখনও কোনো প্রশ্নপত্র তৈরি করেননি</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    উপরের স্বয়ংক্রিয় জেনারেটর বা নতুন প্রশ্নপত্র বাটন দিয়ে ১ম প্রশ্ন তৈরি করুন।
                  </p>
                </div>
                <Button asChild size="sm" className="text-xs">
                  <Link href="/dashboard/papers/new">প্রশ্নপত্র তৈরি শুরু করুন</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Subject Bank Quick Cards & Helpful Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> বিষয়ভিত্তিক প্রশ্ন ব্যাংক
                </span>
                <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-primary">
                  <Link href="/dashboard/question-bank">সকল বিষয় →</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
              {FEATURED_SUBJECTS.map((sub, idx) => (
                <Link
                  key={idx}
                  href={`/dashboard/question-bank?category=${encodeURIComponent(sub.name)}`}
                  className={`block rounded-lg border p-2.5 transition-all hover:shadow-2xs bg-gradient-to-r ${sub.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{sub.name}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                      {sub.className}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                    <span>{sub.chapters} টি অধ্যায়</span>
                    <span className="font-semibold text-primary">{sub.total} প্রশ্ন</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-primary" /> সহায়তা ও সাহায্য কেন্দ্র
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>প্রশ্নপত্রে সমীকরণ বা ম্যাট্রিক্স সংক্রান্ত যেকোনো সহায়তার জন্য সাপোর্ট টিকিট খুলুন।</p>
              <Button asChild variant="outline" size="sm" className="w-full text-xs mt-2">
                <Link href="/dashboard/support">সাপোর্ট ডেস্ক খুলুন</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
