"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_FEATURE_PROMO,
  FEATURE_PROMO_BY_CATEGORY,
  LANDING_FEATURES_MENU,
  type FeaturePromoVariant,
} from "@/lib/landing-features-menu";
import { useFeaturesMenuLabel, NAV_LABELS_DE } from "@/lib/features-menu-i18n";
import { FeatureCategory } from "./FeatureCategory";
import { FeaturesPromoCard } from "./FeaturesPromoCard";

type DesktopProps = {
  open: boolean;
  onClose: () => void;
};

export function FeaturesMegaMenuDesktop({ open, onClose }: DesktopProps) {
  const { label } = useFeaturesMenuLabel();
  const panelRef = useRef<HTMLDivElement>(null);
  const [promoVariant, setPromoVariant] = useState<FeaturePromoVariant>(
    DEFAULT_FEATURE_PROMO
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.overflowX = "clip";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="features-mega-root hidden md:block" role="presentation">
      <button
        type="button"
        className="features-mega-backdrop"
        aria-label={label("close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="features-mega-panel"
        role="dialog"
        aria-modal="true"
        aria-label={label("title")}
      >
        <div className="features-mega-panel__inner">
          <div
            className="features-mega-grid"
            onMouseLeave={() => setPromoVariant(DEFAULT_FEATURE_PROMO)}
          >
            {LANDING_FEATURES_MENU.map((category) => (
              <div
                key={category.id}
                onMouseEnter={() =>
                  setPromoVariant(
                    FEATURE_PROMO_BY_CATEGORY[category.id] ?? DEFAULT_FEATURE_PROMO
                  )
                }
              >
                <FeatureCategory
                  category={category}
                  onNavigate={onClose}
                  variant="desktop"
                />
              </div>
            ))}
          </div>
          <div className="features-mega-promo-wrap">
            <FeaturesPromoCard variant={promoVariant} onNavigate={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

type MobileProps = {
  onNavigate?: () => void;
};

export function FeaturesMegaMenuMobile({ onNavigate }: MobileProps) {
  const { label } = useFeaturesMenuLabel();

  return (
    <div className="features-mega-mobile md:hidden">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label("title") || NAV_LABELS_DE.features}
      </p>
      <div className="space-y-2">
        {LANDING_FEATURES_MENU.map((category, index) => (
          <FeatureCategory
            key={category.id}
            category={category}
            onNavigate={onNavigate}
            variant="mobile"
            defaultOpen={index === 0}
          />
        ))}
      </div>
      <div className="mt-5">
        <FeaturesPromoCard
          variant={DEFAULT_FEATURE_PROMO}
          compact
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
