"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { getGreeting } from "@/lib/greeting";
import type { DashboardFlow } from "@/lib/dashboard-flows";

type Props = {
  firstName: string;
  credits: number | null;
  topFlows: DashboardFlow[];
  noCredits: boolean;
  onBuyCredits: () => void;
};

export function DashboardHero({
  firstName,
  credits,
  topFlows,
  noCredits,
  onBuyCredits,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const greeting = getGreeting(locale);

  return (
    <section className="mb-6 rounded-2xl border border-[#B4FF00]/20 bg-gradient-to-br from-[#0f0f12] to-[#18181d] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#F0EFE8] font-[family-name:var(--font-syne)]">
            {greeting}, {firstName}{" "}
            <span className="inline-block" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-[#505055]">{t("hero_subtitle")}</p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-1 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[#505055]">
            {t("credits_available")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-[#B4FF00] tabular-nums">
              {credits ?? "—"}
            </span>
            <span className="text-sm text-[#505055] font-medium">Credits</span>
          </div>
          {noCredits && (
            <button
              type="button"
              onClick={onBuyCredits}
              className="mt-2 min-h-[44px] px-4 py-2 rounded-lg bg-[#B4FF00] text-[#060608] text-sm font-bold"
            >
              {t("buy_credits")}
            </button>
          )}
        </div>
      </div>

      <Link
        href="/dashboard/agent"
        className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-[#B4FF00]/35 bg-[#B4FF00]/10 text-[#B4FF00] text-sm font-bold hover:bg-[#B4FF00]/15 transition-colors"
      >
        <Star size={18} fill="#B4FF00" />
        {t("open_agent")}
      </Link>

      {topFlows.length > 0 && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#505055] mb-3">
            {t("quick_actions")}
          </p>
          <div className="flex flex-wrap gap-2">
            {topFlows.map((flow) => {
              const Icon = flow.icon;
              return (
                <Link
                  key={flow.id}
                  href={noCredits ? "#" : flow.href}
                  onClick={(e) => {
                    if (noCredits) {
                      e.preventDefault();
                      onBuyCredits();
                    }
                  }}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#060608]/60 border border-white/10 hover:border-[#B4FF00]/40 text-[#F0EFE8] text-sm font-semibold transition-colors"
                >
                  <Icon size={18} className="text-[#B4FF00]" strokeWidth={2} />
                  {flow.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
