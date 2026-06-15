"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { glassSurfaceStaticClass } from "@/lib/glass-classes";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { useCanvasGreeting } from "@/hooks/useCanvasGreeting";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";

function DashboardHeaderComponent() {
  const { lead, name, tail } = useCanvasGreeting();
  const { isAdmin } = usePlatformAdmin();
  const greetingVisible = useOnboardingStore((s) => s.greetingVisible);
  const isInactive = useOnboardingStore((s) => s.isInactive);
  const chatOpen = useOnboardingStore((s) => s.chatOpen);
  const openChat = useOnboardingStore((s) => s.openChat);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);

  const showHeaderHelp = isInactive && !chatOpen && !greetingVisible;

  return (
    <header
      className={`relative grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b px-4 ${glassSurfaceStaticClass}`}
    >
      <BrandWordmark href="/" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex min-h-[1.5rem] w-max max-w-[min(420px,calc(100vw-8rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {greetingVisible ? (
            <motion.div
              key="greeting"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pointer-events-auto flex items-center gap-2"
            >
              <p
                className="text-center font-sans text-[13px] font-normal leading-snug tracking-wide text-zinc-300 antialiased sm:text-sm"
                aria-live="polite"
              >
                <span>{lead}</span>
                <span className="font-mono font-bold tracking-wide text-[#b4ff00] [text-shadow:0_0_18px_rgba(180,255,0,0.35)]">
                  {name}
                </span>
                <span>{tail}</span>
              </p>
              {isAdmin ? (
                <span className="rounded px-1.5 py-0.5 font-mono text-sm tracking-wide text-white/30">
                  [ADMIN]
                </span>
              ) : null}
            </motion.div>
          ) : showHeaderHelp ? (
            <motion.button
              key="header-help"
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              onClick={() => { touchActivity(); openChat(); }}
              className="canvas-onboarding-help pointer-events-auto rounded-full border border-[#b4ff00]/30 bg-[#b4ff00]/10 px-3 py-1.5 font-sans text-xs font-medium tracking-wide text-[#b4ff00] shadow-[0_0_16px_rgba(180,255,0,0.15)] transition-transform hover:scale-[1.02]"
            >
              Brauchst du Hilfe? 💬
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <div aria-hidden className="justify-self-end" />
    </header>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);
