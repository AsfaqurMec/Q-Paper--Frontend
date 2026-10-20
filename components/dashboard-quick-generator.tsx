"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Calculator, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientApi } from "@/lib/client-api";

const SUBJECT_OPTIONS = [
  { name: "উচ্চতর গণিত ১ম পত্র", className: "HSC (Class 11-12)", chapters: 10 },
  { name: "উচ্চতর গণিত ২য় পত্র", className: "HSC (Class 11-12)", chapters: 10 },
  { name: "পদার্থবিজ্ঞান ১ম পত্র", className: "HSC (Class 11-12)", chapters: 10 },
  { name: "পদার্থবিজ্ঞান ২য় পত্র", className: "HSC (Class 11-12)", chapters: 11 },
  { name: "রসায়ন ১ম পত্র", className: "HSC (Class 11-12)", chapters: 5 },
  { name: "রসায়ন ২য় পত্র", className: "HSC (Class 11-12)", chapters: 5 },
  { name: "জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)", className: "HSC (Class 11-12)", chapters: 12 },
  { name: "জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)", className: "HSC (Class 11-12)", chapters: 12 },
  { name: "তথ্য ও যোগাযোগ প্রযুক্তি", className: "HSC (Class 11-12)", chapters: 6 },
  { name: "বাংলা ১ম পত্র", className: "HSC (Class 11-12)", chapters: 20 },
  { name: "সাধারণ গণিত", className: "SSC (Class 9-10)", chapters: 17 },
  { name: "উচ্চতর গণিত", className: "SSC (Class 9-10)", chapters: 14 },
  { name: "পদার্থবিজ্ঞান", className: "SSC (Class 9-10)", chapters: 14 },
  { name: "রসায়ন", className: "SSC (Class 9-10)", chapters: 12 }
];

export function DashboardQuickGenerator() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState(SUBJECT_OPTIONS[0].name);
  const [count, setCount] = useState("25");
  const [natureRatio, setNatureRatio] = useState("balanced"); // balanced, math, theory
  const [examType, setExamType] = useState("মডেল টেস্ট");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectMeta = SUBJECT_OPTIONS.find((s) => s.name === selectedSubject) || SUBJECT_OPTIONS[0];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const totalCount = parseInt(count, 10) || 25;
      let theoryRatio = 0.5;
      if (natureRatio === "math") theoryRatio = 0.2;
      if (natureRatio === "theory") theoryRatio = 0.8;

      const paperName = `${selectedSubject} - ${examType} ২০২৬`;

      const created = await clientApi.generatePaper({
        name: paperName,
        className: subjectMeta.className,
        subject: selectedSubject,
        chapter: "all",
        mcqCount: totalCount,
        cqCount: 0,
        theoryRatio,
        duration: `${totalCount} মিনিট`,
        examType,
        layout: "split",
        instructions: "সকল প্রশ্নের মান সমান। প্রতিটি প্রশ্নের জন্য সঠিক উত্তরটিতে টিক দিন।"
      });

      // Redirect directly to the generated paper's question editor / preview
      router.push(`/dashboard/papers/${created.id}/questions/mcq`);
    } catch (err: any) {
      setError(err?.message || "প্রশ্ন তৈরি করতে ব্যর্থ হয়েছে");
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/10 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                ১-ক্লিকে তাৎক্ষণিক প্রশ্নপত্র তৈরি
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                ৭২,২২৬টি যাচাইকৃত প্রশ্ন থেকে বিষয় ও অনুপাত নির্বাচন করে স্বয়ংক্রিয় প্রশ্নপত্র তৈরি করুন
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
            স্বয়ংক্রিয় জেনারেটর
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">বিষয় নির্বাচন করুন</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {SUBJECT_OPTIONS.map((s) => (
                    <SelectItem key={s.name} value={s.name} className="text-xs">
                      {s.name} ({s.className.split(" ")[0]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">প্রশ্ন সংখ্যা</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15" className="text-xs">১৫ টি প্রশ্ন (ক্লাস টেস্ট)</SelectItem>
                  <SelectItem value="20" className="text-xs">২০ টি প্রশ্ন</SelectItem>
                  <SelectItem value="25" className="text-xs">২৫ টি প্রশ্ন (স্ট্যান্ডার্ড)</SelectItem>
                  <SelectItem value="30" className="text-xs">৩০ টি প্রশ্ন (মডেল টেস্ট)</SelectItem>
                  <SelectItem value="50" className="text-xs">৫০ টি প্রশ্ন (পূর্ণাঙ্গ)</SelectItem>
                  <SelectItem value="100" className="text-xs">১০০ টি প্রশ্ন (মেগা টেস্ট)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">প্রশ্নের ধরন ও অনুপাত</Label>
              <Select value={natureRatio} onValueChange={setNatureRatio}>
                <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced" className="text-xs">৫০% গাণিতিক + ৫০% তত্ত্বীয়</SelectItem>
                  <SelectItem value="math" className="text-xs">৮০% গাণিতিক ভিত্তিক (Math Heavy)</SelectItem>
                  <SelectItem value="theory" className="text-xs">৮০% তত্ত্বীয় ভিত্তিক (Theory Heavy)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">পরীক্ষার ধরন</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="text-xs h-9 bg-white dark:bg-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="মডেল টেস্ট" className="text-xs">মডেল টেস্ট</SelectItem>
                  <SelectItem value="অধ্যায়ভিত্তিক পরীক্ষা" className="text-xs">অধ্যায়ভিত্তিক পরীক্ষা</SelectItem>
                  <SelectItem value="প্রাক-নির্বাচনী পরীক্ষা" className="text-xs">প্রাক-নির্বাচনী পরীক্ষা</SelectItem>
                  <SelectItem value="নির্বাচনী পরীক্ষা" className="text-xs">নির্বাচনী পরীক্ষা</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center justify-between gap-3 flex-wrap">
              <span>{error}</span>
              {(error.toLowerCase().includes("limit") ||
                error.toLowerCase().includes("package") ||
                error.toLowerCase().includes("ultra") ||
                error.toLowerCase().includes("device") ||
                error.toLowerCase().includes("সীমা") ||
                error.toLowerCase().includes("প্যাকেজ")) && (
                <Button asChild size="sm" variant="outline" className="h-6 text-[11px] border-destructive/40 hover:bg-destructive/20 shrink-0">
                  <Link href="/dashboard/subscription">প্যাকেজ দেখুন ও আপগ্রেড করুন</Link>
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="text-[11px] text-muted-foreground">
              নির্বাচিত: <span className="font-semibold text-foreground">{selectedSubject}</span> · {count} টি MCQ প্রশ্ন · {subjectMeta.chapters} টি অধ্যায় থেকে সুষম বণ্টন
            </div>
            <Button type="submit" size="sm" className="gap-2 text-xs font-semibold px-4 self-end sm:self-auto w-full sm:w-auto" disabled={loading}>
              <Wand2 className="h-3.5 w-3.5" />
              {loading ? "প্রশ্নপত্র তৈরি হচ্ছে..." : "প্রশ্নপত্র তৈরি করুন"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
