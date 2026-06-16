"use client";

/**
 * PreviewAgentCommand — Premium AI Command Center.
 *
 * Features:
 *   • Typewriter-animated example prompts (type → pause → erase → next)
 *   • Active lime glow: 2px border + outer glow on focus
 *   • Loading: spinning conic-gradient border (Tailwind animate-spin, 1.4s)
 *   • Enter key starts mock generation (Shift+Enter = newline)
 *   • Sequential status messages during loading
 *   • Atmospheric glow behind the command surface
 *
 * MOCK — no API calls, no credits, no assets saved.
 * Isolated to /dashboard/design-preview.
 */

import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { useLang, type PreviewView } from "./PreviewLang";

// ─── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#b4ff00";
const SURFACE = "#0c0c14";   // command surface: dark blue-black, distinct from page bg
const HL: React.CSSProperties = {
  fontFamily: "var(--font-preview-headline, var(--font-dm-sans, sans-serif))",
};

// ─── TypewriterText ───────────────────────────────────────────────────────────

/**
 * Cycles through `prompts` with a typewriter animation:
 * type (46ms/char) → pause 2.8s → erase (22ms/char) → next prompt.
 * Shows a blinking lime cursor.
 *
 * Rendered as an overlay on top of the empty textarea so it
 * disappears naturally once the user starts typing.
 */
function TypewriterText({ prompts, visible }: { prompts: string[]; visible: boolean }) {
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const [idx, setIdx]         = useState(0);
  const [text, setText]       = useState("");
  const [cursor, setCursor]   = useState(true);

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(t);
  }, []);

  // Typewriter state machine
  useEffect(() => {
    if (!visible || !prompts.length) return;
    const target = prompts[idx % prompts.length] ?? "";

    if (phase === "typing") {
      if (text.length >= target.length) {
        const t = setTimeout(() => setPhase("pause"), 2800);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setText(target.slice(0, text.length + 1)), 46);
      return () => clearTimeout(t);
    }

    if (phase === "pause") {
      const t = setTimeout(() => setPhase("erasing"), 120);
      return () => clearTimeout(t);
    }

    // erasing
    if (text.length === 0) {
      setIdx((i) => (i + 1) % prompts.length);
      setPhase("typing");
      return;
    }
    const t = setTimeout(() => setText(text.slice(0, -1)), 22);
    return () => clearTimeout(t);
  }, [text, phase, idx, prompts, visible]);

  return (
    <>
      <span className="text-neutral-500">{text || "\u200B"}</span>
      {/* Lime blinking cursor */}
      <span
        className="inline-block align-bottom"
        style={{
          width: "2px",
          height: "1.1em",
          background: cursor ? ACCENT : "transparent",
          marginLeft: "1px",
          verticalAlign: "text-bottom",
        }}
      />
    </>
  );
}

// ─── PreviewAgentCommand ──────────────────────────────────────────────────────

interface Props {
  onNavigate: (v: PreviewView) => void;
  /** compact = used inline in Studio Home (no page-level headline/subline) */
  compact?: boolean;
}

