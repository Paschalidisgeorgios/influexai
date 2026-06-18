"use client";

/**
 * PreviewShell — isolated design preview (not production dashboard).
 * Studio · Galerie · Kampagnen · Brand Kit · Einstellungen
 */

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LangProvider, useLang, type PreviewView, type Lang } from "./PreviewLang";
import { PreviewViewContent } from "./PreviewViewContent";
import { PreviewBackgroundSystem } from "./PreviewBackgroundSystem";
import { PREVIEW_ACCENT } from "./preview-tokens";
import type { AiCreatorSeed } from "@/lib/ai-creator/types";

const ACTIVE_VIEWS: PreviewView[] = [
  "studio",
  "ai-creator",
  "gallery",
  "campaigns",
  "brandkit",
  "settings",
];

const VIEW_PARAM_MAP: Record<string, PreviewView> = {
  studio: "studio",
  "ai-creator": "ai-creator",
  gallery: "gallery",
  campaigns: "campaigns",
  brandkit: "brandkit",
  settings: "settings",
};

function PreviewSidebar({
  active,
  onNavigate,
}: {
  active: PreviewView;
  onNavigate: (v: PreviewView) => void;
}) {
  const { t } = useLang();

  return (
    <aside className="preview-sidebar hidden h-full w-[220px] shrink-0 flex-col border-r md:flex">
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
                color: isActive ? "#f5f2ea" : "rgba(245,242,234,0.42)",
                background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {t.nav[view]}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/[0.06] px-7 py-5">
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
      className="preview-type-meta flex items-center gap-1.5 rounded border border-white/[0.12] px-3 py-1.5 text-[rgba(245,242,234,0.7)] transition-colors hover:border-white/20"
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
    <header className="preview-topbar flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-8">
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
    <div className="preview-surface preview-surface--compact mb-6 flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="preview-type-body text-[0.8125rem]">{t.previewBanner}</p>
      <Link
        href="/dashboard"
        className="preview-type-btn-primary shrink-0 px-4 py-2 text-[0.6875rem] uppercase tracking-[0.08em]"
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
      className="preview-sidebar flex shrink-0 overflow-x-hidden border-t md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
              color: isActive ? PREVIEW_ACCENT : "rgba(245,242,234,0.38)",
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
  const searchParams = useSearchParams();
  const [active, setActive] = useState<PreviewView>("studio");
  const [commandFocused, setCommandFocused] = useState(false);
  const [aiCreatorSeed, setAiCreatorSeed] = useState<AiCreatorSeed | undefined>();

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && VIEW_PARAM_MAP[view]) {
      setActive(VIEW_PARAM_MAP[view]);
    }
  }, [searchParams]);

  useEffect(() => {
    if (active !== "studio") setCommandFocused(false);
  }, [active]);

  const handleOpenAiCreator = useCallback((seed: AiCreatorSeed) => {
    setAiCreatorSeed(seed);
    setActive("ai-creator");
  }, []);

  const rootClass = [
    "preview-studio-root",
    "h-dvh max-h-dvh w-full overflow-hidden",
    commandFocused ? "preview-studio-root--command-focus" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <PreviewBackgroundSystem />
      <div className="preview-shell-layout flex h-full flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <PreviewSidebar active={active} onNavigate={setActive} />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <PreviewTopbar active={active} />

            <main className="preview-main-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              <div className="preview-main-grid w-full max-w-full px-4 py-4 md:px-8 md:py-8 lg:px-12">
                <PreviewModeBanner />
                <PreviewViewContent
                  active={active}
                  onNavigate={setActive}
                  onCommandFocusChange={setCommandFocused}
                  onOpenAiCreator={handleOpenAiCreator}
                  aiCreatorSeed={aiCreatorSeed}
                />
              </div>
            </main>
          </div>
        </div>

        <PreviewMobileNav active={active} onNavigate={setActive} />
      </div>
    </div>
  );
}

export function PreviewShell() {
  return (
    <LangProvider>
      <Suspense fallback={null}>
        <PreviewInner />
      </Suspense>
    </LangProvider>
  );
}
