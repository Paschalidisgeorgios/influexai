"use client";

/**
 * StudioCommandCenter — the agent-first entry point on the Studio Home page.
 *
 * Embeds the existing CopilotChat (real /api/agent/copilot stream, no fake data)
 * inline as a premium card.  Quick Action buttons route through the existing
 * handleToolSelect / router.push flow — no new API calls, no new business logic.
 *
 * Visual: "Immersive Editorial AI Studio" — dark card, lime hairline, ambient glow,
 * strong typography, ≥44 px touch targets, no fixed positioning.
 */

import type { ToolId } from "./DashboardLayout";
import { CopilotChat }  from "./AgentBox";
import {
  ImageIcon,
  Film,
  Zap,
  Calendar,
  UserRound,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Quick Actions — real tools only, routed via existing handleToolSelect
// ---------------------------------------------------------------------------

interface QuickAction {
  id:    ToolId;
  label: string;
  icon:  React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "image-gen",        label: "Bild erstellen",  icon: <ImageIcon size={13} />  },
  { id: "img-to-video",     label: "Video erstellen", icon: <Film     size={13} />  },
  { id: "viral-hook",       label: "Hook schreiben",  icon: <Zap      size={13} />  },
  { id: "content-calendar", label: "Kampagne planen", icon: <Calendar size={13} />  },
  { id: "avatar-video",     label: "Avatar Studio",   icon: <UserRound size={13} /> },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StudioCommandCenterProps {
  /** Routes to any ToolId — uses existing handleToolSelect (redirects, setActiveTool) */
  onSelect:       (id: ToolId) => void;
  credits?:       number;
  creditsLoaded?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudioCommandCenter({
  onSelect,
  credits,
  creditsLoaded,
}: StudioCommandCenterProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a0a0c]">

      {/* ── Ambient glow — lime top-left, stays subtle ─────────────────── */}
      <div
        className="pointer-events-none absolute -top-24 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full opacity-[0.09] blur-[90px]"
        style={{ background: "#b4ff00" }}
      />

      {/* ── Hairline lime top-border ────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b4ff00]/35 to-transparent" />

      <div className="relative px-5 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">

        {/* ── 1. Header ───────────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              AI Production Studio
            </p>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Was möchtest du heute erstellen?
            </h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-zinc-500">
              Beschreibe deine Idee — InfluexAI wählt das passende Tool und führt dich zum nächsten Schritt.
            </p>
          </div>

          {/* Credits pill — only when loaded */}
          {creditsLoaded && (
            <div className="shrink-0 self-start rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-2.5 text-center">
              <p className="font-mono text-sm font-bold text-[#b4ff00]">{credits}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-600">Credits</p>
            </div>
          )}
        </div>

        {/* ── 2. Quick Actions ─────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onSelect(action.id)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-[12px] font-medium text-zinc-300 transition-all duration-150 hover:border-[#b4ff00]/25 hover:bg-white/[0.04] hover:text-white active:scale-[0.97]"
            >
              <span className="shrink-0 text-zinc-500">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        {/* ── Thin separator ──────────────────────────────────────────────── */}
        <div className="mb-5 h-px bg-white/[0.04]" />

        {/* ── 3. CopilotChat — embedded inline, not fixed ──────────────────── */}
        {/* Uses /api/agent/copilot (SSE), parses [[NAVIGATE:tool-id]] to onSelect */}
        <CopilotChat onNavigate={onSelect} />

      </div>
    </div>
  );
}
