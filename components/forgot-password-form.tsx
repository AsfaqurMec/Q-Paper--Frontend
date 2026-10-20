"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/lib/api-types";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Sending reset request...");
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const payload = (await response.json()) as ApiResponse<null>;
    setMessage(payload.message || "If an account exists with this email, instructions have been sent.");
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium">
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" type="email" />
      </label>
      <Button className="w-full" type="submit">Send reset link</Button>
      {message && <p className="rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground">{message}</p>}
    </form>
  );
}
