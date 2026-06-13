"use client";

import { useRef, useCallback, useEffect, type RefObject } from "react";

interface Options {
  threshold?: number;
  cooldownMs?: number;
  onFast: () => void;
}

export function useScrollVelocity(
  ref: RefObject<HTMLElement | null>,
  options: Options
) {
  const { threshold = 280, cooldownMs = 6000, onFast } = options;
  const lastYRef = useRef(0);
  const lastTRef = useRef(Date.now());
  const cooldownRef = useRef(0);
  const onFastRef = useRef(onFast);

  useEffect(() => {
    onFastRef.current = onFast;
  }, [onFast]);

  const onScroll = useCallback(() => {
    const now = Date.now();
    const el = ref.current;
    const y = el ? el.scrollTop : window.scrollY;
    const elapsed = Math.max(now - lastTRef.current, 16);
    const v = (Math.abs(y - lastYRef.current) / elapsed) * 1000;
    lastYRef.current = y;
    lastTRef.current = now;
    if (v > threshold && now - cooldownRef.current > cooldownMs) {
      cooldownRef.current = now;
      onFastRef.current();
    }
  }, [threshold, cooldownMs, ref]);

  useEffect(() => {
    const el = ref.current;
    const targets: (HTMLElement | Window)[] = el ? [el] : [window];
    targets.forEach((target) => {
      target.addEventListener("scroll", onScroll as EventListener, { passive: true });
    });
    return () => {
      targets.forEach((target) => {
        target.removeEventListener("scroll", onScroll as EventListener);
      });
    };
  }, [onScroll, ref]);

  return { onScroll };
}
