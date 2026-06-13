"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { IntentLink, useIntentTracking } from "@/hooks/useIntentTracking";
import { AssetLoadingShader } from "@/components/canvas/AssetLoadingShader";
import {
  CONCIERGE_TOOL_ROUTES,
  type ConciergeToolId,
} from "@/lib/claude-concierge";
import { LandingHeroBackground } from "./LandingHeroBackground";
import { LANDING_HERO_2026 } from "@/lib/landing-copy-2026";
import "@/styles/canvas.css";

const CONCIERGE_PLACEHOLDER =
  "Frag unser Studio-Gehirn (z.B. Wie erstelle ich Content für meine Modemarke?)...";

type ConciergeState = {
  answer: string;
  tool: ConciergeToolId;
} | null;

export function HeroSection() {
  const { setIntent, getIntentHref } = useIntentTracking();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConciergeState>(null);
  const [error, setError] = useState<string | null>(null);
  const progressTimer = useRef<number | null>(null);

  const stopProgress = useCallback(() => {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    setProgress(6);
    progressTimer.current = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 8 + 4));
    }, 260);
  }, [stopProgress]);

  useEffect(() => () => stopProgress(), [stopProgress]);

  useEffect(() => {
    if (result) {
      setIntent(CONCIERGE_TOOL_ROUTES[result.tool].intent);
    }
  }, [result, setIntent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    startProgress();

    try {
      const res = await fetch("/api/generate/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        answer?: string;
        tool?: ConciergeToolId;
        error?: string;
      };

      if (!res.ok || !data.success || !data.answer || !data.tool) {
        setError(data.error ?? "Berater nicht erreichbar. Bitte erneut versuchen.");
        return;
      }

      setProgress(100);
      setResult({ answer: data.answer, tool: data.tool });
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      stopProgress();
      setLoading(false);
    }
  };

  const ctaRoute = result ? CONCIERGE_TOOL_ROUTES[result.tool] : null;
  const ctaHref = ctaRoute ? getIntentHref(ctaRoute.href) : "/signup";

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#030304]">
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
            onSubmit={(e) => void handleSubmit(e)}
            className="relative z-20 mt-8 w-full max-w-xl md:max-w-none"
          >
            <div className="landing-neon-input-wrap">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={CONCIERGE_PLACEHOLDER}
                disabled={loading}
                autoComplete="off"
                maxLength={400}
                aria-label="Frage an das Studio-Gehirn"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                aria-label="Frage senden"
                className="landing-neon-input-submit"
              >
                ↵
              </button>
            </div>

            <p className="mt-2 text-left text-xs text-white/50">
              {loading ? "KI-Berater analysiert…" : "Enter — Antwort in Sekunden"}
            </p>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="shader"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 overflow-hidden"
                >
                  <AssetLoadingShader
                    progress={progress}
                    label="Studio-Gehirn"
                    accent="green"
                    className="h-[100px] rounded-xl"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-left text-xs leading-relaxed text-red-400/90"
                >
                  {error}
                </motion.p>
              ) : null}

              {result ? (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-4 rounded-xl border border-zinc-800/70 bg-zinc-950/50 p-4 backdrop-blur-md"
                >
                  <p
                    className="text-left text-sm leading-relaxed text-white/85"
                    style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                  >
                    {result.answer}
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.35 }}
                    className="mt-4"
                  >
                    <IntentLink
                      href={ctaHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ccff00] px-4 py-3 text-sm font-bold text-black no-underline transition-transform hover:scale-[1.02] sm:w-auto"
                      onClick={() => {
                        if (ctaRoute) setIntent(ctaRoute.intent);
                      }}
                    >
                      Dieses Tool jetzt im unendlichen Canvas testen
                      <ArrowRight size={15} aria-hidden />
                    </IntentLink>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </section>
  );
}
