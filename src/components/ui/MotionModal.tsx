"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const panelTransition = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1] as const,
};

type MotionModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
};

export function MotionModal({
  open,
  onClose,
  children,
  className,
  overlayClassName,
}: MotionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={
            overlayClassName ??
            "fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={className}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
