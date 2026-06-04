"use server";

import { getCachedAnalytics } from "@/lib/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AnalyticsDateRange = "7d" | "30d" | "90d" | "all";

const FLOW_KEYS = [
  "script-generator",
  "niche-analyzer",
  "outlier-detector",
  "video-remix",
  "produkt",
  "ki-ich",
] as const;

const FLOW_LABELS: Record<(typeof FLOW_KEYS)[number], string> = {
  "script-generator": "Script",
  "niche-analyzer": "Niche Analyzer",
  "outlier-detector": "Outlier",
  "video-remix": "Remix",
  produkt: "Video Ad",
  "ki-ich": "KI-Ich",
};

const TYPE_LABELS: Record<string, string> = {
  ...FLOW_LABELS,
  "voice-tts": "Voice TTS",
  "stimme-clone": "Stimme Clone",
  "stimme-speak": "Stimme Speak",
};

function friendlyFlowLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/-/g, " ");
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const offset = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function rangeStart(range: AnalyticsDateRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

function buildDailySeries(
  dateKeys: string[],
  range: AnalyticsDateRange
): { date: string; count: number; label: string }[] {
  const counts = new Map<string, number>();
  for (const key of dateKeys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start =
    rangeStart(range) ??
    (() => {
      if (dateKeys.length === 0) {
        const s = new Date();
        s.setDate(s.getDate() - 6);
        return s;
      }
      const min = dateKeys.reduce((a, b) => (a < b ? a : b));
      return new Date(`${min}T00:00:00`);
    })();

  const series: { date: string; count: number; label: string }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    series.push({
      date: key,
      count: counts.get(key) ?? 0,
      label: cursor.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "short",
      }),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

function computeStreaks(dateKeys: string[]): {
  current: number;
  record: number;
} {
  if (dateKeys.length === 0) return { current: 0, record: 0 };

  const unique = [...new Set(dateKeys)].sort();
  let record = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${unique[i - 1]}T12:00:00`);
    const curr = new Date(`${unique[i]}T12:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      run += 1;
      record = Math.max(record, run);
    } else {
      run = 1;
    }
  }

  const active = new Set(unique);
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!active.has(key)) break;
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, record };
}

function countOutlierConcepts(results: unknown): number {
  if (!Array.isArray(results)) return 0;
  return results.length;
}

export type AnalyticsData = {
  totalGenerations: number;
  thisWeekGenerations: number;
  totalCreditsSpent: number;
  avgCreditsPerGeneration: number;
  mostUsedFlow: { name: string; count: number } | null;
  currentStreak: number;
  recordStreak: number;
  dailyActivity: { date: string; count: number; label: string }[];
  flowUsage: { key: string; label: string; count: number }[];
  creditHistory: {
    date: string;
    amount: number;
    description: string;
    balance: number;
    isPurchase: boolean;
  }[];
  recentTransactions: {
    date: string;
    action: string;
    amount: number;
    balance: number;
  }[];
  savedCounts: { scripts: number; nicheIdeas: number; outlierConcepts: number };
  savedPreviews: {
    id: string;
    kind: "script" | "niche" | "outlier";
    title: string;
    createdAt: string;
    href: string;
  }[];
};

export type AnalyticsResult = { error: string } | { data: AnalyticsData };

export async function getAnalytics(
  range: AnalyticsDateRange = "7d"
): Promise<AnalyticsResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht eingeloggt." };
  }

  return getCachedAnalytics(user.id, range);
}

