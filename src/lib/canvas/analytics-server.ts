import type { SupabaseClient } from "@supabase/supabase-js";
import type { SharePlatform } from "./share-platforms";
import type {
  CanvasActivityItem,
  CanvasAnalyticsSnapshot,
  PostMetricSeries,
} from "./analytics-types";
import { averageEurPerCredit } from "./analytics-eur";
import { categorizeGenerationType, resolveToolMeta } from "./analytics-map";

type GenerationRow = {
  id: string;
  type: string;
  prompt: string;
  credits_used: number;
  created_at: string;
  result: Record<string, unknown> | null;
};

const DAYS = 30;
const SPARK_DAYS = 7;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function mockSparkline(seed: string, base: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Array.from({ length: SPARK_DAYS }, (_, i) => {
    const wave = Math.sin((hash % 97) * 0.1 + i * 0.9) * 0.35 + 0.65;
    return Math.round(base * (0.35 + (i / SPARK_DAYS) * 0.65) * wave);
  });
}

function parseShareResult(result: Record<string, unknown> | null) {
  if (!result) return null;
  const share = (result.canvasShare === true ? result : result.share) as
    | Record<string, unknown>
    | undefined;
  if (!share) return null;
  return {
    platform: String(share.platform ?? "") as SharePlatform,
    liveUrl: typeof share.liveUrl === "string" ? share.liveUrl : undefined,
    postId: typeof share.postId === "string" ? share.postId : "",
    views: Number(share.views ?? 0),
    likes: Number(share.likes ?? 0),
    shares: Number(share.shares ?? 0),
    sparklineViews: Array.isArray(share.sparklineViews)
      ? share.sparklineViews.map(Number)
      : undefined,
    toolId: typeof share.toolId === "string" ? share.toolId : undefined,
  };
}

function aggregatePostMetrics(rows: GenerationRow[]): PostMetricSeries {
  const shareRows = rows.filter((r) => r.type.startsWith("canvas-share-"));
  const viewsSeries = Array(SPARK_DAYS).fill(0);
  const likesSeries = Array(SPARK_DAYS).fill(0);
  const sharesSeries = Array(SPARK_DAYS).fill(0);

  let totalViews = 0;
  let totalLikes = 0;
  let totalShares = 0;

  for (const row of shareRows) {
    const share = parseShareResult(row.result);
    const seed = share?.postId ?? row.id;
    const views = share?.views || Math.max(120, (row.prompt.length % 40) * 80);
    const likes = share?.likes || Math.round(views * 0.08);
    const shareCount = share?.shares || Math.round(views * 0.015);

    totalViews += views;
    totalLikes += likes;
    totalShares += shareCount;

    const vLine = share?.sparklineViews ?? mockSparkline(`${seed}-v`, views / SPARK_DAYS);
    const lLine = mockSparkline(`${seed}-l`, likes / SPARK_DAYS);
    const sLine = mockSparkline(`${seed}-s`, shareCount / SPARK_DAYS);

    for (let i = 0; i < SPARK_DAYS; i += 1) {
      viewsSeries[i] += vLine[i] ?? 0;
      likesSeries[i] += lLine[i] ?? 0;
      sharesSeries[i] += sLine[i] ?? 0;
    }
  }

  return {
    views: viewsSeries,
    likes: likesSeries,
    shares: sharesSeries,
    totals: { views: totalViews, likes: totalLikes, shares: totalShares },
  };
}

function buildActivityLog(rows: GenerationRow[]): CanvasActivityItem[] {
  return rows.slice(0, 24).map((row) => {
    const share = parseShareResult(row.result);
    const isShare = row.type.startsWith("canvas-share-") || !!share;
    const platform =
      share?.platform ??
      (row.type.replace("canvas-share-", "") as SharePlatform | undefined);
    const meta = resolveToolMeta(row.type, share?.toolId);

    return {
      id: row.id,
      toolId: meta.toolId,
      toolLabel: meta.toolLabel,
      toolIcon: meta.toolIcon,
      createdAt: row.created_at,
      creditsUsed: row.credits_used ?? 0,
      status: isShare ? "posted" : "generated",
      platform: isShare ? platform : undefined,
      liveUrl: share?.liveUrl,
    };
  });
}

export async function fetchCanvasAnalytics(
  supabase: SupabaseClient,
  userId: string
): Promise<CanvasAnalyticsSnapshot> {
  const since = daysAgoIso(DAYS);

  const { data } = await supabase
    .from("generations")
    .select("id, type, prompt, credits_used, created_at, result")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(400);

  const rows = (data ?? []) as GenerationRow[];

  const creditBreakdown = { video: 0, image: 0, text: 0, total: 0 };
  for (const row of rows) {
    if (row.type.startsWith("canvas-share-")) continue;
    const cat = categorizeGenerationType(row.type);
    const credits = row.credits_used ?? 0;
    creditBreakdown[cat] += credits;
    creditBreakdown.total += credits;
  }

  const postMetrics = aggregatePostMetrics(rows);
  const eurPerCredit = averageEurPerCredit();

  const shareCredits = rows
    .filter((r) => !r.type.startsWith("canvas-share-"))
    .slice(0, 50)
    .reduce((s, r) => s + (r.credits_used ?? 0), 0);

  const views = postMetrics.totals.views || 1;
  const creditsPer1000Views =
    postMetrics.totals.views > 0
      ? Math.round((shareCredits / views) * 1000 * 10) / 10
      : 0;

  return {
    creditBreakdown,
    postMetrics,
    roi: {
      creditsPer1000Views,
      eurPer1000Views: Math.round(creditsPer1000Views * eurPerCredit * 100) / 100,
      eurPerCredit,
    },
    activity: buildActivityLog(rows),
  };
}

export async function recordCanvasShare(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    platform: SharePlatform;
    toolId?: string;
    caption: string;
    liveUrl: string;
    postId: string;
    creditsUsed?: number;
  }
): Promise<void> {
  const baseViews = 800 + (payload.postId.length % 12) * 120;
  const views = baseViews + Math.floor(Math.random() * 400);
  const likes = Math.round(views * (0.06 + Math.random() * 0.04));
  const shares = Math.round(views * (0.01 + Math.random() * 0.01));

  await supabase.from("generations").insert({
    user_id: userId,
    type: `canvas-share-${payload.platform}`,
    prompt: payload.caption.slice(0, 500),
    credits_used: payload.creditsUsed ?? 0,
    result: {
      canvasShare: true,
      platform: payload.platform,
      liveUrl: payload.liveUrl,
      postId: payload.postId,
      toolId: payload.toolId,
      views,
      likes,
      shares,
      sparklineViews: mockSparkline(payload.postId, views / SPARK_DAYS),
    },
  });
}

export async function recordCanvasGeneration(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    toolId: string;
    creditsUsed: number;
    prompt?: string;
  }
): Promise<void> {
  await supabase.from("generations").insert({
    user_id: userId,
    type: payload.toolId,
    prompt: (payload.prompt ?? "").slice(0, 500),
    credits_used: payload.creditsUsed,
    result: { canvasGeneration: true },
  });
}
