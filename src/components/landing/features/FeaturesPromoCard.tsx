"use client";

import Link from "next/link";
import type { FeaturePromoVariant } from "@/lib/landing-features-menu";
import { useFeaturesMenuLabel } from "@/lib/features-menu-i18n";

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
  const { promo } = useFeaturesMenuLabel();

  return (
    <article
      className={`features-mega-promo features-mega-promo--${variant}${
        compact ? " features-mega-promo--compact" : ""
      }`}
    >
      <div className="features-mega-promo__visual" aria-hidden />
      <div className="features-mega-promo__content">
        <span className="features-mega-promo__label">{promo(`${variant}.label`)}</span>
        <h3 className="features-mega-promo__headline">{promo(`${variant}.headline`)}</h3>
        <p className="features-mega-promo__desc">{promo(`${variant}.description`)}</p>
        <Link
          href={promo(`${variant}.href`)}
          className="features-mega-promo__cta"
          onClick={onNavigate}
        >
          {promo(`${variant}.cta`)}
        </Link>
      </div>
    </article>
  );
}
