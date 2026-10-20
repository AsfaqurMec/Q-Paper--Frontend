"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  FileCheck2,
  Layers,
  Sparkles,
  Star,
  Zap
} from "lucide-react";
import logo from "../public/logo.png";

export function AuthShowcase() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 xl:p-8 text-white border-r border-border/20 h-full max-h-screen">
      {/* Background Animated Gradient Mesh & Ambient Glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl animate-glow-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[380px] w-[380px] rounded-full bg-cyan-500/15 blur-3xl animate-glow-pulse" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-2xl animate-glow-pulse" />

      {/* Subtle Dot Matrix Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px"
        }}
      />

      {/* TOP HEADER: BRAND BADGE */}
      <div className="relative z-10 shrink-0">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md shadow-xs transition-colors group-hover:bg-teal-500/20">
            <Sparkles className="h-3 w-3 text-teal-400" />
            <span>স্মার্ট প্রশ্নপত্র ও মূল্যায়ন সফটওয়্যার</span>
          </div>
        </Link>
      </div>

      {/* CENTER: BIG LOGO, TITLE, TAGLINE & STATS */}
      <div className="relative z-10 my-auto py-2 space-y-4 xl:space-y-5 max-w-lg">
        {/* Big Logo with soft glow card */}
        <div className="inline-block rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-xl shadow-teal-950/40">
          <Image
            src={logo}
            alt="Q-Paper Logo"
            className="h-12 sm:h-14 xl:h-16 w-auto max-w-[220px] object-contain drop-shadow-md brightness-105"
            priority
          />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl xl:text-3xl font-black tracking-tight text-white leading-tight">
            Q-Paper
            <span className="block text-xl xl:text-2xl font-extrabold bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent mt-0.5">
              সহজ ও আধুনিক প্রশ্নপত্র তৈরি
            </span>
          </h1>
          <p className="text-xs xl:text-sm text-slate-300/80 leading-relaxed">
            কয়েক মিনিটের মধ্যে পেশাদার মানের সৃজনশীল ও বহুনির্বাচনী প্রশ্নপত্র প্রস্তুত করুন। ৪-সেট অটো শাফল এবং তাৎক্ষণিক প্রিন্ট-রেডি এক্সপোর্ট।
          </p>
        </div>

        {/* 4 Clean Stats Cards */}
        <div className="grid grid-cols-2 gap-2 xl:gap-2.5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs transition-all duration-200 hover:border-teal-500/30 hover:bg-white/8">
            <div className="flex items-center gap-1.5 text-teal-400 mb-0.5">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">স্পিড</span>
            </div>
            <p className="text-lg xl:text-xl font-black text-white">১০x দ্রুত</p>
            <p className="text-[10px] text-slate-400">প্রশ্নপত্র প্রস্তুতকরণ</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs transition-all duration-200 hover:border-teal-500/30 hover:bg-white/8">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">প্রশ্ন ব্যাংক</span>
            </div>
            <p className="text-lg xl:text-xl font-black text-white">৫০,০০০+</p>
            <p className="text-[10px] text-slate-400">পরীক্ষিত প্রশ্ন কালেকশন</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs transition-all duration-200 hover:border-teal-500/30 hover:bg-white/8">
            <div className="flex items-center gap-1.5 text-cyan-400 mb-0.5">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">শাফল</span>
            </div>
            <p className="text-lg xl:text-xl font-black text-white">৪-সেট</p>
            <p className="text-[10px] text-slate-400">স্বয়ংক্রিয় সেট ও OMR কি</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs transition-all duration-200 hover:border-teal-500/30 hover:bg-white/8">
            <div className="flex items-center gap-1.5 text-purple-400 mb-0.5">
              <Award className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">সিলেবাস</span>
            </div>
            <p className="text-lg xl:text-xl font-black text-white">১০০%</p>
            <p className="text-[10px] text-slate-400">NCTB কারিকুলাম সমর্থিত</p>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="space-y-1.5 pt-0.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span>সৃজনশীল (CQ) ও বহুনির্বাচনী (MCQ) প্রশ্ন সম্পূর্ণ প্রস্তুত</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span>১-ক্লিকে Word (DOCX) ও PDF ফরমেটে প্রিন্ট উপযোগী এক্সপোর্ট</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span>বাংলা ও ইংরেজি উভয় মাধ্যমে সমীকরণ এবং ডায়াগ্রাম সাপোর্ট</span>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER: RATING & SOCIAL PROOF */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </div>
          <span className="font-semibold text-slate-200">৫.০ / ৫.০ রেটিং</span>
        </div>
        <span>৫০০+ শিক্ষক ও শিক্ষা প্রতিষ্ঠানের আস্থা</span>
      </div>
    </div>
  );
}
