"use client";

/**
 * PreviewShell — Main orchestrator for the design preview.
 *
 * Architecture:
 *   LangProvider
 *   └── Fixed overlay (z-[100], covers legacy DashboardShell without modifying it)
 *       ├── PreviewSidebar   (desktop left nav)
 *       ├── PreviewTopbar    (system line + credits + lang toggle + profile)
 *       └── Content area     (scrollable, routes to active view)
 *           ├── PreviewStudioHome  (studio view)
 *           ├── PreviewAgentView   (full-screen agent)
 *           ├── PreviewToolsFlow   (4-step tool flow)
 *           ├── PreviewGallery     (gallery with filters)
 *           └── PreviewSettings    (settings sections)
 *       └── Mobile bottom navigation
 *
 * ALL DATA IS MOCK. No API calls, no credits, no assets saved.
 * Isolated to /dashboard/design-preview.
 */

import { useState } from "react";
import { LangProvider, useLang, type PreviewView, type Lang } from "./PreviewLang";
import { PreviewStudioHome, PreviewAgentView } from "./PreviewStudioHome";
import { PreviewToolsFlow } from "./PreviewToolsFlow";
import { PreviewGallery }   from "./PreviewGallery";
import { PreviewSettings }  from "./PreviewSettings";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── PreviewSidebar ───────────────────────────────────────────────────────────

function PreviewSidebar({
  active,
  onNavigate,
}: {
  active:     PreviewView;
  onNavigate: (v: PreviewView) => void;
}) {
  const { t } = useLang();

  const NAV: PreviewView[] = ["studio", "agent", "tools", "gallery", "settings"];

  return (
    <aside
      className="hidden h-full w-[210px] shrink-0 flex-col border-r md:flex"
      style={{ background: "#050506", borderColor: "rgba(255,255,255,0.03)" }}
    >
      {/* Logo */}
      <div className="px-6 pb-8 pt-8">
        <span className="font-mono text-[12px] font-bold tracking-[0.18em] uppercase text-white" style={HL}>
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <p className="mt-1 font-mono text-[9px] tracking-[0.14em] uppercase text-neutral-800">
          Production OS · Preview
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map((view) => {
          const isActive = active === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              className="rounded-sm py-2.5 text-left text-[13px] transition-colors"
              style={{
                paddingLeft: "12px",
                borderLeft:  isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                color:       isActive ? "#ffffff" : "rgba(255,255,255,0.25)",
              }}
            >
              {t.nav[view]}
            </button>
          );
        })}
      </nav>

      <div className="mx-6 mt-6 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />

      {/* Credits + Plan — MOCK */}
      <div className="mt-5 px-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-neutral-700">{t.credits}</p>
          <p className="font-mono text-[11px] font-bold" style={{ color: ACCENT }}>240</p>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-neutral-700">{t.plan}</p>
          <p className="font-mono text-[10px] text-neutral-600">{t.proPlan}</p>
        </div>
      </div>

      {/* Bottom meta */}
      <div className="mt-auto border-t px-6 py-4" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-neutral-800">
          {t.mock} · /dashboard/design-preview
        </p>
      </div>
    </aside>
  );
}

// ─── Language Toggle ──────────────────────────────────────────────────────────

function LangToggle() {
  const { lang, setLang } = useLang();
  const other: Lang = lang === "de" ? "en" : "de";
  return (
    <button
      type="button"
      onClick={() => setLang(other)}
      className="flex items-center gap-1 border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase transition-all"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        color:       "rgba(255,255,255,0.50)",
      }}
      title={`Switch to ${other.toUpperCase()}`}
    >
      <span style={{ color: "rgba(255,255,255,0.30)" }}>{lang.toUpperCase()}</span>
      <span className="mx-1 text-neutral-800">/</span>
      <span>{other.toUpperCase()}</span>
    </button>
  );
}

// ─── PreviewTopbar ────────────────────────────────────────────────────────────

function PreviewTopbar({ active }: { active: PreviewView }) {
  const { t } = useLang();
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b px-5 py-3 md:px-8"
      style={{ borderColor: "rgba(255,255,255,0.03)" }}
    >
      {/* System line */}
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <span className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-white md:hidden">
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <span className="hidden font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700 md:block">
          {t.systemLine}
        </span>
        <span className="hidden text-neutral-800 md:block">//</span>
        <span className="hidden font-mono text-[10px] tracking-widest uppercase text-neutral-600 md:block">
          {t.nav[active]}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Credits — MOCK */}
        <span className="hidden font-mono text-[10px] tracking-widest uppercase text-neutral-700 md:block">
          240 {t.credits}
        </span>
        <span className="hidden h-3 w-px bg-white/[0.04] md:block" />
        {/* Lang Toggle */}
        <LangToggle />
        {/* Profile avatar — MOCK */}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-bold"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}
        >
          M
        </div>
      </div>
    </header>
  );
}

// ─── Content Router ───────────────────────────────────────────────────────────

function ContentRouter({
  active,
  onNavigate,
}: {
  active:     PreviewView;
  onNavigate: (v: PreviewView) => void;
}) {
  switch (active) {
    case "studio":   return <PreviewStudioHome onNavigate={onNavigate} />;
    case "agent":    return <PreviewAgentView  onNavigate={onNavigate} />;
    case "tools":    return <PreviewToolsFlow />;
    case "gallery":  return <PreviewGallery />;
    case "settings": return <PreviewSettings />;
    default:         return <PreviewStudioHome onNavigate={onNavigate} />;
  }
}

// ─── Inner shell (consumes lang context) ─────────────────────────────────────

function PreviewInner() {
  const [active, setActive] = useState<PreviewView>("studio");
  const { t } = useLang();
  const NAV: PreviewView[] = ["studio", "agent", "tools", "gallery", "settings"];

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#080808]">
      {/* Sidebar (desktop) */}
      <PreviewSidebar active={active} onNavigate={setActive} />

      {/* Main canvas */}
      <div className="flex min-h-full flex-1 flex-col overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <PreviewTopbar active={active} />

        {/* Scrollable content — max-width centered, generous padding */}
        <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 md:px-12 md:pb-12">
          <ContentRouter active={active} onNavigate={setActive} />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 flex items-stretch border-t md:hidden"
        style={{
          background:    "#050506",
          borderColor:   "rgba(255,255,255,0.04)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {NAV.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActive(view)}
            className="flex flex-1 items-center justify-center py-3.5 font-mono text-[9px] tracking-widest uppercase transition-colors"
            style={{ color: active === view ? ACCENT : "rgba(255,255,255,0.22)" }}
          >
            {t.nav[view]}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Main Export (wraps with LangProvider) ────────────────────────────────────

export function PreviewShell() {
  return (
    <LangProvider>
      <PreviewInner />
    </LangProvider>
  );
}
