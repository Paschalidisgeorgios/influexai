"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, Home, LogOut } from "lucide-react";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  type ToolCategory,
  type ToolId,
} from "@/lib/canvas/toolApiSchema";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { creditsDisplayColor } from "@/lib/credits-display-color";
import { createClient } from "@/lib/supabase/client";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  open: { height: "auto", opacity: 1 },
};

type CanvasSidebarContentProps = {
  onToolSelect?: () => void;
};

export function CanvasSidebarContent({ onToolSelect }: CanvasSidebarContentProps) {
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const { credits, isOptimistic, openBuyModal } = useCredits();
  const [openSection, setOpenSection] = useState<ToolCategory | null>("ERSTELLEN");
  const supabase = createClient();
  const { canInstall, install } = usePwaInstall();

  const creditColor =
    typeof credits === "number" ? creditsDisplayColor(credits) : "#ccff00";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const toggleSection = (category: ToolCategory) => {
    setOpenSection((current) => (current === category ? null : category));
  };

  const handleSpawn = (toolId: ToolId) => {
    spawnControlNode(toolId);
    onToolSelect?.();
  };

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-2 py-3 font-sans">
        <Link
          href="/"
          onClick={onToolSelect}
          className="mb-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-3 py-2.5 text-xs tracking-wide text-zinc-300 no-underline transition-all hover:border-zinc-600 hover:text-white"
        >
          <Home className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
          Zur Hauptseite
        </Link>

        {TOOL_CATEGORIES.map((category) => {
          const tools = getToolsByCategory(category);
          const isOpen = openSection === category;

          return (
            <div key={category} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggleSection(category)}
                aria-expanded={isOpen}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-left font-sans text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                  isOpen
                    ? "text-[#ccff00] hover:text-[#ccff00]"
                    : "text-zinc-200 hover:text-white"
                }`}
              >
                {category}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${
                    isOpen ? "rotate-180 text-[#ccff00]" : "text-zinc-400"
                  }`}
                  strokeWidth={2}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key={`${category}-panel`}
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={accordionVariants}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <ul className="mb-2 space-y-0.5 pb-1">
                      {tools.map((tool) => (
                        <li key={tool.id}>
                          <button
                            type="button"
                            onClick={() => handleSpawn(tool.id as ToolId)}
                            className="group flex min-h-11 w-full items-center gap-2.5 rounded-lg border-l-2 border-transparent py-2.5 pl-3 pr-3 text-left transition-all duration-200 hover:border-[#ccff00] hover:bg-zinc-900/90 hover:shadow-[inset_0_0_16px_rgba(204,255,0,0.06)] active:bg-zinc-900"
                          >
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm"
                              style={{
                                borderColor: `rgba(${tool.accentRgb}, 0.35)`,
                                background: `rgba(${tool.accentRgb}, 0.1)`,
                                boxShadow: `0 0 14px rgba(${tool.accentRgb}, 0.12)`,
                              }}
                            >
                              {tool.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium text-zinc-100 group-hover:text-white">
                                {tool.label}
                              </span>
                              <span className="block truncate text-[9px] text-zinc-400 group-hover:text-zinc-300">
                                ab {tool.baseCoins} Coins
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-zinc-700/60 p-3">
        <button
          type="button"
          onClick={() => openBuyModal()}
          className="mb-2 flex min-h-11 w-full items-center justify-between rounded-xl border border-zinc-700/80 bg-black/40 px-3 py-2.5 transition-colors hover:border-[#ccff00]/30 hover:bg-[#ccff00]/5"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Credits
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums">
            <span style={{ color: creditColor }}>⚡</span>
            <AnimatedCredits value={credits} style={{ color: creditColor }} />
            {isOptimistic ? (
              <span className="text-[8px] font-bold uppercase text-[#ccff00]/70">
                live
              </span>
            ) : null}
          </span>
        </button>
        <Link
          href="/dashboard/settings"
          onClick={onToolSelect}
          className="block min-h-11 rounded-lg px-3 py-2.5 text-xs leading-[44px] text-zinc-400 no-underline hover:bg-zinc-900/60 hover:text-zinc-200"
        >
          Einstellungen
        </Link>
        <Link
          href="/dashboard/credits"
          onClick={onToolSelect}
          className="mt-1 block min-h-11 rounded-lg px-3 py-2.5 text-xs leading-[44px] text-zinc-400 no-underline hover:bg-zinc-900/60 hover:text-zinc-200"
        >
          Credits
        </Link>
        {canInstall ? (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-2 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-300 transition-all duration-300 hover:border-[#ccff00]/40 hover:text-[#ccff00]"
          >
            <Download className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
            App installieren
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-2 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-zinc-400 transition-all duration-300 hover:border-red-900/30 hover:bg-red-950/20 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
          Abmelden
        </button>
      </div>
    </>
  );
}
