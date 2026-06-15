"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, Home, Images, LogOut } from "lucide-react";
import {
  ALL_TOOL_IDS,
  TOOL_API_SCHEMA,
  TOOL_CATEGORIES,
  isNavigateSidebarTool,
  type ToolCategory,
  type ToolId,
} from "@/lib/canvas/toolApiSchema";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { creditsDisplayColor } from "@/lib/credits-display-color";
import { createClient } from "@/lib/supabase/client";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { isClientCreditExempt } from "@/lib/client-credits-ui";

const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  open: { height: "auto", opacity: 1 },
};

const toolItemClassName =
  "group flex min-h-11 w-full items-center gap-2.5 rounded-lg border-l-2 border-transparent py-2.5 pl-3 pr-3 text-left transition-all duration-200 hover:border-[#ccff00] hover:bg-zinc-900/90 hover:shadow-[inset_0_0_16px_rgba(204,255,0,0.06)] active:bg-zinc-900";

type Props = { onToolSelect?: () => void };

export function DashboardSidebarContent({ onToolSelect }: Props) {
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const { credits, isOptimistic, openBuyModal } = useCredits();
  const [openSection, setOpenSection] = useState<ToolCategory | null>("ERSTELLEN");
  const supabase = createClient();
  const { canInstall, install } = usePwaInstall();
  const creditExempt = isClientCreditExempt();

  const creditColor =
    typeof credits === "number" ? creditsDisplayColor(credits) : "#b4ff00";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Credits */}
      <div className="border-b border-zinc-800/60 px-4 py-3">
        <button
          type="button"
          onClick={openBuyModal}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-3 py-2 transition-all hover:border-zinc-700/80"
        >
          <span className="text-xs text-zinc-500">Credits</span>
          <span
            className="font-mono text-sm font-bold transition-colors"
            style={{ color: creditExempt ? "#b4ff00" : creditColor }}
          >
            {creditExempt ? (
              "∞ ADMIN"
            ) : (
              <AnimatedCredits value={credits ?? 0} />
            )}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <Link
          href="/dashboard"
          className={`${toolItemClassName} mb-1`}
        >
          <Home size={14} className="shrink-0 text-zinc-400 group-hover:text-[#ccff00]" />
          <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white">Übersicht</span>
        </Link>

        {TOOL_CATEGORIES.map((category) => {
          const tools = ALL_TOOL_IDS
            .map((id) => TOOL_API_SCHEMA[id])
            .filter((t) => t.category === category)
            .sort((a, b) => a.label.localeCompare(b.label, "de"));

          if (tools.length === 0) return null;
          const isOpen = openSection === category;

          return (
            <div key={category} className="mb-0.5">
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : category)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all hover:bg-zinc-900/50"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {category}
                </span>
                <ChevronDown
                  size={12}
                  className={`shrink-0 text-zinc-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="tools"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={accordionVariants}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pb-1 pl-1">
                      {tools.map((tool) => {
                        if (isNavigateSidebarTool(tool)) {
                          return (
                            <Link
                              key={tool.id}
                              href={tool.dashboardRoute}
                              className={toolItemClassName}
                              onClick={onToolSelect}
                            >
                              <span className="text-base leading-none">{tool.icon}</span>
                              <span className="text-[13px] text-zinc-300 group-hover:text-white">
                                {tool.label}
                              </span>
                            </Link>
                          );
                        }
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => {
                              spawnControlNode(tool.id as ToolId);
                              onToolSelect?.();
                            }}
                            className={toolItemClassName}
                          >
                            <span className="text-base leading-none">{tool.icon}</span>
                            <span className="text-[13px] text-zinc-300 group-hover:text-white">
                              {tool.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800/60 px-2 py-2 space-y-0.5">
        <Link href="/dashboard/gallery" className={toolItemClassName}>
          <Images size={14} className="shrink-0 text-zinc-400 group-hover:text-[#ccff00]" />
          <span className="text-[13px] text-zinc-300 group-hover:text-white">Galerie</span>
        </Link>
        {canInstall ? (
          <button type="button" onClick={install} className={toolItemClassName}>
            <Download size={14} className="shrink-0 text-zinc-400 group-hover:text-[#ccff00]" />
            <span className="text-[13px] text-zinc-300 group-hover:text-white">App installieren</span>
          </button>
        ) : null}
        <button type="button" onClick={handleLogout} className={toolItemClassName}>
          <LogOut size={14} className="shrink-0 text-zinc-400 group-hover:text-red-400" />
          <span className="text-[13px] text-zinc-300 group-hover:text-red-300">Abmelden</span>
        </button>
      </div>
    </div>
  );
}
