"use client";

/**
 * PreviewAgentCommand — High-contrast Command Center.
 * Typewriter · Lime focus · Spinning loading border · Enter mock-generate.
 * MOCK — no API calls. Isolated to /dashboard/design-preview.
 */

import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { useLang, type PreviewView } from "./PreviewLang";

const ACCENT  = "#b4ff00";
const ACCENT2 = "#ccff00";
const DARK    = "#080808";
const BODY    = "rgba(8,8,8,0.68)";
const META    = "rgba(8,8,8,0.42)";
const SURFACE = "#0a0a10";
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── Typewriter ───────────────────────────────────────────────────────────────

function TypewriterText({ prompts, visible }: { prompts: string[]; visible: boolean }) {
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const [idx, setIdx]       = useState(0);
  const [text, setText]     = useState("");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 480);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!visible || !prompts.length) return;
    const target = prompts[idx % prompts.length] ?? "";

    if (phase === "typing") {
      if (text.length >= target.length) {
        const t = setTimeout(() => setPhase("pause"), 2600);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setText(target.slice(0, text.length + 1)), 42);
      return () => clearTimeout(t);
    }
    if (phase === "pause") {
      const t = setTimeout(() => setPhase("erasing"), 100);
      return () => clearTimeout(t);
    }
    if (text.length === 0) {
      setIdx((i) => (i + 1) % prompts.length);
      setPhase("typing");
      return;
    }
    const t = setTimeout(() => setText(text.slice(0, -1)), 20);
    return () => clearTimeout(t);
  }, [text, phase, idx, prompts, visible]);

  return (
    <>
      <span className="text-neutral-400">{text || "\u200B"}</span>
      <span
        className="inline-block align-bottom"
        style={{
          width: "2px",
          height: "1.15em",
          background: cursor ? ACCENT : "transparent",
          marginLeft: "2px",
          verticalAlign: "text-bottom",
          boxShadow: cursor ? `0 0 8px ${ACCENT}` : "none",
        }}
      />
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (v: PreviewView) => void;
  compact?: boolean;
  showEnterHint?: boolean;
  elevated?: boolean;
}

