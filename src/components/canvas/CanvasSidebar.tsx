"use client";

import { useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  type ToolId,
} from "@/lib/canvas/toolApiSchema";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { AnimatedCredits } from "@/components/ui/AnimatedCredits";
import { creditsDisplayColor } from "@/lib/credits-display-color";

export function CanvasSidebar() {
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const { credits, isOptimistic, openBuyModal } = useCredits();
  const [openCategory, setOpenCategory] = useState<string | null>("ERSTELLEN");

  const creditColor =
    typeof credits === "number" ? creditsDisplayColor(credits) : "#ccff00";

  return (
    <aside className="relative z-[1] flex h-full w-[280px] shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-950/40 backdrop-blur-md">
      <nav className="flex-1 overflow-y-auto px-2 py-3 font-sans">
        <Link
          href="/"
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-zinc-800/50 bg-transparent px-3 py-2 text-xs tracking-wide text-zinc-400 no-underline transition-all hover:border-zinc-700 hover:text-zinc-300"
        >
          <Home className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
          Zur Hauptseite
        </Link>
        {TOOL_CATEGORIES.map((category) => {
          const tools = getToolsByCategory(category);
          const isOpen = openCategory === category;
          return (
            <div key={category} className="mb-1">
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : category)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-bold tracking-[0.12em] text-zinc-500 uppercase hover:bg-zinc-900/60 hover:text-zinc-300"
              >
                {category}
                <span className="text-zinc-600">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <ul className="mb-2 space-y-0.5 pl-1">
                  {tools.map((tool) => (
                    <li key={tool.id}>
                      <button
                        type="button"
                        onClick={() => spawnControlNode(tool.id as ToolId)}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-900/80"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm"
                          style={{
                            borderColor: `rgba(${tool.accentRgb}, 0.25)`,
                            background: `rgba(${tool.accentRgb}, 0.06)`,
                            boxShadow: `0 0 12px rgba(${tool.accentRgb}, 0.08)`,
                          }}
                        >
                          {tool.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-zinc-200 group-hover:text-white">
                            {tool.label}
                          </span>
                          <span className="block truncate text-[9px] text-zinc-600">
                            ab {tool.baseCoins} Coins
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800/60 p-3">
        <button
          type="button"
          onClick={() => openBuyModal()}
          className="mb-2 flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-black/30 px-3 py-2.5 transition-colors hover:border-[#ccff00]/30 hover:bg-[#ccff00]/5"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
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
          className="block rounded-lg px-3 py-2 text-xs text-zinc-500 no-underline hover:bg-zinc-900/60 hover:text-zinc-300"
        >
          Einstellungen
        </Link>
        <Link
          href="/dashboard/credits"
          className="mt-1 block rounded-lg px-3 py-2 text-xs text-zinc-500 no-underline hover:bg-zinc-900/60 hover:text-zinc-300"
        >
          Credits
        </Link>
      </div>
    </aside>
  );
}
