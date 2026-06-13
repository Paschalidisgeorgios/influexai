"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type AuthFloatingPreviewProps = {
  children: ReactNode;
  className?: string;
};

export function AuthFloatingPreview({
  children,
  className,
}: AuthFloatingPreviewProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
      transition={{
        duration: 9,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
