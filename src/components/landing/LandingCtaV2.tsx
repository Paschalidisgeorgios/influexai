"use client";

import { ArrowRight } from "lucide-react";
import { IntentLink } from "@/hooks/useIntentTracking";

type LandingCtaV2Props = {
  reveal?: boolean;
};

export function LandingCtaV2({ reveal = true }: LandingCtaV2Props) {
  return (
    <section
      className="relative overflow-hidden border-y border-zinc-800/50 px-4 py-20 text-center sm:px-10 sm:py-24"
      style={{
        opacity: reveal ? 1 : 0,
        transform: reveal ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <div className="landing-glass-dot-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 50% 60% at 15% 50%, rgba(139,93,255,0.08), transparent 70%),
            radial-gradient(ellipse 45% 55% at 85% 40%, rgba(204,255,0,0.07), transparent 70%)
          `,
        }}
      />

      <div className="relative z-10">
        <h2 className="landing-glass-heading text-[clamp(2rem,7vw,3.25rem)] text-white">
          BEREIT{" "}
          <span className="text-[#ccff00]">LOSZULEGEN?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-white/60">
          Starte jetzt und erstelle deine ersten Inhalte direkt im Studio.
        </p>
        <IntentLink href="/signup" className="landing-glass-btn-cta mt-8 h-14 px-10 text-lg">
          Jetzt kostenlos starten
          <ArrowRight size={18} aria-hidden />
        </IntentLink>
        <p className="mt-4 text-xs text-white/45">Flexible Pläne · Monatlich kündbar</p>
      </div>
    </section>
  );
}
