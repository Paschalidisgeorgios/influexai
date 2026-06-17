"use client";

/**
 * PreviewCommandOs — command-first Creator Studio (PHASE 4E).
 * MOCK intent routing · isolated to /dashboard/design-preview.
 */

import { useCallback, useState, type KeyboardEvent } from "react";
import {
  detectPlatform,
  detectPreviewIntent,
  type PreviewIntentId,
  type PreviewPlatformHint,
} from "./preview-intent";
import { PreviewLivePreview } from "./PreviewLivePreview";
import { PreviewNextActions } from "./PreviewNextActions";
import { PreviewWorkflowPanel } from "./PreviewWorkflowPanel";
import { useLang, type PreviewView } from "./PreviewLang";
import {
  PREVIEW_ACCENT,
  PREVIEW_BODY,
  PREVIEW_DARK,
  PREVIEW_HL,
  PREVIEW_LIGHT_BORDER,
  PREVIEW_META,
  PREVIEW_SUBLINE,
  PREVIEW_SURFACE_DARK,
} from "./preview-tokens";

type Props = {
  onNavigate: (view: PreviewView) => void;
  variant?: "studio" | "agent";
};

export function PreviewCommandOs({ onNavigate, variant = "studio" }: Props) {
  const { t } = useLang();
  const c = t.commandOs;

  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [intent, setIntent] = useState<PreviewIntentId | null>(null);
  const [platform, setPlatform] = useState<PreviewPlatformHint | null>(null);
  const [needsPlatform, setNeedsPlatform] = useState(false);
  const [platformAnswer, setPlatformAnswer] = useState("");
  const [previewGenerating, setPreviewGenerating] = useState(false);
  const [focused, setFocused] = useState(false);

  const resolveIntent = useCallback((text: string) => {
    const result = detectPreviewIntent(text);
    const resolvedIntent =
      result.intent === "unknown" ? ("image_generation" as PreviewIntentId) : result.intent;
    setIntent(resolvedIntent);
    setPlatform(result.platform);
    setNeedsPlatform(result.needsPlatform);
    setSubmitted(text.trim());
    setPlatformAnswer("");
  }, []);

  const handleSubmit = () => {
    if (!input.trim()) return;
    resolveIntent(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const applyPlatformAnswer = () => {
    if (!platformAnswer.trim()) return;
    const merged = `${submitted} ${platformAnswer}`;
    const detected = detectPlatform(merged);
    if (detected) {
      setPlatform(detected);
      setNeedsPlatform(false);
    }
  };

  const effectiveFormat = platform?.format ?? "4:5";

  return (
    <div className="flex min-w-0 flex-col gap-8 lg:gap-10">
      {/* ── Command Center ── */}
      <section className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: PREVIEW_META }}>
          {variant === "agent" ? c.agentOverline : c.overline}
        </p>
        <h1
          className="mt-3 max-w-3xl text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.02em]"
          style={{ color: PREVIEW_DARK, ...PREVIEW_HL }}
        >
          {c.headline}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: PREVIEW_SUBLINE }}>
          {c.subline}
        </p>

        <div
          className="relative mt-8 overflow-hidden rounded border transition-shadow"
          style={{
            borderColor: focused ? PREVIEW_ACCENT : PREVIEW_LIGHT_BORDER,
            background: PREVIEW_SURFACE_DARK,
            boxShadow: focused ? "0 0 0 1px rgba(180,255,0,0.35)" : "none",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={c.inputPlaceholder}
            className="w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-relaxed text-neutral-100 placeholder:text-neutral-500 focus:outline-none sm:px-5 sm:py-5 sm:text-[16px]"
          />
          <div
            className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-[11px] text-neutral-500">{c.enterHint}</p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-full rounded py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-40 sm:w-auto sm:px-6"
              style={{ background: PREVIEW_ACCENT, color: PREVIEW_DARK }}
            >
              {c.submitCta}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
            {c.examplesLabel}
          </span>
          {c.examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setInput(ex);
                resolveIntent(ex);
              }}
              className="rounded border px-2.5 py-1 text-left text-[12px] transition-colors hover:bg-white/60"
              style={{ borderColor: PREVIEW_LIGHT_BORDER, color: PREVIEW_BODY }}
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      {/* ── Platform ask ── */}
      {needsPlatform && submitted && (
        <div
          className="rounded border p-4 sm:p-5"
          style={{ borderColor: PREVIEW_LIGHT_BORDER, background: "rgba(180,255,0,0.06)" }}
        >
          <p className="text-[14px] font-medium" style={{ color: PREVIEW_DARK }}>
            {c.platformQuestion}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={platformAnswer}
              onChange={(e) => setPlatformAnswer(e.target.value)}
              placeholder={c.platformPlaceholder}
              className="min-w-0 flex-1 rounded border bg-white/70 px-3 py-2 text-[14px] outline-none"
              style={{ borderColor: PREVIEW_LIGHT_BORDER }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyPlatformAnswer();
              }}
            />
            <button
              type="button"
              onClick={applyPlatformAnswer}
              className="shrink-0 rounded px-4 py-2 text-[13px] font-semibold"
              style={{ background: PREVIEW_DARK, color: "#fff" }}
            >
              {c.platformApply}
            </button>
          </div>
        </div>
      )}

      {/* ── Workflow + Preview ── */}
      {intent && submitted && (
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,340px)] xl:gap-8">
          <PreviewWorkflowPanel
            intent={intent}
            originalPrompt={submitted}
            platform={platform}
            onGenerate={() => setPreviewGenerating(true)}
            onGenerateComplete={() => setPreviewGenerating(false)}
          />
          <PreviewLivePreview
            intent={intent}
            format={effectiveFormat}
            generating={previewGenerating}
          />
        </div>
      )}

      {/* ── Flow hint when idle ── */}
      {!submitted && (
        <div
          className="grid gap-4 border-t pt-8 sm:grid-cols-3"
          style={{ borderColor: PREVIEW_LIGHT_BORDER }}
        >
          {c.flowSteps.map((step) => (
            <div key={step.num} className="min-w-0">
              <span className="font-mono text-[10px]" style={{ color: PREVIEW_ACCENT }}>
                {step.num}
              </span>
              <p className="mt-1 text-[14px] font-semibold" style={{ color: PREVIEW_DARK, ...PREVIEW_HL }}>
                {step.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: PREVIEW_BODY }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      <PreviewNextActions onNavigate={onNavigate} />
    </div>
  );
}
