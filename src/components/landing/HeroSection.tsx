"use client";

import { useState, type FormEvent } from "react";
import { IntentLink } from "@/hooks/useIntentTracking";
import { Hero3DScene } from "./Hero3DScene";
import { LANDING_NEON } from "@/lib/landing-neon-theme";

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
      className={`relative flex min-h-screen items-center overflow-hidden bg-transparent transition-transform duration-300 ${
        isPulsing ? "scale-[1.004]" : "scale-100"
      }`}
    >
      <Hero3DScene />

      <div className="relative z-20 w-full px-5 pt-10 pb-16 sm:px-8 md:px-[max(2rem,7vw)] lg:px-[max(3rem,9vw)]">
        <div className="mx-auto w-full max-w-xl text-center md:mx-0 md:max-w-[min(520px,36vw)] md:text-left lg:max-w-[min(560px,34vw)]">
          <p className="landing-neon-kicker mb-6">AI Campaign Studio · 2026</p>

          <h1
            className="mb-4 font-bold leading-[1.04] tracking-tight"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(28px, 6.5vw, 72px)",
              letterSpacing: "0.02em",
              color: LANDING_NEON.textPrimary,
              textShadow: "0 2px 40px rgba(0,0,0,0.95)",
            }}
          >
            DEINE IDEE.
            <br />
            VON{" "}
            <span
              style={{
                background: `linear-gradient(90deg, ${LANDING_NEON.cyan}, ${LANDING_NEON.blue})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              KI
            </span>
            <br />
            ZUR <span className="landing-neon-headline-accent">KAMPAGNE.</span>
          </h1>

          <p
            className="mb-7 max-w-lg text-base leading-relaxed md:max-w-none"
            style={{
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              fontSize: "16px",
              color: LANDING_NEON.textSecondary,
            }}
          >
            InfluexAI unterstützt dich dabei, aus einer Idee in wenigen Schritten
            fertige Social-Media-Assets für Creator, Marken und Agenturen zu erstellen.
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <IntentLink href="/dashboard" className="landing-neon-btn-primary">
              Studio öffnen →
            </IntentLink>
            <a href="#bento-features" className="landing-neon-btn-secondary">
              So funktioniert es
            </a>
          </div>

          <div
            className="mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em] md:justify-start"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            <span className="landing-neon-stat">20+ KI-Tools</span>
            <span className="landing-neon-stat-divider hidden sm:inline-block" aria-hidden />
            <span className="landing-neon-stat">Erste Inhalte in wenigen Sekunden</span>
            <span className="landing-neon-stat-divider hidden sm:inline-block" aria-hidden />
            <span className="landing-neon-stat">Monatlich kündbar</span>
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

            <p className="mt-2 text-left text-xs text-white/60">
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
