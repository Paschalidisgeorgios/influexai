"use client";

import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";

const CARD_KEYS = ["c1", "c2", "c3", "c4"] as const;
const CARD_VARIANTS = [
  "campaign-showcase-card--a",
  "campaign-showcase-card--b",
  "campaign-showcase-card--c",
  "campaign-showcase-card--d",
] as const;

export function LandingShowcaseSection() {
  const t = useTranslations("landingPage.campaignStudio.showcase");

  return (
    <section
      id="showcase"
      className="campaign-light-section px-4 py-16 md:px-6 md:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-[1160px]">
        <SpringReveal>
          <span className="campaign-kicker">{t("kicker")}</span>
          <h2 className="campaign-heading mt-2 max-w-[640px]">{t("headline")}</h2>
        </SpringReveal>

        <div className="campaign-showcase-scroll mt-10 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 pb-2 md:gap-5">
            {CARD_KEYS.map((key, i) => (
              <SpringReveal
                key={key}
                delay={i * 0.06}
                className="campaign-showcase-card-wrap shrink-0"
              >
                <article
                  className={`campaign-showcase-card ${CARD_VARIANTS[i]}`}
                >
                  <div className="campaign-showcase-card__visual" />
                  <div className="campaign-showcase-card__meta">
                    <span className="campaign-showcase-card__tag">
                      {t(`${key}_tag`)}
                    </span>
                    <p className="campaign-showcase-card__prompt">
                      {t(`${key}_prompt`)}
                    </p>
                  </div>
                </article>
              </SpringReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
