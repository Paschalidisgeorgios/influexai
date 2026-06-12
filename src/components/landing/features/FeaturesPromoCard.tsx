"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FeaturePromoVariant } from "@/lib/landing-features-menu";

type Props = {
  variant: FeaturePromoVariant;
  compact?: boolean;
  onNavigate?: () => void;
};

export function FeaturesPromoCard({
  variant,
  compact = false,
  onNavigate,
}: Props) {
  const t = useTranslations("landingPage.featuresMenu.promo");

  return (
    <article
      className={`features-mega-promo features-mega-promo--${variant}${
        compact ? " features-mega-promo--compact" : ""
      }`}
    >
      <div className="features-mega-promo__visual" aria-hidden />
      <div className="features-mega-promo__content">
        <span className="features-mega-promo__label">{t(`${variant}.label`)}</span>
        <h3 className="features-mega-promo__headline">{t(`${variant}.headline`)}</h3>
        <p className="features-mega-promo__desc">{t(`${variant}.description`)}</p>
        <Link
          href={t(`${variant}.href`)}
          className="features-mega-promo__cta"
          onClick={onNavigate}
        >
          {t(`${variant}.cta`)}
        </Link>
      </div>
    </article>
  );
}
