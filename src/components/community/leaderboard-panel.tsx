"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CREATOR_BADGES,
  profilePath,
  type LeaderboardEntry,
} from "@/lib/community-creations";
import { initials } from "@/lib/community";

type Props = { entries: LeaderboardEntry[] };

export function LeaderboardPanel({ entries }: Props) {
  const t = useTranslations("community");

  return (
    <section className="mt-16 rounded-2xl border border-[#B4FF00]/20 bg-[#0f0f12] p-6">
      <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#F0EFE8] mb-1">
        {t("leaderboard_title")}
      </h2>
      <p className="text-[rgba(255,255,255,0.65)] text-sm mb-6">{t("leaderboard_desc")}</p>

      {entries.length === 0 ? (
        <p className="text-[rgba(255,255,255,0.65)] text-sm">{t("empty_leaderboard")}</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((e) => (
            <li
              key={e.userId}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <span className="font-[family-name:var(--font-bebas)] text-xl text-[#B4FF00] w-8 text-center">
                {e.rank}
              </span>
              <Link
                href={profilePath(e.username)}
                className="w-10 h-10 rounded-full bg-[#18181d] flex items-center justify-center text-sm text-[#B4FF00] font-bold shrink-0"
              >
                {initials(e.displayName)}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={profilePath(e.username)}
                  className="text-[#F0EFE8] font-semibold text-sm hover:text-[#B4FF00] truncate block"
                >
                  {e.displayName}
                </Link>
                <p className="text-[rgba(255,255,255,0.65)] text-xs">
                  {t("gens_week", { count: e.generationCount })}
                  {e.avgViralScore != null &&
                    ` · Ø ${e.avgViralScore} ${t("viral_score_short")}`}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {e.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[#B4FF00]/10 text-[#B4FF00] border border-[#B4FF00]/25"
                      title={t(CREATOR_BADGES[b].labelKey)}
                    >
                      {CREATOR_BADGES[b].emoji} {t(CREATOR_BADGES[b].labelKey)}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
