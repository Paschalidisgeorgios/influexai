"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

type SpringRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function SpringReveal({
  children,
  delay = 0,
  className,
}: SpringRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={
        inView
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
            }
          : {}
      }
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 14,
        delay,
        mass: 0.8,
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
