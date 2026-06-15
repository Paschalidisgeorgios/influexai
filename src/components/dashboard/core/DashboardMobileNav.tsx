"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { glassSurfaceStaticClass } from "@/lib/glass-classes";
import { DashboardSidebarContent } from "./DashboardSidebarContent";

export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom bar — mobile only */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-between border-t border-zinc-800/70 bg-zinc-950/95 px-4 pb-[env(safe-area-inset-bottom)] md:hidden ${glassSurfaceStaticClass}`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 text-zinc-400"
          aria-label="Navigation öffnen"
        >
          <Menu size={22} />
          <span className="text-[10px]">Tools</span>
        </button>
      </div>

      {/* Slide-up drawer */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 z-[70] max-h-[80dvh] overflow-hidden rounded-t-2xl border-t border-zinc-800/70 bg-zinc-950 pb-[env(safe-area-inset-bottom)] md:hidden`}
            >
              <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
                <span className="text-sm font-semibold text-zinc-200">Navigation</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(80dvh - 3.5rem)" }}>
                <DashboardSidebarContent onToolSelect={() => setOpen(false)} />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
