"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { MouseEventHandler, ReactNode } from "react";

type KineticButtonProps = {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Primary acid CTA — enables shockwave on tap */
  primary?: boolean;
};

const spring = { type: "spring" as const, stiffness: 400, damping: 17 };

export function KineticButton({
  children,
  onClick,
  className,
  type = "button",
  disabled,
  primary = false,
}: KineticButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={reduceMotion ? undefined : { scale: 1.03 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={spring}
      animate={
        primary && !reduceMotion
          ? {
              boxShadow: [
                "0 0 0 0 rgba(180,255,0,0)",
                "0 0 0 12px rgba(180,255,0,0.3)",
                "0 0 0 24px rgba(180,255,0,0)",
              ],
            }
          : undefined
      }
      // Re-trigger shockwave on each click via key reset handled by parent if needed
    >
      {children}
    </motion.button>
  );
}
