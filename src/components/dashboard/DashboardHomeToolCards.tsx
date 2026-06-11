"use client";

import { useRouter } from "next/navigation";
import { productToolsByCategory } from "@/lib/dashboard-product-tools";
import { FeatureCard } from "@/components/dashboard/FeatureCard";

export function DashboardHomeToolCards() {
  const router = useRouter();
  const categories = productToolsByCategory();

  return (
    <section className="mb-8 min-w-0 max-w-full">
      <div className="mb-4">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#B4FF00]">
          Creator Studio
        </p>
        <h2
          className="text-[clamp(1.75rem,3vw,2.25rem)] leading-none text-[#F0EFE8]"
          style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
        >
          ALLE TOOLS
        </h2>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">
          Wähle ein Tool — der KI Agent kann Aufgaben auch automatisch für dich
          ausführen.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.key}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">
              {cat.label}
            </h3>
            <div
              className="
                flex gap-3 overflow-x-auto max-w-full pb-2 snap-x snap-mandatory
                md:grid md:grid-cols-2 md:overflow-visible md:pb-0
                xl:grid-cols-3 2xl:grid-cols-4
              "
            >
              {cat.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="min-w-[min(85vw,280px)] md:min-w-0 snap-center shrink-0 md:shrink"
                >
                  <FeatureCard
                    title={tool.title}
                    tagline={tool.description}
                    creditLabel={tool.creditLabel}
                    icon={tool.icon}
                    badge={tool.badge}
                    onClick={() => router.push(tool.href)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
