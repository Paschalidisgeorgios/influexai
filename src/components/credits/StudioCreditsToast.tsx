"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export type StudioToastVariant = "success" | "error";

export type StudioCreditsToastProps = {
  message: string;
  variant?: StudioToastVariant;
  onDone: () => void;
  durationMs?: number;
};

export function StudioCreditsToast({
  message,
  variant = "success",
  onDone,
  durationMs = 4200,
}: StudioCreditsToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDone]);

  const isSuccess = variant === "success";

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] left-1/2 z-[320] flex max-w-[min(92vw,380px)] -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-3.5 shadow-2xl md:bottom-6"
      style={
        isSuccess
          ? {
              background: "rgba(5,5,5,0.92)",
              borderColor: "rgba(204,255,0,0.35)",
              boxShadow: "0 0 32px rgba(204,255,0,0.12), 0 16px 40px rgba(0,0,0,0.45)",
            }
          : {
              background: "rgba(5,5,5,0.94)",
              borderColor: "rgba(255,107,122,0.35)",
              boxShadow: "0 0 24px rgba(255,107,122,0.1), 0 16px 40px rgba(0,0,0,0.45)",
            }
      }
    >
      {isSuccess ? (
        <CheckCircle2 size={18} className="shrink-0 text-[#ccff00]" aria-hidden />
      ) : (
        <XCircle size={18} className="shrink-0 text-[#ff6b7a]" aria-hidden />
      )}
      <p
        className="text-sm font-semibold leading-snug"
        style={{ color: isSuccess ? "#f0efe8" : "#ff9aa6" }}
      >
        {message}
      </p>
    </motion.div>
  );
}

export function StudioCreditsToastHost({
  toast,
  onClear,
}: {
  toast: { message: string; variant: StudioToastVariant } | null;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {toast ? (
        <StudioCreditsToast
          key={toast.message}
          message={toast.message}
          variant={toast.variant}
          onDone={onClear}
        />
      ) : null}
    </AnimatePresence>
  );
}
