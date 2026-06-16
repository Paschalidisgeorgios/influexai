"use client";

/**
 * PreviewShell — High-contrast Creator Production OS shell.
 * Studio + Agent + Tools + Gallery. ALL DATA IS MOCK.
 */

import { useState } from "react";
import { LangProvider, useLang, type PreviewView, type Lang } from "./PreviewLang";
import { PreviewStudioHome, PreviewAgentView } from "./PreviewStudioHome";
import { PreviewToolsFlow } from "./PreviewToolsFlow";
import { PreviewGallery } from "./PreviewGallery";

const ACCENT   = "#b4ff00";
const SHELL_BG = "#050506";
const IVORY    = "#F4F0E8";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

const ACTIVE_VIEWS: PreviewView[] = ["studio", "agent", "tools", "gallery"];

// ─── Sidebar (220px) ──────────────────────────────────────────────────────────

function PreviewSidebar({
  active,
  onNavigate,
}: {
  active:     PreviewView;
  onNavigate: (v: PreviewView) => void;
}) {
  const { t } = useLang();

  return (
    <aside
      className="hidden h-full w-[220px] shrink-0 flex-col border-r md:flex"
      style={{ background: SHELL_BG, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="px-7 pb-10 pt-9">
        <span className="font-mono text-[13px] font-bold tracking-[0.16em] uppercase text-white" style={HL}>
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <p className="mt-2 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
          Production OS · Preview
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-4">
        {ACTIVE_VIEWS.map((view) => {
          const isActive = active === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              className="rounded py-3 text-left text-[14px] font-medium transition-colors"
              style={{
                paddingLeft: "14px",
                borderLeft:  isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                color:       isActive ? "#ffffff" : "rgba(255,255,255,0.40)",
                background:  isActive ? "rgba(255,255,255,0.04)" : "transparent",
              }}
            >
              {t.nav[view]}
            </button>
          );
        })}
      </nav>

      <div className="mx-7 mt-10 h-px bg-white/[0.06]" />

      <div className="mt-6 px-7">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-500">{t.credits}</p>
          <p className="font-mono text-[12px] font-bold" style={{ color: ACCENT }}>240</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-500">{t.plan}</p>
          <p className="font-mono text-[11px] text-neutral-300">{t.proPlan}</p>
        </div>
      </div>

      <div className="mt-auto border-t px-7 py-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-600">
          {t.mock} · design-preview
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
      className="flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors hover:border-white/20"
      style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.70)" }}
    >
      <span style={{ color: ACCENT }}>{lang.toUpperCase()}</span>
      <span className="text-neutral-600">/</span>
      <span>{other.toUpperCase()}</span>
    </button>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function PreviewTopbar({ active }: { active: PreviewView }) {
  const { t } = useLang();
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b px-5 py-3.5 md:px-8"
      style={{ background: SHELL_BG, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 font-mono text-[12px] font-bold tracking-[0.14em] uppercase text-white md:hidden" style={HL}>
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <span className="hidden truncate font-mono text-[11px] tracking-[0.18em] uppercase text-neutral-400 md:block">
          {t.systemLine}
        </span>
        <span className="hidden text-neutral-700 md:block">//</span>
        <span className="hidden font-mono text-[11px] tracking-[0.12em] uppercase text-neutral-300 md:block">
          {t.nav[active]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <span className="hidden font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-400 md:block">
          240 {t.credits}
        </span>
        <span className="hidden font-mono text-[11px] text-neutral-500 md:block">{t.proPlan}</span>
        <span className="hidden h-4 w-px bg-white/10 md:block" />
        <LangToggle />
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px] font-bold text-neutral-300"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          M
        </div>
      </div>
    </header>
  );
}

// ─── Inner ────────────────────────────────────────────────────────────────────

function PreviewInner() {
  const [active, setActive] = useState<PreviewView>("studio");
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-[100] flex" style={{ background: SHELL_BG }}>
      <PreviewSidebar active={active} onNavigate={setActive} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PreviewTopbar active={active} />

        {/* Main scroll — dark shell framing a warm editorial stage */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarWidth: "none", background: SHELL_BG }}
        >
          <div className="mx-auto w-full min-w-0 max-w-[96rem] px-1.5 pb-36 pt-1.5 md:px-3 md:pb-10 md:pt-3">
            <div
              className="min-h-[calc(100vh-6.5rem)] min-w-0 overflow-x-clip overflow-y-visible rounded-lg"
              style={{
                background: IVORY,
                border: "1px solid rgba(8,8,8,0.10)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 12px 48px rgba(0,0,0,0.28)",
              }}
            >
              <div
                className="h-[3px] w-full"
                style={{ background: `linear-gradient(90deg, ${ACCENT}88, ${ACCENT}33 40%, transparent 85%)` }}
              />
              <div className="min-w-0 px-4 pb-12 pt-5 md:px-14 md:pb-14 md:pt-10 lg:px-16">
                {active === "studio"  && <PreviewStudioHome onNavigate={setActive} />}
                {active === "agent"   && <PreviewAgentView  onNavigate={setActive} />}
                {active === "tools"   && <PreviewToolsFlow />}
                {active === "gallery" && <PreviewGallery />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 flex border-t md:hidden"
        style={{
          background:    SHELL_BG,
          borderColor:   "rgba(255,255,255,0.08)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {ACTIVE_VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActive(view)}
            className="flex flex-1 items-center justify-center py-3.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors md:py-4 md:text-[11px]"
            style={{
              color:      active === view ? ACCENT : "rgba(255,255,255,0.35)",
              background: active === view ? "rgba(180,255,0,0.06)" : "transparent",
            }}
          >
            {t.nav[view]}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function PreviewShell() {
  return (
    <LangProvider>
      <PreviewInner />
    </LangProvider>
  );
}
