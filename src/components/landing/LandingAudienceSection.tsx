"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const AUDIENCE_KEYS = ["creator", "brand", "agency", "local"] as const;

export function LandingAudienceSection() {
  const t = useTranslations("landingPage.campaignStudio.audience");

  return (
    <section
      id="audience"
      className="campaign-light-section px-4 py-16 md:px-6 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="campaign-kicker">{t("kicker")}</span>
          <h2 className="campaign-heading mt-2 max-w-[640px]">{t("headline")}</h2>
        </SpringReveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {AUDIENCE_KEYS.map((key, i) => (
            <SpringReveal key={key} delay={i * 0.06}>
              <div className="campaign-audience-card h-full rounded-2xl border border-black/[0.08] bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5a7300]">
                  {t(`${key}_kicker`)}
                </span>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#0a0a0a]">
                  {t(`${key}_title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/60">
                  {t(`${key}_desc`)}
                </p>
              </div>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPricingCtaSection() {
  const t = useTranslations("landingPage.campaignStudio.pricingCta");

  return (
    <section
      id="pricing-cta"
      className="relative overflow-hidden bg-[#060608] px-4 py-16 md:px-6 md:py-20 lg:px-10"
    >
      <div className="campaign-hero__glow pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="relative z-10 mx-auto max-w-[720px] text-center">
        <SpringReveal>
          <span className="mb-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B4FF00]/80">
            {t("kicker")}
          </span>
          <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,5vw,3rem)] leading-[0.95] text-white">
            {t("headline")}
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-sm leading-relaxed text-white/50 md:text-base">
            {t("subheadline")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#B4FF00] px-8 text-sm font-semibold text-[#060608] transition-opacity hover:opacity-90"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 px-8 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </SpringReveal>
      </div>
    </section>
  );
}
