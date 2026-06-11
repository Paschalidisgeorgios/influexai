"use client";

import { Clapperboard, Building2, Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const USE_CASES = [
  { key: "creator", icon: Clapperboard },
  { key: "brand", icon: Building2 },
  { key: "influencer", icon: Bot },
] as const;

export function LandingUseCasesSection() {
  const t = useTranslations("landingPage.useCases");

  return (
    <section
      id="use-cases"
      className="border-t border-white/[0.06] bg-[#060608] px-[clamp(20px,6vw,64px)] py-16 md:py-20"
      aria-labelledby="use-cases-heading"
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <p
            className="mb-2 text-center uppercase"
            style={{
              fontSize: 10,
              color: "#B4FF00",
              letterSpacing: "0.14em",
              fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            {t("kicker")}
          </p>
          <h2
            id="use-cases-heading"
            className="mb-10 text-center md:mb-12"
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 5vw, 48px)",
              color: "#ffffff",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {t("headline")}
          </h2>
        </SpringReveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {USE_CASES.map(({ key, icon: Icon }, i) => (
            <SpringReveal key={key} delay={i * 0.08}>
              <article
                className="group flex h-full flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-[#B4FF00] hover:bg-[#B4FF00]/[0.03]"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#B4FF00]/25 bg-[#B4FF00]/10 text-[#B4FF00] transition-colors duration-300 group-hover:border-[#B4FF00]/60 group-hover:bg-[#B4FF00]/15"
                  aria-hidden
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3
                  className="text-xl tracking-[0.02em] text-white"
                  style={{
                    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                    fontSize: "1.35rem",
                  }}
                >
                  {t(`${key}_title`)}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "#888888",
                    fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                  }}
                >
                  {t(`${key}_desc`)}
                </p>
              </article>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
