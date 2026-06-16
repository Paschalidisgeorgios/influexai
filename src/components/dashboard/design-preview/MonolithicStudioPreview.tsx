"use client";

/**
 * MonolithicStudioPreview — InfluexAI Editorial Luxury AI Production Studio
 * Premium Dashboard Shell · Design Preview v3
 *
 * Renders as a fixed full-screen overlay (z-[100]) over the legacy
 * DashboardShell chrome — no changes to production logic required.
 *
 * Preview URL: /dashboard/design-preview
 * ALL DATA IS MOCK. No API calls, no credits, no asset writes.
 */

import { useState }        from "react";
import type { PreviewView } from "./DashboardViews";
import { StudioView, AgentView } from "./DashboardViews";
import { PreviewToolsFlow }       from "./PreviewToolsFlow";
import { PreviewGallery }         from "./PreviewGallery";
import { PreviewSettings }        from "./PreviewSettings";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";

const HEADLINE_FONT: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

const NAV_ITEMS: { id: PreviewView; label: string }[] = [
  { id: "studio",   label: "Studio"   },
  { id: "agent",    label: "Agent"    },
  { id: "tools",    label: "Tools"    },
  { id: "gallery",  label: "Gallery"  },
  { id: "settings", label: "Settings" },
];

const VIEW_LABEL: Record<PreviewView, string> = {
  studio:   "Studio",
  agent:    "Agent",
  tools:    "Tools",
  gallery:  "Gallery",
  settings: "Settings",
};

// ─── PreviewSidebar ───────────────────────────────────────────────────────────

function PreviewSidebar({
  activeView,
  onNavigate,
}: {
  activeView:  PreviewView;
  onNavigate:  (v: PreviewView) => void;
}) {
  return (
    <aside className="hidden h-full w-[220px] shrink-0 flex-col border-r border-white/[0.03] bg-[#080809] md:flex">

      {/* Logo */}
      <div className="px-6 pb-8 pt-8">
        <span
          className="font-mono text-[12px] font-bold tracking-[0.18em] uppercase text-white"
          style={HEADLINE_FONT}
        >
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <p className="mt-1 font-mono text-[9px] tracking-[0.15em] uppercase text-neutral-800">
          Editorial Studio · v3
        </p>
      </div>

      {/* Navigation — text only, no icons */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="py-2.5 text-left text-[13px] transition-colors"
              style={{
                paddingLeft: "1.5rem",
                borderLeft:  isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                color:       isActive ? "#ffffff" : "rgba(255,255,255,0.26)",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-6 mt-6 h-px bg-white/[0.04]" />

      {/* Status info — MOCK credits + plan */}
      <div className="mt-5 px-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700">
            Credits
          </p>
          <p className="font-mono text-[11px] font-bold" style={{ color: ACCENT }}>
            240
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700">
            Plan
          </p>
          <p className="font-mono text-[10px] text-neutral-600">
            Pro
          </p>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="mt-auto border-t border-white/[0.03] px-6 py-4">
        <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-neutral-800">
          Design Preview · Mock
        </p>
      </div>

    </aside>
  );
}

// ─── PreviewHeader ────────────────────────────────────────────────────────────

function PreviewHeader({
  activeView,
  onNavigate,
}: {
  activeView:  PreviewView;
  onNavigate:  (v: PreviewView) => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/[0.03] px-5 py-3.5 md:px-10">

      {/* Mobile: logo + current view */}
      <div className="flex items-center gap-3 md:hidden">
        <span className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-white">
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <span className="text-neutral-700">/</span>
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-500">
          {VIEW_LABEL[activeView]}
        </span>
      </div>

      {/* Desktop: breadcrumb path */}
      <span className="hidden font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700 md:block">
        INFLUEXAI&nbsp;// {VIEW_LABEL[activeView].toUpperCase()}
      </span>

      {/* Right: mock status */}
      {/* MOCK DATA */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700">
          240 Credits
        </span>
        <span className="hidden h-3 w-px bg-white/[0.04] md:block" />
        <span className="hidden font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700 md:block">
          Pro Plan
        </span>
        {/* Profile avatar — MOCK */}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-bold"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.40)" }}
        >
          M
        </div>
      </div>

    </header>
  );
}

// ─── MonolithicStudioPreview ──────────────────────────────────────────────────

export function MonolithicStudioPreview() {
  const [activeView, setActiveView] = useState<PreviewView>("studio");

  return (
    /* Fixed overlay — z-[100] covers legacy DashboardShell without modifying it */
    <div className="fixed inset-0 z-[100] flex bg-[#0a0a0a]">

      {/* Sidebar — Desktop only */}
      <PreviewSidebar activeView={activeView} onNavigate={setActiveView} />

      {/* Main Canvas */}
      <div
        className="flex min-h-full flex-1 flex-col overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <PreviewHeader activeView={activeView} onNavigate={setActiveView} />

        {/* Content — centered, generous side padding, clears mobile nav */}
        <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 md:px-12 md:pb-0">
          {activeView === "studio"   && <StudioView       onNavigate={setActiveView} />}
          {activeView === "agent"    && <AgentView        onNavigate={setActiveView} />}
          {activeView === "tools"    && <PreviewToolsFlow />}
          {activeView === "gallery"  && <PreviewGallery />}
          {activeView === "settings" && <PreviewSettings />}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 flex items-stretch border-t border-white/[0.03] md:hidden"
        style={{
          background:    "#080809",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className="flex flex-1 items-center justify-center py-3.5 font-mono text-[9px] tracking-widest uppercase transition-colors"
              style={{ color: isActive ? ACCENT : "rgba(255,255,255,0.25)" }}
            >
              {label}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
