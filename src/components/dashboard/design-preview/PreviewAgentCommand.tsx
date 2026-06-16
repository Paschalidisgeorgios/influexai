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
const SURFACE = "#0e0e16";
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
      <span className="text-neutral-300">{text || "\u200B"}</span>
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
  /** elevated = sits on ivory stage with strong shadow */
  elevated?: boolean;
}

export function PreviewAgentCommand({
  onNavigate,
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
        boxShadow:  `0 0 0 4px rgba(180,255,0,0.12), 0 0 40px rgba(180,255,0,0.20), 0 0 80px rgba(180,255,0,0.08), inset 0 0 24px rgba(180,255,0,0.04)`,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }
    : {
        border:     "1px solid rgba(255,255,255,0.14)",
        boxShadow:  elevated
          ? "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.20)"
          : "0 8px 32px rgba(0,0,0,0.25)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      };

  return (
    <div className="w-full">
      {!compact && (
        <div className="mb-10">
          <p className="mb-4 font-mono text-[12px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.45)" }}>
            {ta.overline}
          </p>
          <h1
            className="mb-4 text-4xl font-extrabold leading-[1.05] md:text-6xl lg:text-[64px]"
            style={{ ...HL, color: "#080808", letterSpacing: "-0.03em" }}
          >
            {ta.headline.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < ta.headline.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="max-w-lg text-[16px] leading-[1.6]" style={{ color: "rgba(8,8,8,0.58)" }}>
            {ta.subline}
          </p>
        </div>
      )}

      <div className="relative">
        {/* Atmospheric glow */}
        <div
          className="pointer-events-none absolute -inset-8 -z-0 rounded-lg"
          style={{
            background: isActive || isLoading
              ? `radial-gradient(ellipse 90% 70% at 50% 100%, rgba(180,255,0,0.14) 0%, rgba(80,60,220,0.08) 50%, transparent 75%)`
              : "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(180,255,0,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Loading spinner wrapper */}
        <div
          className={isLoading ? "relative overflow-hidden rounded-sm p-[3px]" : "relative rounded-sm"}
        >
          {isLoading && (
            <div
              className="absolute animate-spin rounded-sm"
              style={{
                top: "-60%", left: "-60%",
                width: "220%", height: "220%",
                background: `conic-gradient(from 0deg, transparent 0%, ${ACCENT} 12%, ${ACCENT2} 24%, rgba(180,255,0,0.5) 36%, transparent 50%)`,
                animationDuration: "1.2s",
              }}
            />
          )}

          {/* Command surface */}
          <div
            className="relative overflow-hidden rounded-sm"
            style={{ background: SURFACE, ...(isLoading ? {} : idleBorder) }}
          >
            {/* Top accent when idle */}
            {!isLoading && !isActive && (
              <div className="h-[2px] w-full" style={{
                background: `linear-gradient(90deg, transparent, ${ACCENT}44, transparent)`,
              }} />
            )}

            <div className="relative px-6 py-5 md:px-8 md:py-6">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsActive(true)}
                onBlur={() => { if (!input) setIsActive(false); }}
                onKeyDown={handleKeyDown}
                rows={compact ? 3 : 4}
                disabled={isLoading}
                placeholder=""
                className="relative z-10 w-full resize-none bg-transparent text-[16px] leading-[1.65] text-neutral-100 outline-none placeholder:text-neutral-500 disabled:opacity-60 md:text-[17px]"
              />
              {!input && (
                <div
                  className="pointer-events-none absolute left-6 top-5 z-0 text-[16px] leading-[1.65] md:left-8 md:top-6 md:text-[17px]"
                  aria-hidden
                >
                  <TypewriterText prompts={ta.prompts} visible={!input && !isLoading} />
                </div>
              )}
            </div>

            {/* Action bar */}
            <div
              className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)" }}
            >
              <div className="flex flex-wrap gap-2">
                {ta.quickActions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleQuickAction(label)}
                    className="rounded-full border px-3.5 py-2 font-mono text-[11px] tracking-wide transition-all hover:border-white/25 hover:bg-white/[0.08]"
                    style={{
                      borderColor: "rgba(255,255,255,0.14)",
                      color: "rgba(255,255,255,0.75)",
                      background: "rgba(255,255,255,0.05)",
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
                className="shrink-0 px-8 py-3 font-mono text-[12px] font-bold tracking-[0.12em] uppercase transition-all disabled:opacity-50"
                style={{
                  background: input.trim() && !isLoading ? ACCENT : "rgba(255,255,255,0.08)",
                  color:      input.trim() && !isLoading ? "#000" : "rgba(255,255,255,0.35)",
                  border:     input.trim() ? "none" : "1px solid rgba(255,255,255,0.10)",
                  boxShadow:  input.trim() && !isLoading ? `0 0 24px rgba(180,255,0,0.35)` : "none",
                }}
              >
                {isLoading ? ta.generating : ta.generate}
              </button>
            </div>
          </div>
        </div>

        {/* Status / hint row */}
        <div className="mt-3 flex min-h-[20px] items-center gap-2">
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
            <span className="font-mono text-[11px] text-neutral-400">
              {ta.enterHint}
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="shrink-0 font-mono text-[11px] tracking-[0.1em] uppercase" style={{ color: "rgba(8,8,8,0.40)" }}>
            {ta.promptsLabel}
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ta.prompts.slice(0, 3).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setInput(p); setIsActive(true); }}
                className="text-left text-[13px] leading-[1.5] transition-colors hover:text-neutral-900"
                style={{ color: "rgba(8,8,8,0.50)" }}
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
