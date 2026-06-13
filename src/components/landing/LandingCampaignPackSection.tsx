"use client";

import { IntentLink } from "@/hooks/useIntentTracking";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { LANDING_NEON } from "@/lib/landing-neon-theme";
import type { CSSProperties } from "react";

const OUTPUT_KEYS = [
  "hooks",
  "script",
  "visuals",
  "motion",
  "captions",
  "plan",
] as const;

const OUTPUT_ACCENTS = [
  LANDING_NEON.greenRgb,
  LANDING_NEON.blueRgb,
  LANDING_NEON.cyanRgb,
  LANDING_NEON.yellowRgb,
  LANDING_NEON.violetRgb,
  LANDING_NEON.magentaRgb,
] as const;

export function LandingCampaignPackSection() {
  const t = useTranslations("landingPage.campaignStudio.pack");

  return (
    <section
      id="campaign-pack"
      className="border-y px-4 py-16 md:px-10 md:py-20"
      style={{
        borderColor: `rgba(${LANDING_NEON.blueRgb}, 0.12)`,
        background: "var(--bg-primary)",
      }}
      aria-labelledby="campaign-pack-heading"
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <SpringReveal>
          <p className="landing-neon-section-kicker landing-neon-section-kicker--blue mb-2">
            {t("kicker")}
          </p>
          <h2
            id="campaign-pack-heading"
            className="font-[family-name:var(--font-bebas)] text-[clamp(28px,6vw,48px)] leading-[0.95] tracking-[0.02em] text-white"
          >
            {t("headline")}
          </h2>
          <p
            className="mt-4 max-w-[560px] text-sm leading-relaxed md:text-base"
            style={{
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              color: "var(--text-secondary)",
            }}
          >
            {t("subheadline")}
          </p>
        </SpringReveal>

        <div className="mt-10 flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-8">
          <SpringReveal className="w-full shrink-0 lg:max-w-[280px]">
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: `rgba(${LANDING_NEON.greenRgb}, 0.25)`,
                background: "var(--bg-secondary)",
              }}
            >
              <span
                className="landing-neon-section-kicker landing-neon-section-kicker--green text-[0.65rem]"
              >
                {t("briefing_label")}
              </span>
              <p
                className="mt-2 text-sm leading-relaxed text-white/80"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {t("briefing_content")}
              </p>
            </div>
          </SpringReveal>

          <div
            className="flex shrink-0 items-center justify-center"
            style={{ color: LANDING_NEON.cyan }}
            aria-hidden
          >
            <ArrowDown className="h-6 w-6 animate-pulse lg:hidden" strokeWidth={2} />
            <ArrowRight className="hidden h-8 w-8 animate-pulse lg:block" strokeWidth={2} />
          </div>

          <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OUTPUT_KEYS.map((key, i) => (
              <SpringReveal key={key} delay={i * 0.05}>
                <div
                  className="h-full rounded-xl border p-3 transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(var(--card-accent-rgb),0.12)]"
                  style={
                    {
                      "--card-accent-rgb": OUTPUT_ACCENTS[i],
                      borderColor: `rgba(${OUTPUT_ACCENTS[i]}, 0.15)`,
                      background: "rgba(10, 13, 18, 0.85)",
                    } as CSSProperties
                  }
                >
                  <span className="text-lg" aria-hidden>
                    {t(`${key}_icon`)}
                  </span>
                  <p
                    className="mt-1 text-sm font-semibold text-white"
                    style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                  >
                    {t(`${key}_title`)}
                  </p>
                  <p
                    className="mt-0.5 text-xs leading-snug text-white/65"
                    style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                  >
                    {t(`${key}_desc`)}
                  </p>
                </div>
              </SpringReveal>
            ))}
          </div>
        </div>

        <SpringReveal delay={0.2}>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span
              className="inline-flex rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{
                background: `rgba(${LANDING_NEON.yellowRgb}, 0.1)`,
                color: LANDING_NEON.yellow,
              }}
            >
              {t("score_pill")}
            </span>
            <p
              className="text-sm text-white/45"
              style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              {t("score_note")}
            </p>
          </div>

          <IntentLink href="/dashboard" className="landing-neon-btn-primary mt-8">
            {t("cta")}
          </IntentLink>
        </SpringReveal>
      </div>
    </section>
  );
}
