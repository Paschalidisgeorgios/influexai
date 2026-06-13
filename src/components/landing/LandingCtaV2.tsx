"use client";

import { ArrowRight } from "lucide-react";
import { IntentLink } from "@/hooks/useIntentTracking";

type LandingCtaV2Props = {
  reveal?: boolean;
};

export function LandingCtaV2({ reveal = true }: LandingCtaV2Props) {
  return (
    <section
      className="relative overflow-hidden border-y px-4 py-20 text-center sm:px-10 sm:py-24"
      style={{
        background:
          "linear-gradient(135deg, #0a0a06 0%, #111108 50%, #0a0a06 100%)",
        borderColor: "rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.15)",
        opacity: reveal ? 1 : 0,
        transform: reveal ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <h2
        className="font-display text-[clamp(2.5rem,8vw,3.5rem)] tracking-wide text-white"
        style={{ letterSpacing: "0.02em" }}
      >
        BEREIT LOSZULEGEN?
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base text-white/45">
        Starte heute. Dein erstes Asset ist in 30 Sekunden fertig.
      </p>
      <IntentLink
        href="/signup"
        className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-[10px] px-10 font-display text-lg tracking-wide no-underline transition-all duration-300 hover:brightness-110"
        style={{
          background: "var(--theme-accent)",
          color: "var(--theme-on-accent)",
          boxShadow: "0 4px 28px rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.35)",
        }}
      >
        Studio starten
        <ArrowRight size={18} />
      </IntentLink>
      <p className="mt-4 text-xs text-white/30">Keine Kreditkarte nötig</p>
    </section>
  );
}
