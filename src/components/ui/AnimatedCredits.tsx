"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type AnimatedCreditsProps = {
  value: number | null;
  className?: string;
  style?: React.CSSProperties;
};

export function AnimatedCredits({
  value,
  className,
  style,
}: AnimatedCreditsProps) {
  const prev = useRef<number | null>(value);
  const shouldPulse = prev.current !== null && value !== null && prev.current !== value;
  const isLow = value !== null && value < 10;

  useEffect(() => {
    prev.current = value;
  }, [value]);

  return (
    <motion.span
      className={className}
      style={style}
      animate={
        shouldPulse
          ? {
              scale: [1, 1.2, 1],
              color: isLow
                ? ["#B4FF00", "#ff4444", isLow ? "#ff6b7a" : "#B4FF00"]
                : ["#B4FF00", "#d4ff66", "#B4FF00"],
            }
          : { scale: 1 }
      }
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {value ?? "..."}
    </motion.span>
  );
}
