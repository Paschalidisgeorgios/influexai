"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseMouseVelocityOptions = {
  thresholdPxPerFrame?: number;
  sustainMs?: number;
  cooldownMs?: number;
  onWobble?: () => void;
};

export function useMouseVelocity(
  ref: RefObject<HTMLElement | null>,
  {
    thresholdPxPerFrame = 80,
    sustainMs = 1000,
    cooldownMs = 8000,
    onWobble,
  }: UseMouseVelocityOptions
) {
  const lastPos = useRef({ x: 0, y: 0 });
  const wobbleSince = useRef<number | null>(null);
  const lastTrigger = useRef(0);
  const samples = useRef<number[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onWobble) return;

    const onMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - lastPos.current.x);
      const dy = Math.abs(e.clientY - lastPos.current.y);
      lastPos.current = { x: e.clientX, y: e.clientY };
      const delta = dx + dy;
      samples.current.push(delta);
      if (samples.current.length > 60) samples.current.shift();

      const avg =
        samples.current.reduce((a, b) => a + b, 0) /
        Math.max(samples.current.length, 1);

      const now = performance.now();
      if (avg > thresholdPxPerFrame) {
        if (wobbleSince.current === null) wobbleSince.current = now;
        if (
          now - wobbleSince.current >= sustainMs &&
          now - lastTrigger.current >= cooldownMs
        ) {
          lastTrigger.current = now;
          wobbleSince.current = null;
          samples.current = [];
          onWobble();
        }
      } else {
        wobbleSince.current = null;
      }
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [ref, thresholdPxPerFrame, sustainMs, cooldownMs, onWobble]);
}
