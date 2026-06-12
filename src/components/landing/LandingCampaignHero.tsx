"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { getStarterPriceParams } from "@/lib/pricing";
import { LandingCampaignMockup } from "./LandingCampaignMockup";

export function LandingCampaignHero() {
  const t = useTranslations("landingPage.campaignStudio.hero");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);

  return (
    <section
      id="hero"
      className="campaign-hero relative overflow-hidden px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-12 lg:px-10"
    >
      <div className="campaign-hero__glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="campaign-hero__grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative z-10 mx-auto max-w-[1160px]">
        <div className="flex flex-col items-center text-center">
          <SpringReveal>
            <span className="mb-4 inline-flex rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B4FF00]">
              {t("kicker")}
            </span>
            <h1 className="mx-auto max-w-[900px] font-[family-name:var(--font-bebas)] text-[clamp(2.5rem,8vw,4.75rem)] leading-[0.95] tracking-[0.01em] text-white">
              {t("headline")}
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] text-base leading-relaxed text-white/55 md:text-lg">
              {t("subheadline")}
            </p>
          </SpringReveal>

          <SpringReveal delay={0.08} className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <AcidMotionButton href="/auth/sign-up" className="btn-acid justify-center px-8">
              {t("ctaPrimary")}
            </AcidMotionButton>
            <Link
              href="#showcase"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 px-8 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              {t("ctaSecondary")}
            </Link>
          </SpringReveal>

          <p className="mt-4 text-xs text-white/30">{t("note", priceParams)}</p>
        </div>

        <div className="mt-12 md:mt-16">
          <LandingCampaignMockup />
        </div>
      </div>
    </section>
  );
}
