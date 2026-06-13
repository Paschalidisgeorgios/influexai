"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollVelocity(threshold = 15, cooldownMs = 6000) {
  const [velocity, setVelocity] = useState(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const cooldownRef = useRef(0);
  const velocityRef = useRef(0);

  const onScroll = useCallback(
    (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const scrollTop =
        target instanceof Document
          ? window.scrollY
          : (target as HTMLElement).scrollTop;
      const now = Date.now();
      const elapsed = Math.max(now - lastTimeRef.current, 16);
      const v = Math.abs(scrollTop - lastYRef.current) / elapsed;
      lastYRef.current = scrollTop;
      lastTimeRef.current = now;
      velocityRef.current = v;

      if (v > threshold) {
        setVelocity(v);
      }
    },
    [threshold]
  );

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    const scrollEls = document.querySelectorAll(".dashboard-v2-scroll");
    scrollEls.forEach((el) => {
      el.addEventListener("scroll", onScroll, { passive: true });
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      scrollEls.forEach((el) => {
        el.removeEventListener("scroll", onScroll);
      });
    };
  }, [onScroll]);

  const shouldTrigger =
    velocity > threshold && Date.now() - cooldownRef.current > cooldownMs;

  const markTriggered = useCallback(() => {
    cooldownRef.current = Date.now();
  }, []);

  return { velocity, shouldTrigger, markTriggered };
}
