"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

type CountUpProps = {
  to: number;
  suffix?: string;
  className?: string;
  locale?: string;
  delay?: number;
};

export function CountUp({
  to,
  suffix = "",
  className,
  locale = "de-DE",
  delay = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, (v) =>
    Math.round(v).toLocaleString(locale)
  );

  useEffect(() => {
    if (!inView) return;
    const timer = window.setTimeout(() => motionVal.set(to), delay * 1000);
    return () => window.clearTimeout(timer);
  }, [inView, motionVal, to, delay]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
