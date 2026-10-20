"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FilePlus2,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  ListChecks,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";
import type { UserSession } from "@/lib/api-types";
import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "../public/logo.png";
import logosmall from "../public/logo-small.png";

const nav: Array<{ href: Route; label: string; icon: typeof LayoutDashboard; badge?: string }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/papers/new", label: "Create Paper", icon: FilePlus2 },
  { href: "/dashboard/import-questions", label: "Import Question", icon: Sparkles, badge: "ULTRA" },
  { href: "/dashboard/my-questions", label: "My Questions", icon: ListChecks },
  { href: "/dashboard/question-bank", label: "Question Bank", icon: BookOpenCheck },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/share", label: "Share Links", icon: Link2 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/support", label: "Support", icon: MessageSquareText },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/curriculum", label: "Curriculum", icon: BookOpenCheck }
];

export function AppShell({ children, user }: { children: React.ReactNode; user: UserSession }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Sync dark theme on mount
  useEffect(() => {
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  function toggleDarkMode() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Handle ESC key for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const visibleNav = nav.filter((item) => !item.href.startsWith("/admin") || user.role === "admin");

  return (
    <div className="min-h-screen bg-background">
      {/* ======================================================== */}
      {/* MOBILE DRAWER BACKDROP & DRAWER ASIDE                     */}
      {/* ======================================================== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-navigation-drawer"
        aria-label="Mobile Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 sm:w-80 max-w-[85vw] border-r bg-card/98 shadow-2xl backdrop-blur transition-transform duration-300 ease-in-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
            <Image src={logo} alt="Q-Paper logo" className="h-7 w-auto object-contain" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close drawer"
            onClick={() => setDrawerOpen(false)}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-2xs",
                    active && "ring-1 ring-white/50"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer / User Information & Support */}
        <div className="border-t p-3 space-y-2.5 bg-muted/20">
          <Link
            href="/dashboard/profile"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2.5 rounded-lg border bg-card p-2 text-xs transition hover:border-primary/50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground leading-tight">{user.name ?? user.email}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground capitalize mt-0.5">
                <span>{user.role}</span>
                <span>·</span>
                <span className="font-semibold text-primary">{user.plan.toUpperCase()}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              href="/dashboard/support"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
            >
              <LifeBuoy className="h-3.5 w-3.5 text-primary" />
              <span>সহায়তা ডেস্ক</span>
            </Link>
            <LogoutButton showTextOnMobile />
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (lg:block)                                */}
      {/* ======================================================== */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-card/95 px-3 py-5 backdrop-blur transition-all duration-300 lg:flex lg:flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="w-full flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <Link href="/dashboard" className={cn("flex items-center gap-3 px-2", collapsed && "justify-center w-full")}>
            {collapsed ? (
              <Image src={logosmall} alt="Q-Paper logo" className="h-8 w-8 object-contain" />
            ) : (
              <Image src={logo} alt="Q-Paper logo" className="h-8 w-auto object-contain" priority />
            )}
          </Link>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0",
                  active && "bg-accent text-accent-foreground font-semibold"
                )}
                title={collapsed ? (item.badge ? `${item.label} (${item.badge})` : item.label) : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn(collapsed && "hidden", "truncate")}>{item.label}</span>
                {item.badge && !collapsed && (
                  <span className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={cn("mt-auto rounded-lg border bg-background p-3.5 shadow-2xs", collapsed && "hidden")}>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <LifeBuoy className="h-4 w-4 text-primary shrink-0" />
            <span>Priority Support</span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground leading-normal">
            ৭২,২২৬+ প্রশ্ন ব্যাংক ও ওএমআর ৪-সেট প্রশ্ন সহায়তা প্রস্তুত।
          </p>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN WRAPPER & RESPONSIVE HEADER                          */}
      {/* ======================================================== */}
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-3 border-b bg-background/95 px-2.5 sm:px-4 md:px-6 backdrop-blur">
          {/* Left section: Hamburger Button + Mobile Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu drawer"
              onClick={() => setDrawerOpen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center gap-1.5 lg:hidden" title="ExamCraft Dashboard">
              <Image src={logosmall} alt="Logo" className="h-7 w-7 object-contain" />
            </Link>
          </div>

          {/* Center section: Search Bar */}
          <div className="relative flex flex-1 max-w-xs sm:max-w-md items-center min-w-0">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search papers, questions..."
              aria-label="Search"
              className="h-8 sm:h-9 w-full rounded-md border bg-card/80 pl-8 pr-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-card transition"
            />
          </div>

          {/* Right section: Theme, Plan, Profile, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Link
              href="/dashboard/subscription"
              className="hidden xs:inline-flex items-center gap-1 rounded-md bg-secondary px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition"
              title="Current Package"
            >
              <BarChart3 className="h-3 w-3 hidden sm:inline" />
              <span>{user.plan.toUpperCase()}</span>
            </Link>

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-1.5 rounded-lg border border-transparent p-0.5 sm:px-2 sm:py-1 text-xs transition-colors hover:border-border hover:bg-muted/50"
              title="View & Edit Profile"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20 shrink-0">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left md:block min-w-0">
                <p className="font-semibold text-foreground leading-tight truncate max-w-[110px]">
                  {user.name ?? user.email}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight">{user.role}</p>
              </div>
            </Link>

            <LogoutButton />
          </div>
        </header>

        {/* Main Content with Optimized Horizontal Padding */}
        <main className="px-2.5 sm:px-4 md:px-6 py-4 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
