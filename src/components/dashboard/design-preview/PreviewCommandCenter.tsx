"use client";

import { useRef, useState, useMemo, useEffect, type KeyboardEvent } from "react";
import { useLang } from "./PreviewLang";
import {
  detectPreviewIntent,
  detectPreviewPlatform,
  buildOptimizedPrompt,
} from "./preview-intent";
import { PreviewWorkflowPanel } from "./PreviewWorkflowPanel";
import { PreviewLivePreview } from "./PreviewLivePreview";
import { PreviewNextActions, PreviewRecentAssets } from "./PreviewNextActions";
import { usePreviewDashboardMotion, animatePreviewPanel } from "./usePreviewDashboardMotion";

const ACCENT = "#b4ff00";
const DARK = "#080808";
const SURFACE = "#0a0a10";
const META = "rgba(8,8,8,0.45)";
const SUBLINE = "rgba(8,8,8,0.72)";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

const PLACEHOLDERS = {
  de: [
    "Erstelle ein Kampagnenbild für Instagram",
    "Verwandle dieses Bild in ein kurzes Reel",
    "Plane 7 Content-Ideen für eine Beauty-Marke",
    "Erstelle Varianten für dieses Asset",
  ],
  en: [
    "Create a campaign image for Instagram",
    "Turn this image into a short reel",
    "Plan 7 content ideas for a beauty brand",
    "Create variants for this asset",
  ],
} as const;

export function PreviewCommandCenter() {
  const { lang, t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [active, setActive] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const tc = t.cockpit;
  const placeholders = PLACEHOLDERS[lang];

  usePreviewDashboardMotion(rootRef, true);

  useEffect(() => {
    const iv = setInterval(() => setPlaceholderIdx((i) => (i + 1) % placeholders.length), 4200);
    return () => clearInterval(iv);
  }, [placeholders.length]);

  const intent = useMemo(() => detectPreviewIntent(input), [input]);
  const platform = useMemo(() => detectPreviewPlatform(input), [input]);
  const optimized = useMemo(
    () => buildOptimizedPrompt(input, intent),
    [input, intent]
  );
  const needsPlatform =
    input.trim().length > 12 &&
    intent !== "unknown" &&
    intent !== "campaign_planning" &&
    !platform.platform;

  const hasWorkflow = input.trim().length > 0 && intent !== "unknown";

  useEffect(() => {
    animatePreviewPanel(panelRef, hasWorkflow);
  }, [hasWorkflow, intent]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  };

  return (
    <div ref={rootRef} className="min-w-0">
      <header className="mb-6 md:mb-8" data-preview-enter>
        <p className="mb-2 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
          {tc.overline}
        </p>
        <h1
          className="mb-3 text-[1.75rem] font-extrabold leading-[1.06] sm:text-[2rem] md:text-[2.5rem]"
          style={{ ...HL, color: DARK, letterSpacing: "-0.03em" }}
        >
          {tc.headline}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed md:text-[17px]" style={{ color: SUBLINE }}>
          {tc.subline}
        </p>
      </header>

      <div className="mb-8 min-w-0" data-preview-enter>
        <div
          className="overflow-hidden rounded-lg"
          style={{
            background: SURFACE,
            border: active ? `2px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.09)",
            boxShadow: active
              ? "0 0 0 4px rgba(180,255,0,0.1), 0 16px 48px rgba(8,8,8,0.2)"
              : "0 12px 40px rgba(0,0,0,0.22)",
          }}
        >
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, ${ACCENT}88, ${ACCENT}33, transparent 80%)`,
            }}
          />
          <div className="border-b px-4 py-2.5 md:px-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Command Center
            </span>
          </div>
          <div className="relative px-4 py-5 md:px-6 md:py-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setActive(true)}
              onBlur={() => {
                if (!input) setActive(false);
              }}
              onKeyDown={handleKeyDown}
              rows={4}
              className="relative z-10 min-h-[112px] w-full resize-none bg-transparent text-[16px] leading-relaxed text-neutral-100 outline-none md:min-h-[128px] md:text-[18px]"
              placeholder={placeholders[placeholderIdx]}
            />
          </div>
        </div>
        <p className="mt-2 font-mono text-[11px] text-neutral-500">{tc.enterHint}</p>
      </div>

      <div
        ref={panelRef}
        className="mb-8 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-5"
      >
        <PreviewWorkflowPanel
          intent={intent}
          originalPrompt={input}
          optimizedPrompt={optimized}
          format={platform.format}
          needsPlatform={needsPlatform}
          lang={lang}
        />
        <PreviewLivePreview intent={intent} hasInput={hasWorkflow} lang={lang} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 border-t pt-6 md:gap-8 md:pt-8" style={{ borderColor: "rgba(8,8,8,0.08)" }}>
        <PreviewRecentAssets lang={lang} />
        <PreviewNextActions lang={lang} />
      </div>
    </div>
  );
}
