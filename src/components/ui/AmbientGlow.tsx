"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Fixed ambient acid glow with scroll parallax (disabled on landing — uses LightSystem). */
export function AmbientGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") return;

    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const y = window.scrollY * 0.3;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname === "/") return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="ambient-glow pointer-events-none fixed inset-0 z-0"
      style={{ willChange: "transform" }}
    />
  );
}
