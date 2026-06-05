"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function RevealUp({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function RevealLeft({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -32 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function RevealScale({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
