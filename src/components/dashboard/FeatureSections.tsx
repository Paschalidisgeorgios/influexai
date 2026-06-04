"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DASHBOARD_FLOW_CATEGORIES,
  flowsByCategory,
  type DashboardFlow,
} from "@/lib/dashboard-flows";
import { FeatureCard } from "./FeatureCard";

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

  return (
    <div className="space-y-8 mb-8">
      {DASHBOARD_FLOW_CATEGORIES.map((cat) => {
        const flows = grouped[cat.id];
        if (!flows.length) return null;

        return (
          <section key={cat.id}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#505055] mb-3 px-0.5">
              {t(cat.labelKey)}
            </h2>
            <div
              className="
                flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin
                md:grid md:grid-cols-2 md:overflow-visible md:pb-0
                xl:grid-cols-3 2xl:grid-cols-4
              "
            >
              {flows.map((flow) => (
                <FeatureCard
                  key={flow.id}
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
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
