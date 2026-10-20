import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border bg-card shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">পৃষ্ঠাটি পাওয়া যায়নি (404)</h1>
          <p className="text-sm text-muted-foreground">
            আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি স্থানান্তরিত বা মুছে ফেলা হয়েছে।
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>হোম পেজে ফিরুন</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-muted transition-all"
          >
            <span>লগইন করুন</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
