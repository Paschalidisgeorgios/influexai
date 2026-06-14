"use client";

import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

export function LandingCampaignMockup() {
  const t = useTranslations("landingPage.campaignStudio.hero.mockup");

  return (
    <SpringReveal delay={0.15} className="w-full max-w-[640px] mx-auto">
      <div className="campaign-mockup relative rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/90 p-4 shadow-[0_0_80px_rgba(180,255,0,0.06)] backdrop-blur-xl md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#B4FF00] shadow-[0_0_8px_rgba(180,255,0,0.8)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            {t("promptLabel")}
          </span>
        </div>
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-black/40 px-4 py-3 text-sm leading-relaxed text-white/75">
          {t("prompt")}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="campaign-mockup-card col-span-1 row-span-2 min-h-[120px] sm:min-h-[140px]">
            <span className="campaign-mockup-card__label">{t("outputImage")}</span>
            <div className="campaign-mockup-card__visual campaign-mockup-card__visual--image" />
          </div>
          <div className="campaign-mockup-card min-h-[68px]">
            <span className="campaign-mockup-card__label">{t("outputVideo")}</span>
            <div className="campaign-mockup-card__visual campaign-mockup-card__visual--video" />
          </div>
          <div className="campaign-mockup-card min-h-[68px]">
            <span className="campaign-mockup-card__label">{t("outputHook")}</span>
            <p className="mt-1 text-[11px] leading-snug text-white/70 line-clamp-2">
              {t("hookPreview")}
            </p>
          </div>
          <div className="campaign-mockup-card col-span-2 min-h-[56px] sm:col-span-1">
            <span className="campaign-mockup-card__label">{t("outputCaption")}</span>
            <p className="mt-1 text-[11px] leading-snug text-white/60 line-clamp-2">
              {t("captionPreview")}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/[0.06] px-4 py-2.5">
          <span className="text-xs font-medium text-white/60">{t("scoreLabel")}</span>
          <span className="font-[family-name:var(--font-bebas)] text-2xl leading-none text-[#B4FF00]">
            {t("scoreValue")}
            <span className="text-sm text-white/60">/100</span>
          </span>
        </div>
      </div>
    </SpringReveal>
  );
}
