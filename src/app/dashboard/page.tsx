"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DailySuggestions } from "@/components/dashboard/DailySuggestions";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardWeeklyStats } from "@/components/dashboard/DashboardWeeklyStats";
import { FeatureSections } from "@/components/dashboard/FeatureSections";
import { QuickStartGuide } from "@/components/dashboard/QuickStartGuide";
import {
  DASHBOARD_FLOWS,
  rankTopFlows,
  type DashboardFlow,
} from "@/lib/dashboard-flows";
import {
  fetchDashboardUserStats,
  type DashboardUserStats,
} from "@/lib/dashboard-user-stats";
import { createClient } from "@/lib/supabase/client";
import { firstNameFromFullName } from "@/lib/onboarding";
import { resolveDashboardDisplayName } from "@/lib/resolve-display-name";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useBuyCredits } from "@/components/credits/BuyCreditsProvider";

function relativeTime(iso: string, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return rtf.format(0, "second");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return rtf.format(-hrs, "hour");
  const days = Math.floor(hrs / 24);
  return rtf.format(-days, "day");
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

const FLOW_I18N_KEYS = new Set([
  "script",
  "niche",
  "outlier",
  "thumbnail",
  "remix",
  "video_ad",
  "loraTraining",
  "viral_score",
  "competitor",
  "image_generator",
]);

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tFlows = useTranslations("flows");
  const router = useRouter();
  const supabase = createClient();
  const [credits, setCredits] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>("Creator");
  const [generations, setGenerations] = useState<
    { id: string; type: string; prompt: string; created_at: string }[]
  >([]);
  const [allGensForRank, setAllGensForRank] = useState<{ type: string }[]>([]);
  const [stats, setStats] = useState<DashboardUserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { open: openBuyCredits } = useBuyCredits();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState("Creator");
  const [locale, setLocale] = useState("de");

  useEffect(() => {
    setLocale(
      typeof navigator !== "undefined"
        ? navigator.language.slice(0, 2)
        : "de"
    );
  }, []);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, credits, onboarding_completed")
        .eq("id", user.id)
        .single();

      setDisplayName(resolveDashboardDisplayName(user, profile));

      if (profile) {
        setCredits(profile.credits);
        setShowOnboarding(!(profile.onboarding_completed ?? false));
        setOnboardingName(
          firstNameFromFullName(profile.full_name) ||
            profile.username ||
            "Creator"
        );
      }

      const { data: gens } = await supabase
        .from("generations")
        .select("id, type, prompt, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setGenerations(gens ?? []);

      const { data: rankGens } = await supabase
        .from("generations")
        .select("type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      setAllGensForRank(rankGens ?? []);

      setStatsLoading(true);
      try {
        const userStats = await fetchDashboardUserStats(supabase, user.id);
        setStats(userStats);
      } finally {
        setStatsLoading(false);
      }
    };

    void load();
    const refresh = () => void load();
    window.addEventListener("credits-updated", refresh);
    return () => window.removeEventListener("credits-updated", refresh);
  }, [supabase]);

  const noCredits = credits === 0;
  const topFlows = rankTopFlows(allGensForRank, 3);
  const showQuickStart = (stats?.totalGenerations ?? 0) < 3;

  const resolveTitle = (flow: DashboardFlow) => {
    if (flow.i18nKey && FLOW_I18N_KEYS.has(flow.i18nKey)) {
      return tFlows(`${flow.i18nKey}.title`);
    }
    return flow.title;
  };

  const resolveTagline = (flow: DashboardFlow) => {
    if (flow.i18nKey && FLOW_I18N_KEYS.has(flow.i18nKey)) {
      return tFlows(`${flow.i18nKey}.description`);
    }
    return flow.tagline;
  };

  const typeToHref = (type: string) => {
    const flow = DASHBOARD_FLOWS.find((f) => f.genTypes.includes(type));
    return flow?.href ?? "/dashboard";
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-4">
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userName={onboardingName}
      />

      <DashboardHero
        firstName={displayName}
        credits={credits}
        topFlows={topFlows}
        noCredits={noCredits}
        onBuyCredits={openBuyCredits}
      />

      <DailySuggestions />

      <QuickStartGuide show={showQuickStart} />

      <DashboardWeeklyStats stats={stats} loading={statsLoading} />

      {noCredits && (
        <div className="mb-6 rounded-2xl border border-[#B4FF00]/20 bg-[#B4FF00]/[0.04] p-8 text-center">
          <h2 className="text-2xl font-bold text-[#F0EFE8] mb-3">
            {t("no_credits_title")}
          </h2>
          <p className="text-sm text-white/70 mb-6 leading-relaxed max-w-md mx-auto">
            {t("no_credits_body")}
          </p>
          <button
            type="button"
            onClick={openBuyCredits}
            className="px-8 py-3 rounded-xl bg-[#B4FF00] text-[#060608] font-bold text-sm"
          >
            {t("buy_credits")}
          </button>
        </div>
      )}

      <FeatureSections
        noCredits={noCredits}
        onNeedCredits={openBuyCredits}
        resolveTitle={resolveTitle}
        resolveTagline={resolveTagline}
      />

      <section className="rounded-2xl border border-white/10 bg-[#0f0f12] p-5">
        <h2 className="text-lg font-bold text-[#F0EFE8] mb-4 font-[family-name:var(--font-syne)]">
          {t("recent_activity")}
        </h2>
        {generations.length === 0 ? (
          <p className="text-center text-sm text-[rgba(255,255,255,0.65)] py-4">
            {t("no_activity")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {generations.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => router.push(typeToHref(g.type))}
                  className="w-full flex items-start gap-3 min-h-[44px] py-2 text-left rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg shrink-0">✨</span>
                  <p className="flex-1 text-sm text-[#F0EFE8] leading-snug min-w-0">
                    {truncate(g.prompt || g.type, 60)}
                  </p>
                  <span className="text-xs text-[rgba(255,255,255,0.65)] shrink-0 whitespace-nowrap">
                    {relativeTime(g.created_at, locale)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}
