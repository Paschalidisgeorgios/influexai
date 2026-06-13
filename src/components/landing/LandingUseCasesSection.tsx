"use client";

import { Building2, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { LANDING_ACCENT_RGB, type LandingNeonAccent } from "@/lib/landing-neon-theme";
import type { CSSProperties } from "react";

const USE_CASES = [
  { key: "creator", icon: Zap, accent: "green" as LandingNeonAccent },
  { key: "brand", icon: Building2, accent: "blue" as LandingNeonAccent },
  { key: "influencer", icon: Sparkles, accent: "violet" as LandingNeonAccent },
] as const;

function accentStyle(accent: LandingNeonAccent): CSSProperties {
  return { "--section-accent-rgb": LANDING_ACCENT_RGB[accent] } as CSSProperties;
}

export function LandingUseCasesSection() {
  const t = useTranslations("landingPage.useCases");

  return (
    <section
      id="use-cases"
      className="border-t px-4 py-8 md:px-6 md:py-10 lg:px-10 lg:py-16"
      style={{
        borderColor: "var(--border-soft)",
        background: "var(--bg-secondary)",
      }}
      aria-labelledby="use-cases-heading"
    >
      <div className="mx-auto w-full max-w-[1160px]">
        <SpringReveal>
          <p className="landing-neon-section-kicker landing-neon-section-kicker--yellow mb-2 text-center">
            {t("kicker")}
          </p>
          <h2
            id="use-cases-heading"
            className="mb-10 text-center md:mb-12"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(28px, 6vw, 48px)",
              color: "var(--text-primary)",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {t("headline")}
          </h2>
        </SpringReveal>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {USE_CASES.map(({ key, icon: Icon, accent }, i) => (
            <SpringReveal key={key} delay={i * 0.08}>
              <article
                className="landing-neon-use-case-card group flex h-full flex-col rounded-2xl p-8"
                style={accentStyle(accent)}
              >
                <div className="landing-neon-use-case-icon mb-5 flex h-11 w-11 items-center justify-center rounded-lg" aria-hidden>
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3
                  className="mb-1"
                  style={{
                    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                    fontSize: "1.5rem",
                    letterSpacing: "0.02em",
                    lineHeight: 1.1,
                    color: "var(--text-primary)",
                  }}
                >
                  {t(`${key}_title`)}
                </h3>
                <p
                  className="mb-3 text-sm font-semibold text-white/90"
                  style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                >
                  {t(`${key}_subtitle`)}
                </p>
                <p
                  className="mb-5 flex-1 text-sm leading-relaxed"
                  style={{
                    fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                    color: "var(--text-secondary)",
                  }}
                >
                  {t(`${key}_desc`)}
                </p>
                <span
                  className="landing-neon-use-case-pill inline-flex w-fit rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em]"
                  style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                >
                  {t(`${key}_tag`)}
                </span>
              </article>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
