"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Settings, Sparkles, X } from "lucide-react";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { isClientCreditExempt } from "@/lib/client-credits-ui";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { creditsDisplayColor } from "@/lib/credits-display-color";
import { CanvasSidebarContent } from "./CanvasSidebarContent";

export function CanvasMobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { credits, openBuyModal } = useCredits();
  const creditExempt = isClientCreditExempt();
  const creditColor =
    typeof credits === "number" ? creditsDisplayColor(credits) : "#ccff00";

  return (
    <>
      <AnimatePresence>
        {sheetOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] border-none bg-black/60 backdrop-blur-sm md:hidden"
              aria-label="Tools schließen"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[min(82dvh,640px)] flex-col overflow-hidden rounded-t-2xl border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Studio Tools"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
                <span className="font-sans text-sm font-bold text-white">Studio Tools</span>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-full bg-zinc-900/80 p-2 text-zinc-400 hover:text-white"
                  aria-label="Schließen"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <CanvasSidebarContent onToolSelect={() => setSheetOpen(false)} />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-800 bg-zinc-950/80 p-3 backdrop-blur-xl md:hidden"
        aria-label="Mobile Studio Navigation"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-11 min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-3 text-[10px] font-medium text-zinc-300 active:text-[#ccff00]"
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
          Tools
        </button>
        <button
          type="button"
          onClick={() => {
            if (!creditExempt) openBuyModal();
          }}
          className="flex min-h-11 min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-3 text-[10px] font-medium text-zinc-300 active:text-[#ccff00]"
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          {creditExempt ? (
            <span className="text-[10px] text-white/20 tracking-widest uppercase">
              ∞ Admin
            </span>
          ) : (
            <span style={{ color: creditColor }}>
              <AnimatedCredits value={credits} />
            </span>
          )}
        </button>
        <Link
          href="/dashboard/settings"
          className="flex min-h-11 min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-3 text-[10px] font-medium text-zinc-300 no-underline active:text-[#ccff00]"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} />
          Settings
        </Link>
      </nav>
    </>
  );
}
