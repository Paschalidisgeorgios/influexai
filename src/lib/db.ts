/**
 * Centralized, index-friendly Supabase queries.
 *
 * EXPLAIN ANALYZE notes (run in Supabase SQL editor after migration 018):
 *
 * 1) fetchCreditsBalance
 *    Index Scan on profiles (PK id) — O(1), ~0.05ms
 *
 * 2) fetchCommunityPostRows
 *    Index Scan on idx_community_posts_created OR idx_community_posts_type
 *    Filter: is_deleted = false — Bitmap/Index Scan, sorts by created_at DESC
 *
 * 3) fetchGenerationsForUser
 *    Index Scan on idx_generations_user_created — avoids seq scan on generations
 *
 * 4) fetchCreditTransactionsForUser
 *    Index Scan on idx_credit_transactions_user_created
 *
 * 5) fetchReferralsByReferrer
 *    Index Scan on idx_referrals_referrer_status
 */

import type { CommunityFeedFilter } from "@/lib/community";
import type { AnalyticsDateRange } from "@/app/actions/get-analytics";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const PAGE_SIZE = 10;

function getService() {
  return createServiceSupabaseClient();
}

export async function fetchCreditsBalance(userId: string): Promise<number> {
  const supabase = getService();
  const { data } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  return data?.credits ?? 0;
}

export type ProfileSummary = {
  credits: number;
  plan: string;
  fullName: string | null;
  creatorNiche: string | null;
};

export async function fetchProfileSummary(
  userId: string
): Promise<ProfileSummary | null> {
  const supabase = getService();
  const { data } = await supabase
    .from("profiles")
    .select("credits, plan, full_name, creator_niche")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    credits: data.credits ?? 0,
    plan: data.plan ?? "free",
    fullName: data.full_name,
    creatorNiche: data.creator_niche,
  };
}

export type CommunityPostRow = {
  id: string;
  user_id: string;
  type: "win" | "idea" | "question";
  content: string;
  metric: string | null;
  niche: string;
  created_at: string;
  challenge_id: string | null;
  reactions_fire: number;
  reactions_applause: number;
  reactions_insight: number;
};

export async function fetchCommunityPostRows(
  filter: CommunityFeedFilter,
  page: number
): Promise<{ rows: CommunityPostRow[]; hasMore: boolean }> {
  const supabase = getService();
  const offset = page * PAGE_SIZE;

  let q = supabase
    .from("community_posts")
    .select(
      "id, user_id, type, content, metric, niche, created_at, challenge_id, reactions_fire, reactions_applause, reactions_insight"
    )
    .eq("is_deleted", false);

  if (filter === "win" || filter === "idea" || filter === "question") {
    q = q.eq("type", filter);
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error || !data) return { rows: [], hasMore: false };
  return {
    rows: data as CommunityPostRow[],
    hasMore: data.length === PAGE_SIZE,
  };
}

export async function fetchActiveChallengeRow() {
  const supabase = getService();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("community_challenges")
    .select("id, title, description, start_date, end_date")
    .lte("start_date", now)
    .gte("end_date", now)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function fetchGenerationsForUser(
  userId: string,
  limit = 500
): Promise<{ type: string; created_at: string }[]> {
  const supabase = getService();
  const { data } = await supabase
    .from("generations")
    .select("type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchLiveStatsRaw() {
  const supabase = getService();
  const [usersRes, gensRes, scriptsRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("generations").select("*", { count: "exact", head: true }),
    supabase.from("saved_scripts").select("*", { count: "exact", head: true }),
  ]);
  return {
    users: usersRes.count ?? 0,
    generations: gensRes.count ?? 0,
    scripts: scriptsRes.count ?? 0,
  };
}

/** Uncached analytics body — wrapped by getCachedAnalytics in lib/cache.ts */
export async function fetchAnalyticsData(
  userId: string,
  range: AnalyticsDateRange
) {
  const { getAnalyticsUncached } = await import("@/app/actions/get-analytics");
  return getAnalyticsUncached(userId, range);
}