export function PreviewAgentCommand({ onNavigate, compact = false }: Props) {
  const { t } = useLang();
  const ta = t.agent;

  const [input,       setInput      ] = useState("");
  const [isActive,    setIsActive   ] = useState(false);
  const [isLoading,   setIsLoading  ] = useState(false);
  const [statusIdx,   setStatusIdx  ] = useState(0);

  // Status message cycle during loading
  useEffect(() => {
    if (!isLoading) { setStatusIdx(0); return; }
    const msgs = ta.statusMessages;
    const iv = setInterval(() => setStatusIdx((i) => (i + 1) % msgs.length), 650);
    return () => clearInterval(iv);
  }, [isLoading, ta.statusMessages]);

  // Mock generate: 1.8s spinning border, then reset
  // MOCK — no API call, no credits, no assets saved
  const handleGenerate = useCallback(() => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1800);
  }, [input, isLoading]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // ── Computed styles ────────────────────────────────────────────────────────

  // Outer wrapper: normal or loading (for spinning border effect)
  const outerCls = isLoading
    ? "relative overflow-hidden p-[2px]"
    : "relative";

  const borderStyle: React.CSSProperties = isLoading
    ? {}
    : isActive
    ? {
        border:     "2px solid rgba(180,255,0,0.82)",
        boxShadow:  "0 0 0 6px rgba(180,255,0,0.05), 0 0 50px rgba(180,255,0,0.13), inset 0 0 30px rgba(180,255,0,0.03)",
        transition: "border-color 0.18s, box-shadow 0.18s",
      }
    : {
        border:     "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.18s, box-shadow 0.18s",
      };

  return (
    <div className={compact ? "w-full" : "w-full"}>

      {/* ── Non-compact: headline + subline ─────────────────────────────── */}
      {!compact && (
        <div className="mb-10">
          <p className="mb-5 font-mono text-[10px] tracking-[0.28em] uppercase text-neutral-700">
            {ta.overline}
          </p>
          <h1
            className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-[68px]"
            style={{ ...HL, letterSpacing: "-0.03em" }}
          >
            {ta.headline.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < ta.headline.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="max-w-lg text-[15px] leading-[1.6] text-neutral-400">
            {ta.subline}
          </p>
        </div>
      )}

      {/* ── Atmospheric glow behind the command surface ──────────────────── */}
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-10 -z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(180,255,0,0.05) 0%, rgba(80,60,220,0.07) 45%, transparent 72%)",
          }}
        />

        {/* ── Command surface wrapper (handles border states) ──────────── */}
        <div className={outerCls} style={{ zIndex: 1 }}>

          {/* Spinning conic-gradient border during loading */}
          {isLoading && (
            <div
              className="absolute animate-spin"
              style={{
                top: "-50%", left: "-50%",
                width: "200%", height: "200%",
                background:
                  "conic-gradient(from 0deg, transparent 0%, rgba(180,255,0,0.92) 18%, rgba(180,255,0,0.45) 36%, transparent 54%)",
                animationDuration: "1.4s",
              }}
            />
          )}

          {/* Inner command surface */}
          <div
            className="relative"
            style={{ background: SURFACE, ...borderStyle }}
            onFocus={() => setIsActive(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                if (!input) setIsActive(false);
              }
            }}
          >
            {/* Textarea + typewriter overlay */}
            <div className="relative px-7 py-6">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsActive(true)}
                onBlur={() => { if (!input) setIsActive(false); }}
                onKeyDown={handleKeyDown}
                rows={compact ? 2 : 3}
                disabled={isLoading}
                placeholder=""
                className="relative z-10 w-full resize-none bg-transparent text-[15px] leading-[1.65] text-white outline-none disabled:opacity-50"
              />
              {/* Typewriter — shown only when input is empty */}
              {!input && (
                <div
                  className="pointer-events-none absolute left-7 top-6 z-0 text-[15px] leading-[1.65]"
                  aria-hidden
                >
                  <TypewriterText prompts={ta.prompts} visible={!input} />
                </div>
              )}
            </div>

            {/* Action bar */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-7 py-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {ta.quickActions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onNavigate("tools")}
                    className="rounded-sm border border-white/[0.07] px-3 py-1.5 font-mono text-[10px] tracking-wide text-neutral-500 transition-all hover:border-white/[0.14] hover:text-neutral-200"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Generate CTA */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="shrink-0 px-6 py-2.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-all disabled:opacity-60"
                style={{
                  background: input.trim() ? ACCENT : "rgba(255,255,255,0.05)",
                  color:      input.trim() ? "#000"  : "rgba(255,255,255,0.22)",
                  border:     input.trim() ? "none"  : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {isLoading ? ta.generating : ta.generate}
              </button>
            </div>
          </div>
        </div>

        {/* ── Status messages (below surface, during loading) ──────────── */}
        <div className="mt-3 flex h-5 items-center gap-2">
          {isLoading && (
            <>
              <span
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: ACCENT }}
              />
              <span className="font-mono text-[11px]" style={{ color: ACCENT }}>
                {ta.statusMessages[statusIdx]}
              </span>
            </>
          )}
          {!isLoading && !compact && (
            <span className="font-mono text-[10px] text-neutral-800">
              {ta.enterHint}
            </span>
          )}
        </div>
      </div>

      {/* ── "Try:" example prompts ────────────────────────────────────── */}
      {!compact && (
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="shrink-0 pt-0.5 font-mono text-[10px] tracking-[0.22em] uppercase text-neutral-700">
            {ta.promptsLabel}
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {ta.prompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setInput(p); setIsActive(true); }}
                className="text-left text-[12px] leading-[1.6] text-neutral-600 transition-colors hover:text-neutral-200"
              >
                „{p}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
