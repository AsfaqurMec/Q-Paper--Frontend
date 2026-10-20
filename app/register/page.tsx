import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Join hundreds of educators. Start on the Free plan with instant question generation and print-ready paper exports."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-teal-600 dark:text-teal-400 hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-64 rounded-xl bg-muted/40 animate-pulse" />}>
        <AuthForm mode="register" />
      </Suspense>
    </AuthCard>
  );
}
