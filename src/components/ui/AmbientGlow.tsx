"use client";

import { useEffect, useRef } from "react";

/** Fixed ambient acid glow with scroll parallax */
export function AmbientGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const y = window.scrollY * 0.3;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="ambient-glow pointer-events-none fixed inset-0 z-0"
      style={{ willChange: "transform" }}
    />
  );
}
