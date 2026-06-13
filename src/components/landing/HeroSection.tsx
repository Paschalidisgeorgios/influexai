"use client";

import { useState, useEffect, type FormEvent } from "react";
import { IntentLink } from "@/hooks/useIntentTracking";
import { Hero3DScene } from "./Hero3DScene";
import { applyThemeToRoot, getLandingTheme } from "@/hooks/useTheme";

const HERO_RGB = "180,255,0";

export function HeroSection() {
  const [name, setName] = useState("");
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    applyThemeToRoot(getLandingTheme("green"));
  }, []);

  const handleNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) return;

    setHasSubmittedName(true);
    setAiText(`Willkommen, ${cleanName}. InfluexAI Studio wird initialisiert...`);
    setIsPulsing(true);

    window.setTimeout(() => {
      setIsPulsing(false);
    }, 2500);
  };

  return (
    <section
      className={`relative flex min-h-screen items-center overflow-hidden bg-transparent transition-transform duration-300 ${
        isPulsing ? "scale-[1.004]" : "scale-100"
      }`}
    >
      <Hero3DScene rgb={HERO_RGB} />

      <div className="relative z-20 w-full px-5 pt-10 pb-16 sm:px-8 md:px-[max(2rem,7vw)] lg:px-[max(3rem,9vw)]">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:max-w-[min(520px,36vw)] md:text-left lg:max-w-[min(560px,34vw)]">
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
              className="rounded-full px-7 py-3 text-sm font-semibold text-[#08080a] transition-all duration-200"
              style={{
                background: "#B4FF00",
                boxShadow: "0 4px 24px rgba(180,255,0,0.3)",
              }}
            >
              Studio starten →
            </IntentLink>
            <a
              href="#bento-features"
              className="rounded-full border border-white/12 px-6 py-3 text-sm text-white/45 no-underline transition-colors duration-200 hover:border-white/30 hover:text-white/80"
            >
              Demo ansehen
            </a>
          </div>

          <div
            className="mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em] md:justify-start"
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

          <form
            onSubmit={handleNameSubmit}
            className="relative z-20 mt-8 w-full max-w-xl md:max-w-none"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-lime-400/30 bg-black/50 p-2 shadow-[0_0_30px_rgba(163,255,18,0.15)] backdrop-blur-xl">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name hier..."
                disabled={hasSubmittedName}
                autoComplete="name"
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40 disabled:opacity-50"
                style={{ cursor: hasSubmittedName ? "default" : "text" }}
              />
              <button
                type="submit"
                disabled={hasSubmittedName || !name.trim()}
                aria-label="Namen senden"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-black transition hover:bg-lime-300 disabled:opacity-40"
                style={{ cursor: "default" }}
              >
                ↵
              </button>
            </div>

            <p className="mt-2 text-left text-xs text-white/30">
              {hasSubmittedName ? "Name gespeichert" : "Enter zum Senden"}
            </p>

            {hasSubmittedName && aiText && (
              <div
                className="mt-4 rounded-full border border-lime-400/30 bg-black/40 px-5 py-3 text-xs font-mono tracking-[0.25em] text-lime-300 uppercase backdrop-blur-xl"
                role="status"
              >
                {aiText}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
