"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { glassSurfaceStaticClass } from "@/lib/glass-classes";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { useCanvasGreeting } from "@/hooks/useCanvasGreeting";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";

function CanvasHeaderComponent() {
  const { lead, name, tail } = useCanvasGreeting();
  const greetingVisible = useOnboardingStore((s) => s.greetingVisible);
  const isInactive = useOnboardingStore((s) => s.isInactive);
  const chatOpen = useOnboardingStore((s) => s.chatOpen);
  const openChat = useOnboardingStore((s) => s.openChat);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);

  const showHeaderHelp = isInactive && !chatOpen && !greetingVisible;

  return (
    <header className={`flex h-14 shrink-0 items-center justify-between border-b px-4 ${glassSurfaceStaticClass}`}>
      <BrandWordmark href="/" />

      <div className="relative flex min-h-[1.5rem] min-w-[12rem] items-center justify-end">
        <AnimatePresence mode="wait">
          {greetingVisible ? (
            <motion.p
              key="greeting"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="canvas-greeting max-w-[min(420px,calc(100vw-12rem))] text-right font-sans text-[13px] font-normal leading-snug tracking-wide text-zinc-300 antialiased sm:text-sm"
              aria-live="polite"
            >
              <span>{lead}</span>
              <span className="font-mono font-bold tracking-wide text-[#ccff00] [text-shadow:0_0_18px_rgba(204,255,0,0.35)]">
                {name}
              </span>
              <span>{tail}</span>
            </motion.p>
          ) : showHeaderHelp ? (
            <motion.button
              key="header-help"
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                touchActivity();
                openChat();
              }}
              className="rounded-full border border-[#ccff00]/30 bg-[#ccff00]/10 px-3 py-1.5 font-sans text-xs font-medium tracking-wide text-[#ccff00] shadow-[0_0_16px_rgba(204,255,0,0.15)] transition-transform hover:scale-[1.02]"
            >
              Brauchst du Hilfe? 💬
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

export const CanvasHeader = memo(CanvasHeaderComponent);
