"use client";

import { useState, useEffect, useCallback, type KeyboardEvent } from "react";
import { IntentLink } from "@/hooks/useIntentTracking";
import { Hero3DScene } from "./Hero3DScene";
import { applyThemeToRoot, getLandingTheme } from "@/hooks/useTheme";

const DEFAULT_RGB = "180,255,0";

export function HeroSection() {
  const [name, setName] = useState("");
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isPulsing, setIsPulsing] = useState(false);
  const [accentRgb, setAccentRgb] = useState(DEFAULT_RGB);

  useEffect(() => {
    applyThemeToRoot(getLandingTheme("green"));
  }, []);

  const handleNameSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || hasSubmittedName) return;

    setHasSubmittedName(true);
    setAiText(`${trimmed}! Starker Name. Freut mich — dein Studio ist bereit. 🤝`);
    setAccentRgb("40,160,255");
    applyThemeToRoot(getLandingTheme("blue"));
    setIsPulsing(true);
    window.setTimeout(() => setIsPulsing(false), 450);
  }, [name, hasSubmittedName]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  return (
    <section
      className={`relative flex min-h-screen items-center overflow-hidden bg-transparent transition-transform duration-200 ${
        isPulsing ? "scale-[1.003]" : "scale-100"
      }`}
    >
      <Hero3DScene rgb={accentRgb} />

      <div className="relative z-20 w-full px-5 pt-12 pb-16 sm:px-8 sm:pt-16 md:px-[max(2rem,7vw)] lg:px-[max(3rem,9vw)]">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:max-w-[min(520px,36vw)] md:text-left lg:max-w-[min(560px,34vw)]">
          <p
            className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] tracking-[2px] uppercase backdrop-blur-md"
            style={{
              background: `rgba(${accentRgb},0.07)`,
              borderColor: `rgba(${accentRgb},0.2)`,
              color: `rgba(${accentRgb},0.65)`,
            }}
          >
            AI CAMPAIGN STUDIO · 2026
          </p>

          <h1
            className="mb-4 font-bold leading-[1.04] tracking-tight text-white"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(28px, 6.5vw, 72px)",
              letterSpacing: "0.02em",
              textShadow: "0 2px 40px rgba(0,0,0,0.95)",
            }}
          >
            DEINE IDEE.
            <br />
            VON KI
            <br />
            ZUR{" "}
            <span
              style={{
                color: "#B4FF00",
                textShadow: "0 0 30px rgba(180,255,0,0.35)",
              }}
            >
              KAMPAGNE.
            </span>
          </h1>

          <p
            className="mb-7 max-w-lg text-base leading-relaxed md:max-w-none"
            style={{
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              fontSize: "16px",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Vom ersten Hook bis zum fertigen Video: InfluexAI plant, schreibt und
            erstellt Social-Media-Assets für Creator, Marken und Agenturen.
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <IntentLink
              href="/dashboard"
              className="rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: `rgb(${accentRgb})`,
                color: "#08080a",
                boxShadow: `0 4px 24px rgba(${accentRgb},0.3)`,
              }}
            >
              Studio starten →
            </IntentLink>
            <a
              href="#bento-features"
              className="rounded-full border border-white/12 px-6 py-3 text-sm text-white/45 no-underline transition-all duration-200 hover:border-white/30 hover:text-white/80"
            >
              Demo ansehen
            </a>
          </div>

          <div
            className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em] md:justify-start"
            style={{
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <span>20+ Tools</span>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <span>30s Bis zum ersten Content</span>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <span>Kein Abo-Trick · Monatlich kündbar</span>
          </div>

          <div className="w-full max-w-md md:max-w-none">
            <label
              htmlFor="hero-name-input"
              className="mb-2 block text-left text-[11px] font-medium tracking-wider text-white/40 uppercase"
            >
              Wie heißt du?
            </label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-[rgba(8,8,10,0.72)] backdrop-blur-md">
              <input
                id="hero-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Dein Name"
                disabled={hasSubmittedName}
                autoComplete="name"
                className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-60"
                style={{ cursor: hasSubmittedName ? "default" : "text" }}
              />
              <button
                type="button"
                onClick={handleNameSubmit}
                disabled={hasSubmittedName || !name.trim()}
                className="shrink-0 border-l border-white/10 px-5 text-xs font-semibold transition-opacity disabled:opacity-40"
                style={{
                  background: `rgb(${accentRgb})`,
                  color: "#08080a",
                  cursor: "default",
                }}
                aria-label="Name bestätigen"
              >
                Enter ↵
              </button>
            </div>
            <p className="mt-2 text-left text-[10px] tracking-wide text-white/20">
              {hasSubmittedName ? "Name gespeichert" : "Enter zum Bestätigen"}
            </p>

            {hasSubmittedName && aiText && (
              <p
                className="mt-4 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-left text-sm leading-relaxed backdrop-blur-sm"
                style={{
                  color: `rgba(${accentRgb},0.9)`,
                  fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                }}
                role="status"
              >
                {aiText}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
