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
      <p className="text-[13px] font-light leading-snug tracking-wide text-zinc-400 sm:text-sm">
        <span>{lead}</span>
        <span className="font-normal text-[#ccff00] [text-shadow:0_0_18px_rgba(204,255,0,0.35)]">
          {name}
        </span>
        <span className="text-zinc-300">{tail}</span>
      </p>
    </header>
  );
}

export const CanvasGreeting = memo(CanvasGreetingComponent);
