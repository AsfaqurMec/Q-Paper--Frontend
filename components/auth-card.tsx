"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import logo from "../public/logo.png";
import { AuthShowcase } from "./auth-showcase";
import { ThemeToggle } from "./theme-toggle";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="h-screen max-h-screen w-full overflow-hidden bg-background selection:bg-teal-500/20 selection:text-teal-700 dark:selection:text-teal-300">
      <div className="h-full grid lg:grid-cols-12 overflow-hidden">
        {/* LEFT BRAND / SHOWCASE PANEL (Desktop Only: 5 of 12 cols, or 6 cols on xl) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-6 h-full overflow-hidden">
          <AuthShowcase />
        </div>

        {/* RIGHT FORM CONTAINER (Full width on mobile/tablet, remaining cols on desktop) */}
        <div className="h-full flex flex-col justify-between px-4 py-3 sm:px-6 md:px-8 lg:col-span-7 xl:col-span-6 lg:px-8 xl:px-12 overflow-hidden">
          {/* TOP NAV BAR (Back Link + Theme Toggle) */}
          <header className="flex items-center justify-between shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to home</span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* MAIN FORM CARD (Centered Vertically without causing scroll) */}
          <div className="my-auto mx-auto w-full max-w-md py-1 sm:py-2">
            {/* Mobile / Tablet Logo */}
            <div className="mb-3 flex flex-col items-center justify-center lg:hidden">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Image
                  src={logo}
                  alt="Q-Paper logo"
                  className="h-8 sm:h-10 w-auto max-w-[160px] object-contain"
                  priority
                />
              </Link>
              <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
                স্মার্ট প্রশ্নপত্র ও মূল্যায়ন সফটওয়্যার
              </p>
            </div>

            {/* Form Card Box */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-lg shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                  <Sparkles className="h-3 w-3" />
                  <span>Q-Paper</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                <p className="text-xs text-muted-foreground leading-snug">
                  {subtitle}
                </p>
              </div>

              {/* Form Body */}
              <div className="mt-3.5">{children}</div>
            </div>

            {/* Footer Links */}
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {footer}
            </div>
          </div>

          {/* BOTTOM COPYRIGHT & COMPLIANCE FOOTER */}
          <footer className="shrink-0 py-1 text-center text-[10px] sm:text-[11px] text-muted-foreground/70">
            <p>
              © {new Date().getFullYear()} Q-Paper. Built for Educators &amp; Institutes.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
