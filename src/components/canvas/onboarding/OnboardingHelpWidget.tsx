"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";

function OnboardingHelpWidgetComponent() {
  const isInactive = useOnboardingStore((s) => s.isInactive);
  const chatOpen = useOnboardingStore((s) => s.chatOpen);
  const greetingVisible = useOnboardingStore((s) => s.greetingVisible);
  const openChat = useOnboardingStore((s) => s.openChat);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);

  const visible = isInactive && !chatOpen && !greetingVisible;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="onboarding-help"
          type="button"
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => {
            touchActivity();
            openChat();
          }}
          className="canvas-onboarding-help fixed bottom-6 right-6 z-40 rounded-full border border-[#ccff00]/35 bg-zinc-950/70 px-4 py-2.5 font-sans text-sm font-medium tracking-wide text-[#ccff00] shadow-[0_0_24px_rgba(204,255,0,0.18)] backdrop-blur-md transition-transform hover:scale-[1.02]"
          aria-label="Hilfe vom Live-Co-Pilot öffnen"
        >
          Brauchst du Hilfe? 💬
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

export const OnboardingHelpWidget = memo(OnboardingHelpWidgetComponent);
