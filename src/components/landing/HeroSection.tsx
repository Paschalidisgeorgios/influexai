"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { AbVariant } from "@/lib/ab-tracking";
import { getStarterPriceParams } from "@/lib/pricing";
import { HeroTitle } from "@/components/landing/HeroTitle";
import { EXTRA_HERO_ROTATING_TITLES } from "@/data/heroRotatingTitles";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";

type Audience = "creator" | "brand";

export function HeroSection({
  variant: _variant = "a",
}: {
  variant?: AbVariant;
} = {}) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const priceParams = getStarterPriceParams(locale);
  const [audience, setAudience] = useState<Audience>("creator");
  const [mounted, setMounted] = useState(false);
  const rawRotating = t.raw("rotating_titles");
  const rotatingTitles = [
    ...(Array.isArray(rawRotating) ? (rawRotating as string[]) : []),
    ...EXTRA_HERO_ROTATING_TITLES,
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="top"
      className="relative isolate min-h-0 max-w-[100vw] overflow-x-clip bg-[#060608] pt-[calc(80px+env(safe-area-inset-top,0px))] pb-16 md:min-h-[min(88dvh,820px)] md:pb-24"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(180,255,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,255,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 0%, rgba(180,255,0,0.06), transparent 55%)",
        }}
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto w-full max-w-[820px] px-[clamp(20px,6vw,64px)] ${
          mounted ? "opacity-100" : "opacity-0"
        } transition-opacity duration-500`}
      >
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6 md:gap-7">
          <SpringReveal>
            <div className="flex items-center gap-2.5">
              <div
                className="h-[7px] w-[7px] shrink-0 animate-blink rounded-full bg-[var(--accent,#B4FF00)]"
                aria-hidden
              />
              <span className="kicker">{t("badge")} · 2026</span>
            </div>
          </SpringReveal>

          <SpringReveal delay={0.08}>
            <div className="flex flex-wrap items-center gap-2">
              {(["creator", "brand"] as Audience[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className="min-h-[44px] cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    background: audience === a ? "var(--accent, #B4FF00)" : "transparent",
                    borderColor:
                      audience === a ? "var(--accent, #B4FF00)" : "rgba(255,255,255,0.13)",
                    color: audience === a ? "#060608" : "rgba(255,255,255,0.85)",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  {a === "creator" ? "Für Creator" : "Für Marken"}
                </button>
              ))}
            </div>
          </SpringReveal>

          <SpringReveal delay={0.12}>
            <HeroTitle titles={rotatingTitles} />
          </SpringReveal>

          <SpringReveal delay={0.16}>
            <p className="hero-subtitle w-full max-w-[520px]">
              {audience === "creator" ? t("creator_subtitle") : t("brand_subtitle")}
            </p>
          </SpringReveal>

          <SpringReveal delay={0.2}>
            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <AcidMotionButton
                href="/auth/sign-up"
                className="btn-acid w-full justify-center sm:w-auto sm:justify-start"
              >
                → {t("cta_primary", priceParams)}
              </AcidMotionButton>
              <a
                href="#value"
                className="btn-ghost w-full justify-center sm:w-auto sm:justify-start"
              >
                {t("cta_secondary")}
              </a>
            </div>
          </SpringReveal>

          <SpringReveal delay={0.24}>
            <p
              className="max-w-[520px] text-sm leading-relaxed text-zinc-400 md:text-[0.85rem]"
            >
              {t("trust_line", priceParams)}
            </p>
          </SpringReveal>
        </div>
      </div>
    </section>
  );
}
