"use client";

/**
 * PreviewShell — isolated design preview (not production dashboard).
 * Studio · Galerie · Kampagnen · Brand Kit · Einstellungen
 */

import { useState } from "react";
import Link from "next/link";
import { LangProvider, useLang, type PreviewView, type Lang } from "./PreviewLang";
import { PreviewViewContent } from "./PreviewViewContent";
import { PREVIEW_ACCENT, PREVIEW_SHELL } from "./preview-tokens";

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
      style={{ background: PREVIEW_SHELL, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="px-7 pb-8 pt-9">
        <span className="preview-type-brand text-white">
          INFLUEX<span style={{ color: PREVIEW_ACCENT }}>AI</span>
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
              className="preview-type-nav rounded py-3 text-left transition-colors"
              style={{
                paddingLeft: "14px",
                borderLeft: isActive ? `2px solid ${PREVIEW_ACCENT}` : "2px solid transparent",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.40)",
                background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {t.nav[view]}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t px-7 py-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between">
          <p className="preview-type-meta">{t.credits}</p>
          <p className="preview-type-chip" style={{ color: PREVIEW_ACCENT }}>
            240
          </p>
        </div>
        <p className="preview-type-meta mt-3">Preview · design-preview</p>
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
      className="preview-type-meta flex items-center gap-1.5 rounded border px-3 py-1.5 transition-colors hover:border-white/20"
      style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.70)" }}
    >
      <span style={{ color: PREVIEW_ACCENT }}>{lang.toUpperCase()}</span>
      <span>/</span>
      <span>{other.toUpperCase()}</span>
    </button>
  );
}

function PreviewTopbar({ active }: { active: PreviewView }) {
  const { t } = useLang();
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-8"
      style={{ background: PREVIEW_SHELL, borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="preview-type-brand shrink-0 text-white md:hidden">
          INFLUEX<span style={{ color: PREVIEW_ACCENT }}>AI</span>
        </span>
        <span className="preview-type-meta truncate md:hidden">· {t.nav[active]}</span>
        <span className="preview-type-meta hidden truncate md:block">{t.systemLine}</span>
        <span className="preview-type-meta hidden md:block">//</span>
        <span className="preview-type-label hidden md:block" style={{ color: "rgba(245,242,234,0.72)" }}>
          {t.nav[active]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        <span className="preview-type-meta hidden md:block">240 {t.credits}</span>
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
      <p className="preview-type-body text-[0.8125rem]">{t.previewBanner}</p>
      <Link
        href="/dashboard"
        className="preview-type-btn shrink-0 text-[0.6875rem] uppercase tracking-[0.08em]"
        style={{ color: PREVIEW_ACCENT }}
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
        background: PREVIEW_SHELL,
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
              color: isActive ? PREVIEW_ACCENT : "rgba(255,255,255,0.35)",
              background: isActive ? "rgba(180,255,0,0.06)" : "transparent",
            }}
          >
            <span className="preview-type-meta max-w-full truncate px-0.5">{t.nav[view]}</span>
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
      style={{ background: PREVIEW_SHELL }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <PreviewSidebar active={active} onNavigate={setActive} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PreviewTopbar active={active} />

          <main
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
            style={{ background: PREVIEW_SHELL, WebkitOverflowScrolling: "touch" }}
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