export async function getAnalyticsUncached(
  userId: string,
  range: AnalyticsDateRange = "7d"
): Promise<AnalyticsResult> {
  const supabase = await createServerSupabaseClient();
  const rangeFrom = rangeStart(range);

  const [
    gensRes,
    creditsRes,
    profileRes,
    scriptsCountRes,
    scriptsPreviewRes,
    nicheCountRes,
    nichePreviewRes,
    outlierRes,
  ] = await Promise.all([
    supabase
      .from("generations")
      .select("created_at, type, credits_used")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("credit_transactions")
      .select("created_at, amount, description")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("credits").eq("id", userId).single(),
    supabase
      .from("saved_scripts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("saved_scripts")
      .select("id, topic, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("niche_saves")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("niche_saves")
      .select("id, niche_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("outlier_results")
      .select("id, niche, results, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const generations = gensRes.data ?? [];
  const transactions = creditsRes.data ?? [];
  const currentCredits = profileRes.data?.credits ?? 0;

  const weekStart = startOfWeekMonday(new Date());
  const allDateKeys = generations.map((g) => toDateKey(g.created_at));
  const filteredGens =
    rangeFrom === null
      ? generations
      : generations.filter((g) => new Date(g.created_at) >= rangeFrom!);
  const filteredDateKeys = filteredGens.map((g) => toDateKey(g.created_at));

  const totalGenerations = generations.length;
  const thisWeekGenerations = generations.filter(
    (g) => new Date(g.created_at) >= weekStart
  ).length;

  const totalCreditsSpent = generations.reduce(
    (sum, g) => sum + (g.credits_used ?? 0),
    0
  );
  const avgCreditsPerGeneration =
    totalGenerations > 0
      ? Math.round((totalCreditsSpent / totalGenerations) * 10) / 10
      : 0;

  const typeCounts = new Map<string, number>();
  for (const g of generations) {
    typeCounts.set(g.type, (typeCounts.get(g.type) ?? 0) + 1);
  }
  let mostUsedFlow: { name: string; count: number } | null = null;
  for (const [type, count] of typeCounts) {
    if (!mostUsedFlow || count > mostUsedFlow.count) {
      mostUsedFlow = { name: friendlyFlowLabel(type), count };
    }
  }

  const { current: currentStreak, record: recordStreak } =
    computeStreaks(allDateKeys);

  const dailyActivity = buildDailySeries(filteredDateKeys, range);

  const flowUsage = FLOW_KEYS.map((key) => ({
    key,
    label: FLOW_LABELS[key],
    count: typeCounts.get(key) ?? 0,
  }));

  const totalDelta = transactions.reduce((s, t) => s + t.amount, 0);
  let balance = currentCredits - totalDelta;

  const fullCreditHistory = transactions.map((t) => {
    balance += t.amount;
    return {
      date: t.created_at,
      amount: t.amount,
      description: t.description,
      balance,
      isPurchase: t.amount > 0,
    };
  });

  const creditHistory = fullCreditHistory.slice(-30);

  const recentTransactions = [...fullCreditHistory]
    .reverse()
    .slice(0, 10)
    .map((t) => ({
      date: t.date,
      action: t.description,
      amount: t.amount,
      balance: t.balance,
    }));

  let outlierConcepts = 0;
  for (const row of outlierRes.data ?? []) {
    outlierConcepts += countOutlierConcepts(row.results);
  }

  const savedPreviews: AnalyticsData["savedPreviews"] = [];

  for (const s of scriptsPreviewRes.data ?? []) {
    savedPreviews.push({
      id: s.id,
      kind: "script",
      title: s.topic,
      createdAt: s.created_at,
      href: "/dashboard/script-generator/saved",
    });
  }
  for (const n of nichePreviewRes.data ?? []) {
    const data = n.niche_data as { title?: string };
    savedPreviews.push({
      id: n.id,
      kind: "niche",
      title: data?.title ?? "Gespeicherte Nische",
      createdAt: n.created_at,
      href: "/dashboard/niche-analyzer",
    });
  }
  for (const o of (outlierRes.data ?? []).slice(0, 3)) {
    savedPreviews.push({
      id: o.id,
      kind: "outlier",
      title: o.niche,
      createdAt: o.created_at,
      href: "/dashboard/outlier-detector",
    });
  }

  savedPreviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    data: {
      totalGenerations,
      thisWeekGenerations,
      totalCreditsSpent,
      avgCreditsPerGeneration,
      mostUsedFlow,
      currentStreak,
      recordStreak,
      dailyActivity,
      flowUsage,
      creditHistory,
      recentTransactions,
      savedCounts: {
        scripts: scriptsCountRes.count ?? 0,
        nicheIdeas: nicheCountRes.count ?? 0,
        outlierConcepts,
      },
      savedPreviews: savedPreviews.slice(0, 3),
    },
  };
}
