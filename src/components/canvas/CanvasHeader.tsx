"use client";

import Link from "next/link";
import { memo } from "react";
import { useCanvasGreeting } from "@/hooks/useCanvasGreeting";

function CanvasHeaderComponent() {
  const { lead, name, tail } = useCanvasGreeting();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/90 px-4 backdrop-blur-xl">
      <Link
        href="/"
        className="flex shrink-0 items-center no-underline"
        aria-label="Zur Startseite"
      >
        <span className="font-sans text-xl uppercase font-extrabold tracking-widest text-white antialiased">
          INFLUEX{" "}
          <span className="text-[#ccff00] drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]">
            AI
          </span>
        </span>
      </Link>

      <p
        className="canvas-greeting max-w-[min(420px,calc(100vw-12rem))] text-right font-sans text-[13px] font-normal leading-snug tracking-wider text-zinc-100 antialiased sm:text-sm"
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
