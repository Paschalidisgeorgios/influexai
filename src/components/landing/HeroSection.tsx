"use client";

import { useState, type FormEvent } from "react";
import { IntentLink } from "@/hooks/useIntentTracking";
import { LandingHeroBackground } from "./LandingHeroBackground";

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
    setAiText(`Willkommen, ${cleanName}. Dein Studio ist bereit.`);
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
          <p className="landing-neon-kicker mb-6">AI Campaign Studio · 2026</p>

          <h1 className="landing-glass-heading mb-4 text-[clamp(2rem,6.5vw,4.25rem)] leading-[1.02] text-white">
            DEINE IDEE.
            <br />
            VON{" "}
            <span className="text-[#00d5ff]">KI</span>
            <br />
            ZUR <span className="text-[#ccff00]">KAMPAGNE.</span>
          </h1>

          <p
            className="mb-8 max-w-lg text-base leading-relaxed text-white/65 md:max-w-none"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            InfluexAI unterstützt dich dabei, aus einer Idee in wenigen Schritten
            fertige Social-Media-Assets für Creator, Marken und Agenturen zu erstellen.
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
            className="mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em] text-white/45 md:justify-start"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            <span>20+ KI-Tools</span>
            <span className="hidden h-3 w-px bg-white/10 sm:inline-block" aria-hidden />
            <span>Erste Inhalte in wenigen Sekunden</span>
            <span className="hidden h-3 w-px bg-white/10 sm:inline-block" aria-hidden />
            <span>Monatlich kündbar</span>
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
