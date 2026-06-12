"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type UseScrollVelocityOptions = {
  thresholdPxPerSec?: number;
  sustainMs?: number;
  cooldownMs?: number;
};

export function useScrollVelocity(
  ref: RefObject<HTMLElement | null>,
  {
    thresholdPxPerSec = 280,
    sustainMs = 400,
    cooldownMs = 6000,
  }: UseScrollVelocityOptions = {}
) {
  const [isFast, setIsFast] = useState(false);
  const lastScrollTop = useRef(0);
  const lastTs = useRef(0);
  const fastSince = useRef<number | null>(null);
  const lastTrigger = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const tick = () => {
      const now = performance.now();
      const top = el.scrollTop;
      const dt = now - (lastTs.current || now);
      if (dt >= 100) {
        const delta = Math.abs(top - lastScrollTop.current);
        const velocity = (delta / dt) * 1000;
        lastScrollTop.current = top;
        lastTs.current = now;

        if (velocity > thresholdPxPerSec) {
          if (fastSince.current === null) fastSince.current = now;
          if (
            now - fastSince.current >= sustainMs &&
            now - lastTrigger.current >= cooldownMs
          ) {
            lastTrigger.current = now;
            fastSince.current = null;
            setIsFast(true);
            setTimeout(() => setIsFast(false), 100);
          }
        } else {
          fastSince.current = null;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    lastTs.current = performance.now();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref, thresholdPxPerSec, sustainMs, cooldownMs]);

  return { isFast };
}
