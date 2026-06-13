"use client";

import { IntentLink } from "@/hooks/useIntentTracking";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const OUTPUT_KEYS = [
  "hooks",
  "script",
  "visuals",
  "motion",
  "captions",
  "plan",
] as const;

export function LandingCampaignPackSection() {
  const t = useTranslations("landingPage.campaignStudio.pack");

  return (
    <section
      id="campaign-pack"
      className="border-y border-[#B4FF00]/[0.08] bg-[#08080a] px-4 py-16 md:px-10 md:py-20"
      aria-labelledby="campaign-pack-heading"
    >
      <div className="mx-auto w-full max-w-[1100px]">
        <SpringReveal>
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B4FF00]"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {t("kicker")}
          </p>
          <h2
            id="campaign-pack-heading"
            className="font-[family-name:var(--font-bebas)] text-[clamp(28px,6vw,48px)] leading-[0.95] tracking-[0.02em] text-white"
          >
            {t("headline")}
          </h2>
          <p
            className="mt-4 max-w-[560px] text-sm leading-relaxed text-white/50 md:text-base"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {t("subheadline")}
          </p>
        </SpringReveal>

        <div className="mt-10 flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-8">
          <SpringReveal className="w-full shrink-0 lg:max-w-[280px]">
            <div className="rounded-xl border border-[#B4FF00]/20 bg-[#0d0d0f] p-4">
              <span
                className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#B4FF00]/80"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
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
            className="flex shrink-0 items-center justify-center text-[#B4FF00]"
            aria-hidden
          >
            <ArrowDown className="h-6 w-6 animate-pulse lg:hidden" strokeWidth={2} />
            <ArrowRight
              className="hidden h-8 w-8 animate-pulse lg:block"
              strokeWidth={2}
            />
          </div>

          <div className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OUTPUT_KEYS.map((key, i) => (
              <SpringReveal key={key} delay={i * 0.05}>
                <div className="h-full rounded-xl border border-white/[0.06] bg-[#111113] p-3">
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
                    className="mt-0.5 text-xs leading-snug text-white/45"
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
            <span className="inline-flex rounded-full bg-[#B4FF00]/10 px-4 py-1.5 text-sm font-semibold text-[#B4FF00]">
              {t("score_pill")}
            </span>
            <p
              className="text-sm text-white/45"
              style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              {t("score_note")}
            </p>
          </div>

          <IntentLink
            href="/dashboard"
            className="btn-acid mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full px-8 py-3 text-sm font-semibold no-underline transition-transform hover:scale-[1.02]"
          >
            {t("cta")}
          </IntentLink>
        </SpringReveal>
      </div>
    </section>
  );
}
