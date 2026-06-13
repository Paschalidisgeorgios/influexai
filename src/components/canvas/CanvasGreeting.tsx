"use client";

import { memo } from "react";
import { useCanvasGreeting } from "@/hooks/useCanvasGreeting";

function CanvasGreetingComponent() {
  const { lead, name, tail } = useCanvasGreeting();

  return (
    <header
      className="canvas-greeting pointer-events-none absolute top-4 left-4 z-20 max-w-[min(420px,calc(100vw-8rem))]"
      aria-live="polite"
    >
      <p className="font-sans text-[13px] font-normal leading-snug tracking-wider text-zinc-100 antialiased sm:text-sm">
        <span>{lead}</span>
        <span className="font-mono font-bold tracking-wide text-[#ccff00] [text-shadow:0_0_18px_rgba(204,255,0,0.35)]">
          {name}
        </span>
        <span>{tail}</span>
      </p>
    </header>
  );
}

export const CanvasGreeting = memo(CanvasGreetingComponent);
