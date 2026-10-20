import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant = "primary", size = "md", asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" && "bg-muted text-foreground hover:bg-muted/80",
        variant === "ghost" && "hover:bg-muted",
        variant === "outline" && "border bg-background hover:bg-muted",
        variant === "destructive" && "bg-destructive text-white hover:bg-destructive/90",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4",
        size === "lg" && "h-11 px-6 text-base",
        size === "icon" && "h-10 w-10",
        className
      )}
      {...props}
    />
  );
}
