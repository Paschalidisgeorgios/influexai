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
                <div className="space-y-1 pl-1">
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
    <div className="min-w-0">
      <p className="mb-4 border-b border-zinc-800/60 pb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label(`categories.${category.id}`)}
      </p>
      <div className="space-y-4">
        {category.groups.map((group) => {
          const Icon = group.icon;
          const groupTitle = label(`groups.${group.id}.title`);
          return group.items.map((item) => (
            <FeatureItem
              key={item.id}
              href={item.href}
              label={label(`items.${item.id}`)}
              subtitle={groupTitle}
              icon={Icon}
              onNavigate={onNavigate}
            />
          ));
        })}
      </div>
    </div>
  );
}
