"use client";

import { Building2, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const USE_CASES = [
  { key: "creator", icon: Zap },
  { key: "brand", icon: Building2 },
  { key: "influencer", icon: Sparkles },
] as const;

export function LandingUseCasesSection() {
  const t = useTranslations("landingPage.useCases");

  return (
    <section
      id="use-cases"
      className="border-t border-white/[0.06] bg-[#060608] px-4 py-8 md:px-6 md:py-10 lg:px-10 lg:py-16"
      aria-labelledby="use-cases-heading"
    >
      <div className="mx-auto w-full max-w-[1160px]">
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
              fontSize: "clamp(28px, 6vw, 48px)",
              color: "#ffffff",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {t("headline")}
          </h2>
        </SpringReveal>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {USE_CASES.map(({ key, icon: Icon }, i) => (
            <SpringReveal key={key} delay={i * 0.08}>
              <article className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 transition-all duration-300 hover:border-[#B4FF00]/30">
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-[#B4FF00]/25 bg-[#B4FF00]/10 text-[#B4FF00] transition-colors duration-300 group-hover:border-[#B4FF00]/50 group-hover:bg-[#B4FF00]/15"
                  aria-hidden
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3
                  className="mb-1 text-white"
                  style={{
                    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                    fontSize: "1.5rem",
                    letterSpacing: "0.02em",
                    lineHeight: 1.1,
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
                  className="mb-5 flex-1 text-sm leading-relaxed text-[#888888]"
                  style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
                >
                  {t(`${key}_desc`)}
                </p>
                <span
                  className="inline-flex w-fit rounded-full border border-[#B4FF00]/20 bg-[#B4FF00]/[0.06] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#B4FF00]"
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