export function PreviewAgentCommand({
  onNavigate: _onNavigate,
  compact = false,
  showEnterHint = false,
  elevated = false,
}: Props) {
  const { t } = useLang();
  const ta = t.agent;

  const [input,     setInput    ] = useState("");
  const [isActive,  setIsActive ] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) { setStatusIdx(0); return; }
    const iv = setInterval(() => setStatusIdx((i) => (i + 1) % ta.statusMessages.length), 600);
    return () => clearInterval(iv);
  }, [isLoading, ta.statusMessages]);

  const handleGenerate = useCallback(() => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }, [input, isLoading]);

  const QUICK_PROMPTS: Record<string, string> = {
    "Bild erstellen":   "Erstelle ein Premium-Produktbild für meine Kampagne",
    "Video erstellen":  "Erstelle ein TikTok-Video für mein Produkt",
    "Kampagne starten": "Schreibe mir eine Kampagne für ein Restaurant",
    "Hook schreiben":   "Mache 5 Hooks für eine Beauty-Kampagne",
    "Avatar erstellen": "Erstelle einen Talking-Avatar für mein Brand-Video",
    "Create image":     "Create a premium product image for my campaign",
    "Create video":     "Create a TikTok video for my product",
    "Start campaign":   "Build a campaign for a restaurant",
    "Write hook":       "Write 5 hooks for a beauty campaign",
    "Create avatar":    "Create a talking avatar for my brand video",
  };

  const handleQuickAction = (label: string) => {
    setInput(QUICK_PROMPTS[label] ?? label);
    setIsActive(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const idleBorder = isActive
    ? {
        border:     `2px solid ${ACCENT}`,
        boxShadow:  `0 0 0 4px rgba(180,255,0,0.12), 0 0 48px rgba(180,255,0,0.22), 0 0 96px rgba(180,255,0,0.08), inset 0 0 28px rgba(180,255,0,0.04)`,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }
    : {
        border:     "1px solid rgba(255,255,255,0.10)",
        boxShadow:  elevated
          ? "0 28px 72px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)"
          : "0 12px 40px rgba(0,0,0,0.28)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      };

  return (
    <div className="w-full py-2 md:py-4">
      {!compact && (
        <div className="mb-12 md:mb-14">
          <p className="mb-5 font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: META }}>
            {ta.overline}
          </p>
          <h1
            className="mb-5 text-[2rem] font-extrabold leading-[1.06] sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ ...HL, color: DARK, letterSpacing: "-0.03em", fontWeight: 800 }}
          >
            {ta.headline.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < ta.headline.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="max-w-xl text-[16px] leading-[1.7] md:text-[17px]" style={{ color: BODY }}>
            {ta.subline}
          </p>
        </div>
      )}

      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-6 -z-0 rounded-lg md:-inset-10"
          style={{
            background: isActive || isLoading
              ? `radial-gradient(ellipse 95% 75% at 50% 100%, rgba(180,255,0,0.16) 0%, rgba(80,60,220,0.08) 50%, transparent 78%)`
              : "radial-gradient(ellipse 85% 65% at 50% 100%, rgba(180,255,0,0.07) 0%, transparent 72%)",
          }}
        />

        <div className={isLoading ? "relative overflow-hidden rounded-md p-[3px]" : "relative rounded-md"}>
          {isLoading && (
            <div
              className="absolute animate-spin rounded-md"
              style={{
                top: "-60%", left: "-60%",
                width: "220%", height: "220%",
                background: `conic-gradient(from 0deg, transparent 0%, ${ACCENT} 12%, ${ACCENT2} 24%, rgba(180,255,0,0.5) 36%, transparent 50%)`,
                animationDuration: "1.2s",
              }}
            />
          )}

          <div
            className="relative overflow-hidden rounded-md"
            style={{ background: SURFACE, ...(isLoading ? {} : idleBorder) }}
          >
            {!isLoading && (
              <div
                className="h-[2px] w-full"
                style={{
                  background: isActive
                    ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT}66, transparent 80%)`
                    : `linear-gradient(90deg, transparent 10%, ${ACCENT}55 50%, transparent 90%)`,
                }}
              />
            )}

            {/* Command header strip */}
            <div
              className="flex items-center justify-between border-b px-6 py-3.5 md:px-9"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.20)" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/22" />
                <span className="h-2 w-2 rounded-full bg-white/12" />
                <span className="h-2 w-2 rounded-full bg-white/08" />
                <span className="ml-2 font-mono text-[10px] tracking-[0.14em] uppercase text-neutral-500">
                  Agent Command
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-neutral-500">
                {t.mock}
              </span>
            </div>

            <div className="relative px-6 py-7 md:px-9 md:py-8">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsActive(true)}
                onBlur={() => { if (!input) setIsActive(false); }}
                onKeyDown={handleKeyDown}
                rows={compact ? 3 : 4}
                disabled={isLoading}
                placeholder=""
                className="relative z-10 min-h-[88px] w-full resize-none bg-transparent text-[17px] leading-[1.7] text-neutral-100 outline-none placeholder:text-neutral-500 disabled:opacity-60 md:min-h-[104px] md:text-[18px]"
              />
              {!input && (
                <div
                  className="pointer-events-none absolute left-6 top-7 z-0 text-[17px] leading-[1.7] md:left-9 md:top-8 md:text-[18px]"
                  aria-hidden
                >
                  <TypewriterText prompts={ta.prompts} visible={!input && !isLoading} />
                </div>
              )}
            </div>

            <div
              className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-9 md:py-6"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.30)" }}
            >
              <div className="flex flex-wrap gap-2">
                {ta.quickActions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleQuickAction(label)}
                    className="rounded-sm border px-4 py-2.5 font-mono text-[11px] tracking-[0.08em] transition-all hover:border-white/22 hover:bg-white/[0.07]"
                    style={{
                      borderColor: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.82)",
                      background: "rgba(255,255,255,0.04)",
                      minHeight: "44px",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || !input.trim()}
                className="shrink-0 rounded-sm px-10 py-3.5 font-mono text-[12px] font-bold tracking-[0.14em] uppercase transition-all disabled:opacity-50"
                style={{
                  background: input.trim() && !isLoading ? ACCENT : "rgba(255,255,255,0.07)",
                  color:      input.trim() && !isLoading ? DARK   : "rgba(255,255,255,0.38)",
                  border:     input.trim() ? "none" : "1px solid rgba(255,255,255,0.10)",
                  boxShadow:  input.trim() && !isLoading ? `0 0 32px rgba(180,255,0,0.40), 0 4px 16px rgba(0,0,0,0.20)` : "none",
                  minHeight:  "48px",
                  minWidth:   "140px",
                }}
              >
                {isLoading ? ta.generating : ta.generate}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-[22px] items-center gap-2.5">
          {isLoading && (
            <>
              <span
                className="inline-block h-2 w-2 animate-pulse rounded-full"
                style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
              />
              <span className="font-mono text-[12px] font-medium" style={{ color: ACCENT }}>
                {ta.statusMessages[statusIdx]}
              </span>
            </>
          )}
          {!isLoading && (!compact || showEnterHint) && (
            <span className="font-mono text-[11px] text-neutral-500">
              {ta.enterHint}
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
          <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] uppercase" style={{ color: META }}>
            {ta.promptsLabel}
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {ta.prompts.slice(0, 3).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setInput(p); setIsActive(true); }}
                className="text-left text-[14px] leading-[1.55] transition-colors hover:text-neutral-900"
                style={{ color: BODY, minHeight: "44px" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
