import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChurnRiskLevel = "low" | "medium" | "high" | "critical";

export type ChurnRiskResult = {
  score: number;
  risk: ChurnRiskLevel;
  reasons: string[];
  recommendedAction: string;
  daysSinceLastGeneration: number | null;
  lastGenerationAt: string | null;
};

export type ChurnInputData = {
  generationCount: number;
  distinctFeatureCount: number;
  lastGenerationAt: string | null;
  credits: number;
  onboardingCompleted: boolean;
  hasPurchase: boolean;
  hasReferred: boolean;
  recentVisitsWithoutGen: boolean;
};

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function scoreChurnFromData(data: ChurnInputData): ChurnRiskResult {
  let score = 0;
  const reasons: string[] = [];
  const days = daysSince(data.lastGenerationAt);

  if (days === null || data.generationCount === 0) {
    score += 30;
    reasons.push("Keine Generierung in den letzten 7 Tagen");
  } else if (days >= 7) {
    score += 30;
    reasons.push("Keine Generierung seit 7+ Tagen");
  } else if (days >= 3) {
    score += 20;
    reasons.push("Keine Generierung seit 3+ Tagen");
  }

  if (data.credits < 5) {
    score += 25;
    reasons.push("Weniger als 5 Credits übrig");
  }

  if (data.generationCount > 0 && data.distinctFeatureCount <= 1) {
    score += 15;
    reasons.push("Nur ein Feature bisher genutzt");
  }

  if (data.recentVisitsWithoutGen) {
    score += 10;
    reasons.push("App besucht, aber nichts generiert (letzte Besuche)");
  }

  if (!data.onboardingCompleted) {
    score += 20;
    reasons.push("Onboarding nicht abgeschlossen");
  }

  if (days !== null && days < 1) {
    score -= 10;
    reasons.push("Aktiv in den letzten 24h (positiv)");
  }

  if (data.hasPurchase) {
    score -= 15;
    reasons.push("Hat Credits gekauft (positiv)");
  }

  if (data.hasReferred) {
    score -= 10;
    reasons.push("Hat jemanden eingeladen (positiv)");
  }

  score = Math.max(0, Math.min(100, score));

  let risk: ChurnRiskLevel = "low";
  if (score >= 76) risk = "critical";
  else if (score >= 51) risk = "high";
  else if (score >= 26) risk = "medium";

  let recommendedAction = "Nutzer ist engagiert — kein Eingreifen nötig.";
  if (risk === "critical") {
    recommendedAction =
      "Win-back Critical E-Mail senden + 5 Bonus-Credits anbieten.";
  } else if (risk === "high") {
    recommendedAction = "Win-back High E-Mail + In-App Re-Engagement Banner.";
  } else if (risk === "medium") {
    recommendedAction = "Feature-Nudge im Dashboard anzeigen.";
  }

  return {
    score,
    risk,
    reasons,
    recommendedAction,
    daysSinceLastGeneration: days,
    lastGenerationAt: data.lastGenerationAt,
  };
}

async function loadChurnInput(
  supabase: SupabaseClient,
  userId: string
): Promise<ChurnInputData | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, onboarding_completed, is_churned")
    .eq("id", userId)
    .single();

  if (!profile || profile.is_churned) return null;

  const { data: gens } = await supabase
    .from("generations")
    .select("type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const generationCount = gens?.length ?? 0;
  const types = new Set((gens ?? []).map((g) => g.type));
  const lastGenerationAt = gens?.[0]?.created_at ?? null;

  const { data: purchase } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .like("description", "Credits gekauft%")
    .limit(1)
    .maybeSingle();

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId);

  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: visits } = await supabase
    .from("user_activity_visits")
    .select("visited_at")
    .eq("user_id", userId)
    .gte("visited_at", threeDaysAgo)
    .order("visited_at", { ascending: false })
    .limit(3);

  const visitCount = visits?.length ?? 0;
  const genInLast3Days =
    lastGenerationAt && new Date(lastGenerationAt) >= new Date(threeDaysAgo);
  const recentVisitsWithoutGen = visitCount >= 2 && !genInLast3Days;

  return {
    generationCount,
    distinctFeatureCount: types.size,
    lastGenerationAt,
    credits: profile.credits ?? 0,
    onboardingCompleted: profile.onboarding_completed ?? false,
    hasPurchase: !!purchase,
    hasReferred: (referralCount ?? 0) > 0,
    recentVisitsWithoutGen,
  };
}

export async function calculateChurnRisk(
  userId: string
): Promise<ChurnRiskResult> {
  let supabase: SupabaseClient;
  try {
    supabase = createServiceSupabaseClient();
  } catch {
    supabase = await createServerSupabaseClient();
  }

  const input = await loadChurnInput(supabase, userId);
  if (!input) {
    return {
      score: 0,
      risk: "low",
      reasons: ["Als churned markiert oder kein Profil"],
      recommendedAction: "Keine Aktion",
      daysSinceLastGeneration: null,
      lastGenerationAt: null,
    };
  }

  return scoreChurnFromData(input);
}

export async function loadChurnInputForUser(
  supabase: SupabaseClient,
  userId: string
) {
  return loadChurnInput(supabase, userId);
}

export { scoreChurnFromData as computeChurnScore };
