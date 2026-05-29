"use client";

import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Confirmation error:", err);
    } finally {
      setIsConfirming(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all",
          "animate-in zoom-in-95 fade-in duration-300"
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "mb-4 flex h-12 w-12 items-center justify-center rounded-full",
              variant === "destructive"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            <AlertCircle className="size-6" />
          </div>

          <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
          <p className="mb-6 text-sm text-muted-foreground">{description}</p>

          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="flex-1 rounded-xl border border-border bg-surface-container py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-container-high disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50",
                variant === "destructive"
                  ? "bg-destructive shadow-md shadow-destructive/20 hover:bg-destructive/90"
                  : "bg-primary shadow-md shadow-primary/20 hover:bg-primary/90"
              )}
            >
              {isConfirming ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
