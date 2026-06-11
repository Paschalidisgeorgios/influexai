"use client";

import { useRouter } from "next/navigation";
import { DASHBOARD_HOME_TOOLS } from "@/lib/dashboard-home-tools";
import { FeatureCard } from "@/components/dashboard/FeatureCard";

export function DashboardHomeToolGrid() {
  const router = useRouter();

  return (
    <section className="w-full min-w-0">
      <div className="mb-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Oder einzelne Tools
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {DASHBOARD_HOME_TOOLS.map((tool) => (
          <FeatureCard
            key={tool.id}
            title={tool.title}
            tagline={tool.description}
            creditLabel={tool.creditLabel}
            icon={tool.icon}
            badge={tool.badge}
            onClick={() => router.push(tool.href)}
          />
        ))}
      </div>
    </section>
  );
}
