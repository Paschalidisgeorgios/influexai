"use client";

/**
 * PreviewShell — isolated design preview (not production dashboard).
 * Studio · Galerie · Kampagnen · Brand Kit · Einstellungen
 */

import { useState } from "react";
import Link from "next/link";
import { LangProvider, useLang, type PreviewView, type Lang } from "./PreviewLang";
import { PreviewViewContent } from "./PreviewViewContent";

const ACCENT = "#b4ff00";
const SHELL_BG = "#050506";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

const ACTIVE_VIEWS: PreviewView[] = [
  "studio",
  "gallery",
  "campaigns",
  "brandkit",
  "settings",
];

function PreviewSidebar({
  active,
  onNavigate,
}: {
  active: PreviewView;
  onNavigate: (v: PreviewView) => void;
}) {
  const { t } = useLang();

  return (
    <aside
      className="hidden h-full w-[220px] shrink-0 flex-col border-r md:flex"
      style={{ background: SHELL_BG, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="px-7 pb-8 pt-9">
        <span
          className="font-mono text-[13px] font-bold tracking-[0.16em] uppercase text-white"
          style={HL}
        >
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
      </div>

      <div className="mx-7 mb-6 h-px bg-white/[0.06]" />

      <nav className="flex flex-col gap-0.5 px-4">
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
                borderLeft: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.40)",
                background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
              }}
            >
              {t.nav[view]}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t px-7 py-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-500">
            {t.credits}
          </p>
          <p className="font-mono text-[12px] font-bold" style={{ color: ACCENT }}>
            240
          </p>
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-600">
          Preview · design-preview
        </p>
      </div>
    </aside>
  );
}

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

function PreviewTopbar({ active }: { active: PreviewView }) {
  const { t } = useLang();
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-8"
      style={{ background: SHELL_BG, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="shrink-0 font-mono text-[12px] font-bold tracking-[0.14em] uppercase text-white md:hidden"
          style={HL}
        >
          INFLUEX<span style={{ color: ACCENT }}>AI</span>
        </span>
        <span className="truncate font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-400 md:hidden">
          · {t.nav[active]}
        </span>
        <span className="hidden truncate font-mono text-[11px] tracking-[0.18em] uppercase text-neutral-400 md:block">
          {t.systemLine}
        </span>
        <span className="hidden text-neutral-700 md:block">//</span>
        <span className="hidden font-mono text-[11px] tracking-[0.12em] uppercase text-neutral-300 md:block">
          {t.nav[active]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        <span className="hidden font-mono text-[11px] tracking-[0.1em] uppercase text-neutral-400 md:block">
          240 {t.credits}
        </span>
        <LangToggle />
      </div>
    </header>
  );
}

function PreviewModeBanner() {
  const { t } = useLang();
  return (
    <div
      className="mb-6 flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(180,255,0,0.06)",
      }}
    >
      <p className="text-[12px] font-medium text-neutral-300">{t.previewBanner}</p>
      <Link
        href="/dashboard"
        className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: ACCENT }}
      >
        {t.previewBannerCta}
      </Link>
    </div>
  );
}

function PreviewMobileNav({
  active,
  onNavigate,
}: {
  active: PreviewView;
  onNavigate: (v: PreviewView) => void;
}) {
  const { t } = useLang();

  return (
    <nav
      className="flex shrink-0 overflow-x-hidden border-t md:hidden"
      style={{
        background: SHELL_BG,
        borderColor: "rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {ACTIVE_VIEWS.map((view) => {
        const isActive = active === view;
        return (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2.5"
            style={{
              color: isActive ? ACCENT : "rgba(255,255,255,0.35)",
              background: isActive ? "rgba(180,255,0,0.06)" : "transparent",
            }}
          >
            <span className="max-w-full truncate px-0.5 font-mono text-[8px] tracking-[0.04em] uppercase">
              {t.nav[view]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function PreviewInner() {
  const [active, setActive] = useState<PreviewView>("studio");

  return (
    <div
      className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden"
      style={{ background: SHELL_BG }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <PreviewSidebar active={active} onNavigate={setActive} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PreviewTopbar active={active} />

          <main
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
            style={{ background: SHELL_BG, WebkitOverflowScrolling: "touch" }}
          >
            <div className="preview-main-grid w-full max-w-full px-4 py-4 md:px-8 md:py-8 lg:px-12">
              <PreviewModeBanner />
              <PreviewViewContent active={active} onNavigate={setActive} />
            </div>
          </main>
        </div>
      </div>

      <PreviewMobileNav active={active} onNavigate={setActive} />
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
