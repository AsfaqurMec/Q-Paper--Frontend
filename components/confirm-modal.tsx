"use client";

import { AlertTriangle, Trash2, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "নিশ্চিতকরণ",
  message,
  confirmText = "নিশ্চিত করুন",
  cancelText = "বাতিল",
  variant = "danger",
  loading = false
}: ConfirmModalProps) {
  const Icon = variant === "danger" ? Trash2 : AlertTriangle;
  const iconBg =
    variant === "danger"
      ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
      : variant === "warning"
      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
      : "bg-primary/10 text-primary dark:bg-primary/20";

  const confirmBtnClass =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
      : variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20";

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
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1 whitespace-pre-line">
                {message}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="mt-4 sm:mt-5 flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto font-medium rounded-xl h-10"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={loading}
            className={`w-full sm:w-auto font-semibold px-5 rounded-xl h-10 shadow-xs ${confirmBtnClass}`}
          >
            {loading ? "অপেক্ষা করুন..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
