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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] cursor-default border-none bg-black/30 backdrop-blur-[2px] hidden md:block"
        aria-label={label("close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed left-1/2 top-[calc(var(--landing-nav-height,3.5rem)+0.5rem)] z-[100] hidden w-[1100px] max-w-[95vw] -translate-x-1/2 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl md:block"
        role="dialog"
        aria-modal="true"
        aria-label={label("title")}
      >
        <div className="grid grid-cols-4 gap-8">
          <div
            className="col-span-3 grid grid-cols-6 gap-6"
            onMouseLeave={() => setPromoVariant(DEFAULT_FEATURE_PROMO)}
          >
            {LANDING_FEATURES_MENU.map((category) => (
              <div
                key={category.id}
                className="min-w-0"
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
          <div className="col-span-1 min-w-0 self-stretch">
            <FeaturesPromoCard variant={promoVariant} onNavigate={onClose} />
          </div>
        </div>
      </div>
    </>
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
