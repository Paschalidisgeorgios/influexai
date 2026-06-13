"use client";

import { ArrowRight } from "lucide-react";
import { IntentLink } from "@/hooks/useIntentTracking";

type LandingCtaV2Props = {
  reveal?: boolean;
};

export function LandingCtaV2({ reveal = true }: LandingCtaV2Props) {
  return (
    <section
      className="landing-neon-cta-section relative overflow-hidden border-y px-4 py-20 text-center sm:px-10 sm:py-24"
      style={{
        opacity: reveal ? 1 : 0,
        transform: reveal ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 50% 60% at 15% 50%, rgba(var(--ai-green-rgb), 0.08), transparent 70%),
            radial-gradient(ellipse 45% 55% at 85% 40%, rgba(var(--ai-blue-rgb), 0.08), transparent 70%),
            radial-gradient(ellipse 40% 50% at 50% 100%, rgba(var(--ai-yellow-rgb), 0.05), transparent 70%)
          `,
        }}
      />

      <div className="relative z-10">
        <h2
          className="font-display text-[clamp(2.5rem,8vw,3.5rem)] tracking-wide text-white"
          style={{ letterSpacing: "0.02em" }}
        >
          BEREIT{" "}
          <span className="landing-neon-headline-accent">LOSZULEGEN?</span>
        </h2>
        <p
          className="mx-auto mt-4 max-w-md text-base"
          style={{ color: "var(--text-secondary)" }}
        >
          Starte heute. Dein erstes Asset ist in 30 Sekunden fertig.
        </p>
        <IntentLink href="/signup" className="landing-neon-btn-primary mt-8 h-14 px-10 text-lg">
          Studio starten
          <ArrowRight size={18} />
        </IntentLink>
        <p className="mt-4 text-xs text-white/30">Keine Kreditkarte nötig</p>
      </div>
    </section>
  );
}
