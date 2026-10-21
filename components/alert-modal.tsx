"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type AlertModalType = "error" | "success" | "warning" | "info";

export interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertModalType;
  confirmText?: string;
}

export function AlertModal({
  open,
  onClose,
  title,
  message,
  type = "error",
  confirmText = "ঠিক আছে"
}: AlertModalProps) {
  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "warning"
      ? AlertTriangle
      : type === "info"
      ? Info
      : AlertCircle;

  const iconBg =
    type === "success"
      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
      : type === "warning"
      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
      : type === "info"
      ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
      : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400";

  const defaultTitle =
    title ||
    (type === "success"
      ? "সফল হয়েছে"
      : type === "warning"
      ? "সতর্কতা"
      : type === "info"
      ? "বিজ্ঞপ্তি"
      : "ত্রুটি বা সমস্যা");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-5 sm:p-6 font-sans rounded-2xl">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                {defaultTitle}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 whitespace-pre-line">
                {message}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="mt-4 sm:mt-5 sm:justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto font-semibold px-6 rounded-xl h-10 shadow-xs"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
