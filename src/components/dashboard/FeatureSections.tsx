"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DASHBOARD_FLOW_CATEGORIES,
  flowsByCategory,
  type DashboardFlow,
} from "@/lib/dashboard-flows";
import { FeatureCard } from "./FeatureCard";
import { RevealUp } from "@/components/ui/ScrollReveal";

type Props = {
  noCredits: boolean;
  onNeedCredits: () => void;
  resolveTitle: (flow: DashboardFlow) => string;
  resolveTagline: (flow: DashboardFlow) => string;
};

export function FeatureSections({
  noCredits,
  onNeedCredits,
  resolveTitle,
  resolveTagline,
}: Props) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const grouped = flowsByCategory();
  const categories = DASHBOARD_FLOW_CATEGORIES.filter(
    (c) => (grouped[c.id]?.length ?? 0) > 0
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
    };
  };

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const x = e.changedTouches[0]?.clientX ?? 0;
      const y = e.changedTouches[0]?.clientY ?? 0;
      const dx = x - touchStart.current.x;
      const dy = y - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(dx) < 48 || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0 && sectionIndex < categories.length - 1) {
        setSectionIndex((i) => i + 1);
      }
      if (dx > 0 && sectionIndex > 0) {
        setSectionIndex((i) => i - 1);
      }
    },
    [sectionIndex, categories.length]
  );

  const renderSection = (cat: (typeof categories)[0]) => {
    const flows = grouped[cat.id];
    if (!flows?.length) return null;
    return (
      <section key={cat.id}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/80 mb-3 px-0.5 hidden md:block">
          {t(cat.labelKey)}
        </h2>
        <div
          className="
            flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin
            md:grid md:grid-cols-2 md:overflow-visible md:pb-0
            xl:grid-cols-3 2xl:grid-cols-4
          "
        >
          {flows.map((flow, index) => (
            <RevealUp
              key={flow.id}
              delay={index * 0.05}
              className="min-w-[260px] md:min-w-0 snap-center shrink-0 md:shrink"
            >
              <FeatureCard
                title={resolveTitle(flow)}
                tagline={resolveTagline(flow)}
                creditLabel={flow.creditLabel}
                icon={flow.icon}
                badge={flow.badge}
                disabled={noCredits}
                onClick={() => {
                  if (noCredits) {
                    onNeedCredits();
                    return;
                  }
                  router.push(flow.href);
                }}
              />
            </RevealUp>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div
      className="space-y-8 mb-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex gap-2 mb-2 md:hidden overflow-x-auto pb-1 -mx-1 px-1">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSectionIndex(i)}
            className={`shrink-0 min-h-[44px] min-w-[44px] px-4 rounded-full text-xs font-bold uppercase tracking-wide ${
              i === sectionIndex
                ? "bg-[#B4FF00] text-[#060608]"
                : "bg-white/[0.06] text-[rgba(255,255,255,0.65)]"
            }`}
          >
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      <div className="md:hidden">{renderSection(categories[sectionIndex]!)}</div>
      <div className="hidden md:block space-y-8">
        {categories.map((cat) => renderSection(cat))}
      </div>
    </div>
  );
}
