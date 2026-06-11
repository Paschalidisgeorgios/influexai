"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";

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
  const [shouldPulse, setShouldPulse] = useState(false);
  const prevRef = useRef<number | null>(null);
  const isLow = value !== null && value < 10;

  useLayoutEffect(() => {
    const prev = prevRef.current;
    setShouldPulse(prev !== null && value !== null && prev !== value);
    prevRef.current = value;
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
