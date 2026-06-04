import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardUserStats = {
  totalGenerations: number;
  weekScripts: number;
  weekVideos: number;
  weekThumbnails: number;
  creditsSpentWeek: number;
  streakDays: number;
};

const SCRIPT_TYPES = new Set([
  "script-generator",
  "script",
  "produkt",
  "video-ad",
]);
const VIDEO_TYPES = new Set([
  "live-creator",
  "live-creator-new",
  "video-remix",
  "remix",
  "produkt",
  "faceswap",
]);
const THUMB_TYPES = new Set(["thumbnail-concept", "thumbnail"]);

function startOfWeekIso(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const days = new Set(
    dates.map((iso) => {
      const d = new Date(iso);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    })
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  for (;;) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!days.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function fetchDashboardUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardUserStats> {
  const weekStart = startOfWeekIso();

  const { data: gens } = await supabase
    .from("generations")
    .select("type, created_at, credits_used")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = gens ?? [];
  const weekRows = rows.filter((r) => r.created_at >= weekStart);

  let weekScripts = 0;
  let weekVideos = 0;
  let weekThumbnails = 0;
  let creditsSpentWeek = 0;

  for (const r of weekRows) {
    creditsSpentWeek += r.credits_used ?? 0;
    if (SCRIPT_TYPES.has(r.type)) weekScripts += 1;
    else if (VIDEO_TYPES.has(r.type)) weekVideos += 1;
    else if (THUMB_TYPES.has(r.type)) weekThumbnails += 1;
  }

  const { data: tx } = await supabase
    .from("credit_transactions")
    .select("amount, created_at")
    .eq("user_id", userId)
    .lt("amount", 0)
    .gte("created_at", weekStart);

  if (tx?.length) {
    creditsSpentWeek = tx.reduce((s, t) => s + Math.abs(t.amount), 0);
  }

  return {
    totalGenerations: rows.length,
    weekScripts,
    weekVideos,
    weekThumbnails,
    creditsSpentWeek,
    streakDays: computeStreak(rows.map((r) => r.created_at)),
  };
}
