"use client";

import type { FeatureMenuCategory } from "@/lib/landing-features-menu";
import { useFeaturesMenuLabel } from "@/lib/features-menu-i18n";
import { FeatureItem } from "./FeatureItem";

type Props = {
  category: FeatureMenuCategory;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  defaultOpen?: boolean;
};

export function FeatureCategory({
  category,
  onNavigate,
  variant = "desktop",
  defaultOpen = false,
}: Props) {
  const { label } = useFeaturesMenuLabel();

  if (variant === "mobile") {
    return (
      <details className="features-mega-accordion" open={defaultOpen}>
        <summary className="features-mega-accordion__summary">
          {label(`categories.${category.id}`)}
        </summary>
        <div className="features-mega-accordion__body">
          {category.groups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.id} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="features-mega-icon features-mega-icon--sm">
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </span>
                  <span className="text-sm font-semibold text-white/90">
                    {label(`groups.${group.id}.title`)}
                  </span>
                </div>
                <div className="space-y-0.5 pl-1">
                  {group.items.map((item) => (
                    <FeatureItem
                      key={item.id}
                      href={item.href}
                      label={label(`items.${item.id}`)}
                      onNavigate={onNavigate}
                      variant="mobile"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <div className="features-mega-category min-w-0">
      <p className="features-mega-category__title">{label(`categories.${category.id}`)}</p>
      <div className="mt-4 space-y-6">
        {category.groups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.id}>
              <div className="mb-2.5 flex items-start gap-2.5">
                <span className="features-mega-icon">
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
                </span>
                <p className="text-[13px] font-semibold leading-snug text-white/85">
                  {label(`groups.${group.id}.title`)}
                </p>
              </div>
              <ul className="space-y-0.5 pl-[38px]">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <FeatureItem
                      href={item.href}
                      label={label(`items.${item.id}`)}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
