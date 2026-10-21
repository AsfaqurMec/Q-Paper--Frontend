"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AlertModal, AlertModalType } from "./alert-modal";
import { ConfirmModal } from "./confirm-modal";

export interface AlertOptions {
  message: string;
  title?: string;
  type?: AlertModalType;
  confirmText?: string;
}

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void | Promise<void>;
}

interface ModalContextValue {
  showAlert: (options: AlertOptions | string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useAppModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useAppModal must be used within a ModalProvider");
  }
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  // Alert modal state
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    title?: string;
    type?: AlertModalType;
    confirmText?: string;
  }>({
    open: false,
    message: ""
  });

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    message: "",
    onConfirm: () => {}
  });

  const showAlert = useCallback((options: AlertOptions | string) => {
    if (typeof options === "string") {
      setAlertState({
        open: true,
        message: options,
        title: "বিজ্ঞপ্তি",
        type: "info"
      });
    } else {
      setAlertState({
        open: true,
        message: options.message,
        title: options.title,
        type: options.type || "info",
        confirmText: options.confirmText
      });
    }
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState({
      open: true,
      message: options.message,
      title: options.title,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      variant: options.variant || "danger",
      onConfirm: options.onConfirm
    });
  }, []);

  // Intercept window.alert so that ANY alert(...) call in the entire app shows our modal
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      showAlert({
        title: "বিজ্ঞপ্তি",
        message: typeof message === "string" ? message : JSON.stringify(message),
        type: "info"
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertModal
        open={alertState.open}
        onClose={() => setAlertState((prev) => ({ ...prev, open: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
      />
      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </ModalContext.Provider>
  );
}
