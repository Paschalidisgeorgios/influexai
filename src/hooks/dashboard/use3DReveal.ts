"use client";

import { useEffect, useRef, useState } from "react";

export function use3DReveal(target = 1, delayMs = 400) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const currentRef = useRef(0);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      const tick = () => {
        currentRef.current += (targetRef.current - currentRef.current) * 0.028;
        if (Math.abs(targetRef.current - currentRef.current) < 0.002) {
          currentRef.current = targetRef.current;
        }
        setProgress(currentRef.current);
        if (currentRef.current !== targetRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(startTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [delayMs]);

  const impulse = (amount: number, durationMs = 300) => {
    const base = currentRef.current;
    currentRef.current = Math.min(1, base + amount / 100);
    setProgress(currentRef.current);
    setTimeout(() => {
      currentRef.current = base;
      setProgress(base);
    }, durationMs);
  };

  return { progress, impulse };
}
