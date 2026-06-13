"use client";

import { useState, type FormEvent } from "react";
import { IntentLink } from "@/hooks/useIntentTracking";
import { LandingHeroBackground } from "./LandingHeroBackground";
import { LANDING_HERO_2026 } from "@/lib/landing-copy-2026";

export function HeroSection() {
  const [name, setName] = useState("");
  const [hasSubmittedName, setHasSubmittedName] = useState(false);
  const [aiText, setAiText] = useState("");
  const [isPulsing, setIsPulsing] = useState(false);

  const handleNameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) return;

    setHasSubmittedName(true);
    setAiText(LANDING_HERO_2026.welcomeStudio(cleanName));
    setIsPulsing(true);

    window.setTimeout(() => {
      setIsPulsing(false);
    }, 2500);
  };

  return (
    <section
      className={`relative flex min-h-[100svh] items-center overflow-hidden bg-[#030304] transition-transform duration-300 ${
        isPulsing ? "scale-[1.004]" : "scale-100"
      }`}
    >
      <LandingHeroBackground />

      <div className="relative z-20 w-full px-5 pt-24 pb-16 sm:px-8 md:px-[max(2rem,7vw)] lg:px-[max(3rem,9vw)]">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:max-w-[min(560px,38vw)] md:text-left">
          <p className="landing-neon-kicker mb-6 font-mono text-[11px] tracking-[0.14em]">
            {LANDING_HERO_2026.kicker}
          </p>

          <h1 className="landing-glass-heading mb-4 text-[clamp(2rem,6.5vw,4.25rem)] leading-[1.02] text-white">
            {LANDING_HERO_2026.headline.line1}
            <br />
            {LANDING_HERO_2026.headline.line2}
            <br />
            <span className="text-[#ccff00]">{LANDING_HERO_2026.headline.line3}</span>
          </h1>

          <p
            className="mb-8 max-w-lg text-base leading-relaxed text-white/70 md:max-w-none"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {LANDING_HERO_2026.subline}
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <IntentLink href="/signup" className="landing-glass-btn-cta">
              Jetzt kostenlos starten →
            </IntentLink>
            <a href="#bento-features" className="landing-neon-btn-secondary">
              So funktioniert es
            </a>
          </div>

          <div
            className="mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 md:justify-start"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {LANDING_HERO_2026.trust.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-6">
                {index > 0 ? (
                  <span className="hidden h-3 w-px bg-white/10 sm:inline-block" aria-hidden />
                ) : null}
                <span>{item}</span>
              </span>
            ))}
          </div>

          <form
            onSubmit={handleNameSubmit}
            className="relative z-20 mt-8 w-full max-w-xl md:max-w-none"
          >
            <div className="landing-neon-input-wrap">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wie heißt du?"
                disabled={hasSubmittedName}
                autoComplete="name"
                style={{ cursor: hasSubmittedName ? "default" : "text" }}
              />
              <button
                type="submit"
                disabled={hasSubmittedName || !name.trim()}
                aria-label="Namen senden"
                className="landing-neon-input-submit"
              >
                ↵
              </button>
            </div>

            <p className="mt-2 text-left text-xs text-white/50">
              {hasSubmittedName ? "Name gespeichert" : "Enter zum Bestätigen"}
            </p>

            {hasSubmittedName && aiText && (
              <div className="landing-neon-ai-status" role="status">
                {aiText}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
