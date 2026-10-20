"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  showTextOnMobile = false
}: {
  className?: string;
  showTextOnMobile?: boolean;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      className={cn(
        "gap-1.5 text-xs h-8 sm:h-9 px-2 sm:px-3 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors",
        className
      )}
      title="Log out"
      aria-label="Logout"
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" />
      <span className={showTextOnMobile ? "inline" : "hidden sm:inline"}>Logout</span>
    </Button>
  );
}
