import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";

import type { Route } from "next";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const next = resolvedParams?.next;
  const registerHref = (next ? `/register?next=${encodeURIComponent(next)}` : "/register") as Route;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your Q-Paper account to manage questions, generate papers, and export OMR keys."
      footer={
        <p>
          Don&apos;t have an account yet?{" "}
          <Link
            href={registerHref}
            className="font-semibold text-teal-600 dark:text-teal-400 hover:underline transition-colors"
          >
            Create free account
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-64 rounded-xl bg-muted/40 animate-pulse" />}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthCard>
  );
}
