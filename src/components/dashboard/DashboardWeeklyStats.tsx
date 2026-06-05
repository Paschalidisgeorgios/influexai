"use client";

import { useTranslations } from "next-intl";
import type { DashboardUserStats } from "@/lib/dashboard-user-stats";

type Props = {
  stats: DashboardUserStats | null;
  loading?: boolean;
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-h-[88px] rounded-xl border border-white/10 bg-[#0f0f12] p-4 flex flex-col justify-center">
      <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.65)] mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-bold leading-snug ${accent ? "text-[#B4FF00]" : "text-[#F0EFE8]"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function DashboardWeeklyStats({ stats, loading }: Props) {
  const t = useTranslations("dashboard");

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const createdLine = t("week_created", {
    scripts: stats.weekScripts,
    videos: stats.weekVideos,
    thumbnails: stats.weekThumbnails,
  });

  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[rgba(255,255,255,0.65)] mb-3">
        {t("stats_title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t("week_created_label")} value={createdLine} />
        <StatCard
          label={t("credits_spent_week")}
          value={String(stats.creditsSpentWeek)}
        />
        <StatCard
          label={t("streak")}
          value={t("streak_days", { days: stats.streakDays })}
          accent={stats.streakDays > 0}
        />
        <StatCard
          label={t("total_creations")}
          value={String(stats.totalGenerations)}
        />
      </div>
    </section>
  );
}
