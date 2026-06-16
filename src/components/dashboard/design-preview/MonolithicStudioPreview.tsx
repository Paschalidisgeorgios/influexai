"use client";

/**
 * MonolithicStudioPreview — InfluexAI Editorial Production Studio · Shell
 *
 * Renders as a fixed full-screen overlay (z-[100]) over the legacy
 * DashboardShell chrome — no changes to production logic required.
 *
 * Preview URL: /dashboard/design-preview
 * ALL DATA IS MOCK. No API calls, no credits, no asset writes.
 */

import { useState }        from "react";
import type { PreviewView } from "./DashboardViews";
import {
  StudioView,
  ToolAreasView,
  WorkspaceView,
  GalleryView,
} from "./DashboardViews";

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: PreviewView; label: string }[] = [
  { id: "studio",    label: "Studio"    },
  { id: "tools",     label: "Tools"     },
  { id: "workspace", label: "Workspace" },
  { id: "gallery",   label: "Gallery"   },
];

const VIEW_LABEL: Record<PreviewView, string> = {
  studio:    "Studio",
  tools:     "Tools",
  workspace: "Workspace",
  gallery:   "Gallery",
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

      {/* ── Logo ───────────────────────────────────────────────────────── */}
      <div className="px-6 pb-10 pt-8">
        <span className="font-mono text-[12px] font-bold tracking-[0.18em] uppercase text-white">
          INFLUEX<span style={{ color: "#b4ff00" }}>AI</span>
        </span>
        <p className="mt-1 font-mono text-[9px] tracking-[0.15em] uppercase text-neutral-800">
          Design Preview
        </p>
      </div>

      {/* ── Nav — text only, no icons ──────────────────────────────────── */}
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
                borderLeft:  isActive ? "2px solid #b4ff00" : "2px solid transparent",
                color:       isActive ? "#ffffff" : "rgba(255,255,255,0.26)",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom meta — MOCK credits + plan ──────────────────────────── */}
      <div className="mt-auto border-t border-white/[0.03] px-6 py-5">
        {/* MOCK DATA */}
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700">
          240 Credits
        </p>
        <p className="mt-0.5 font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700">
          Pro Plan
        </p>
      </div>

    </aside>
  );
}

// ─── PreviewHeader ────────────────────────────────────────────────────────────

function PreviewHeader({ activeView }: { activeView: PreviewView }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/[0.03] px-6 py-4 md:px-10">

      {/* Mobile: logo */}
      <span className="font-mono text-[12px] font-bold tracking-[0.18em] uppercase text-white md:hidden">
        INFLUEX<span style={{ color: "#b4ff00" }}>AI</span>
      </span>

      {/* Desktop: breadcrumb */}
      <span className="hidden font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700 md:block">
        INFLUEXAI&nbsp;// {VIEW_LABEL[activeView].toUpperCase()}
      </span>

      {/* Right: mock status — MOCK DATA */}
      <div className="flex items-center gap-5">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700">
          240 Credits
        </span>
        <span className="hidden h-3 w-px bg-white/[0.04] md:block" />
        <span className="hidden font-mono text-[10px] tracking-[0.18em] uppercase text-neutral-700 md:block">
          Pro Plan
        </span>
      </div>

    </header>
  );
}

// ─── MonolithicStudioPreview — main export ────────────────────────────────────

export function MonolithicStudioPreview() {
  const [activeView, setActiveView] = useState<PreviewView>("studio");

  return (
    /* Fixed overlay — sits above legacy DashboardShell without modifying it */
    <div className="fixed inset-0 z-[100] flex bg-[#0a0a0a]">

      {/* Sidebar — Desktop only */}
      <PreviewSidebar activeView={activeView} onNavigate={setActiveView} />

      {/* Main Canvas */}
      <div
        className="flex min-h-full flex-1 flex-col overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <PreviewHeader activeView={activeView} />

        {/* Content — centered, max-width, generous horizontal padding */}
        <div
          className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 md:px-12 md:pb-0"
        >
          {activeView === "studio"    && <StudioView    onNavigate={setActiveView} />}
          {activeView === "tools"     && <ToolAreasView />}
          {activeView === "workspace" && <WorkspaceView />}
          {activeView === "gallery"   && <GalleryView />}
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
              className="flex flex-1 items-center justify-center py-4 font-mono text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: isActive ? "#b4ff00" : "rgba(255,255,255,0.25)" }}
            >
              {label}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
