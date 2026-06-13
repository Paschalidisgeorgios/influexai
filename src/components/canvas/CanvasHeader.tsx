"use client";

import { memo } from "react";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { useCanvasGreeting } from "@/hooks/useCanvasGreeting";

function CanvasHeaderComponent() {
  const { lead, name, tail } = useCanvasGreeting();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/50 bg-zinc-950/40 px-4 backdrop-blur-md">
      <BrandWordmark href="/" />

      <p
        className="canvas-greeting max-w-[min(420px,calc(100vw-12rem))] text-right font-sans text-[13px] font-normal leading-snug tracking-wide text-zinc-300 antialiased sm:text-sm"
        aria-live="polite"
      >
        <span>{lead}</span>
        <span className="font-mono font-bold tracking-wide text-[#ccff00] [text-shadow:0_0_18px_rgba(204,255,0,0.35)]">
          {name}
        </span>
        <span>{tail}</span>
      </p>
    </header>
  );
}

export const CanvasHeader = memo(CanvasHeaderComponent);
