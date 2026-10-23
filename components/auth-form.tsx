"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  User,
  UserPlus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import type { ApiResponse, UserSession } from "@/lib/api-types";

const password = z
  .string()
  .min(8)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password
});

type AuthMode = "login" | "register";
type AuthValues = {
  name?: string;
  email: string;
  password: string;
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const schema = mode === "login" ? loginSchema : registerSchema;
  const { register, handleSubmit, formState } = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: mode === "login" ? { email: "", password: "" } : { name: "", email: "", password: "" }
  });

  async function submit(values: AuthValues) {
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as ApiResponse<UserSession>;
      if (!response.ok || !payload.success) {
        setError(payload.message || "Authentication failed. Please verify your credentials.");
        return;
      }
      const nextTarget = searchParams.get("next") || (searchParams.get("from") === "landing" ? "/dashboard/subscription" : null) || "/dashboard";
      router.push(nextTarget as Route);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Network connection issue. Please check your internet connection.");
    }
  }

  return (
    <form className="space-y-2.5 sm:space-y-3" onSubmit={handleSubmit(submit)}>
      {/* ERROR MESSAGE ALERT */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive animate-in fade-in-50 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* NAME FIELD (REGISTER MODE ONLY) */}
      {mode === "register" && (
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Full Name (আপনার নাম) *
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Professor Ayesha Rahman"
              className="h-9 sm:h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...register("name")}
            />
          </div>
          {formState.errors.name && (
            <p className="text-[11px] text-destructive">{formState.errors.name.message}</p>
          )}
        </div>
      )}

      {/* EMAIL FIELD */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address (ইমেইল ঠিকানা) *
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="email"
            autoComplete="email"
            placeholder="teacher@school.edu.bd"
            className="h-9 sm:h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            {...register("email")}
          />
        </div>
        {formState.errors.email && (
          <p className="text-[11px] text-destructive">{formState.errors.email.message}</p>
        )}
      </div>

      {/* PASSWORD FIELD */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Password (পাসওয়ার্ড) *
          </label>
          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="h-9 sm:h-10 w-full rounded-lg border bg-background pl-9 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        {formState.errors.password && (
          <p className="text-[11px] text-destructive">{formState.errors.password.message}</p>
        )}
        {mode === "register" && (
          <p className="text-[10px] text-muted-foreground">
            Must contain 8+ characters with uppercase, lowercase, number, and special character.
          </p>
        )}
      </div>

      {/* REMEMBER ME CHECKBOX (LOGIN MODE ONLY) */}
      {mode === "login" && (
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-teal-600 focus:ring-teal-500/30"
            />
            <span>Remember this device</span>
          </label>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <Button
        className="w-full h-9 sm:h-10 text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all duration-200 rounded-lg"
        type="submit"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-white mr-2" />
            <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
          </>
        ) : mode === "login" ? (
          <>
            <LogIn className="h-4 w-4 mr-2" />
            <span>Sign In</span>
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            <span>Create Free Account</span>
          </>
        )}
      </Button>

      {/* SECURITY TRUST BADGES */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground/80 border-t border-border/60">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />
          <span>256-bit SSL encrypted</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Secure authentication</span>
        </span>
      </div>
    </form>
  );
}
