"use client";

import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const PACK_KEYS = ["images", "video", "hooks", "captions", "hashtags", "score"] as const;

export function LandingCampaignPackSection() {
  const t = useTranslations("landingPage.campaignStudio.pack");

  return (
    <section
      id="pack"
      className="relative overflow-hidden bg-[#060608] px-4 py-16 md:px-6 md:py-24 lg:px-10"
    >
      <div className="campaign-hero__glow pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative z-10 mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="mb-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B4FF00]/80">
            {t("kicker")}
          </span>
          <h2 className="max-w-[640px] font-[family-name:var(--font-bebas)] text-[clamp(2rem,5vw,3.25rem)] leading-[0.95] text-white">
            {t("headline")}
          </h2>
          <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-white/50 md:text-base">
            {t("subheadline")}
          </p>
        </SpringReveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PACK_KEYS.map((key, i) => (
            <SpringReveal key={key} delay={i * 0.04}>
              <div className="campaign-pack-item h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center backdrop-blur-sm">
                <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#B4FF00]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-semibold text-white">{t(`${key}_title`)}</p>
                <p className="mt-1 text-xs leading-snug text-white/45">{t(`${key}_desc`)}</p>
              </div>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
