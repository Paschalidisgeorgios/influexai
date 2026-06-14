"use server";

import { requireAdmin } from "@/lib/admin";
import {
  type CommunityCreationItem,
  type CreatorBadgeId,
  type LeaderboardEntry,
  type ShowcaseSort,
  type ShowcaseTypeFilter,
  communityPreviewUrl,
  computeBadges,
} from "@/lib/community-creations";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { normalizeUsername } from "@/lib/creator-profile";
import { invokePushNotification } from "@/lib/push-notifications";
import { invalidateCommunityCache } from "@/lib/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const PAGE_SIZE = 12;

async function getReadClient() {
  try {
    return createServiceSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

type ProfileMini = {
  id: string;
  username: string | null;
  full_name: string | null;
  creator_niche: string | null;
};

type GenRow = {
  id: string;
  user_id: string;
  type: string;
  prompt: string;
  created_at: string;
  result: unknown;
};

async function loadPublicProfiles(
  supabase: Awaited<ReturnType<typeof getReadClient>>,
  userIds: string[]
): Promise<Map<string, ProfileMini>> {
  if (!userIds.length) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, creator_niche")
    .in("id", userIds)
    .eq("is_public", true)
    .not("username", "is", null);
  return new Map((data ?? []).map((p) => [p.id, p as ProfileMini]));
}

function authorFromProfile(p: ProfileMini | undefined, userId: string) {
  return {
    id: userId,
    username: p?.username ?? "creator",
    name: p?.full_name?.trim() || p?.username || "Creator",
    niche: p?.creator_niche?.trim() || "Creator",
  };
}

function assetMeta(type: string, result: unknown) {
  const asset = parseGenerationAssetResult(result);
  const assetKind =
    asset?.assetKind === "video" || type.includes("video")
      ? "video"
      : asset?.previewPath || asset?.finalPath || type === "image"
        ? "image"
        : "text";

  let viralScore: number | null = null;
  if (type === "viral_score" && result && typeof result === "object") {
    const r = result as { total_score?: number };
    if (typeof r.total_score === "number") viralScore = r.total_score;
  }

  const remixSourceUrl =
    typeof (result as { originalUrl?: string })?.originalUrl === "string"
      ? (result as { originalUrl: string }).originalUrl
      : null;

  return {
    assetKind: assetKind as "image" | "video" | "text",
    previewUrl:
      assetKind === "image" || assetKind === "video"
        ? communityPreviewUrl("")
        : null,
    viralScore,
    remixSourceUrl,
  };
}

async function enrichCreations(
  supabase: Awaited<ReturnType<typeof getReadClient>>,
  rows: GenRow[],
  viewerId: string | null
): Promise<CommunityCreationItem[]> {
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profiles = await loadPublicProfiles(supabase, userIds);
  const ids = rows.map((r) => r.id);

  const { data: likeRows } = ids.length
    ? await supabase
        .from("community_likes")
        .select("generation_id")
        .in("generation_id", ids)
    : { data: [] };

  const likeCountMap = new Map<string, number>();
  for (const l of likeRows ?? []) {
    likeCountMap.set(
      l.generation_id,
      (likeCountMap.get(l.generation_id) ?? 0) + 1
    );
  }

  let userLikes = new Set<string>();
  if (viewerId && ids.length) {
    const { data: mine } = await supabase
      .from("community_likes")
      .select("generation_id")
      .eq("user_id", viewerId)
      .in("generation_id", ids);
    userLikes = new Set((mine ?? []).map((l) => l.generation_id));
  }

  const { data: commentRows } = ids.length
    ? await supabase
        .from("community_comments")
        .select("generation_id")
        .in("generation_id", ids)
        .eq("is_deleted", false)
    : { data: [] };

  const commentCountMap = new Map<string, number>();
  for (const c of commentRows ?? []) {
    commentCountMap.set(
      c.generation_id,
      (commentCountMap.get(c.generation_id) ?? 0) + 1
    );
  }

  return rows
    .filter((row) => profiles.has(row.user_id))
    .map((row) => {
      const profile = profiles.get(row.user_id)!;
      const meta = assetMeta(row.type, row.result);
      return {
        id: row.id,
        type: row.type,
        prompt: row.prompt,
        createdAt: row.created_at,
        author: authorFromProfile(profile, row.user_id),
        likeCount: likeCountMap.get(row.id) ?? 0,
        commentCount: commentCountMap.get(row.id) ?? 0,
        userLiked: userLikes.has(row.id),
        previewUrl:
          meta.assetKind === "image" || meta.assetKind === "video"
            ? communityPreviewUrl(row.id)
            : null,
        assetKind: meta.assetKind,
        viralScore: meta.viralScore,
        remixSourceUrl: meta.remixSourceUrl,
      };
    });
}

async function fetchPublicGenerationRows(
  supabase: Awaited<ReturnType<typeof getReadClient>>,
  options: {
    sort: ShowcaseSort;
    typeFilter: ShowcaseTypeFilter;
    offset: number;
    limit: number;
    since?: string;
  }
) {
  let q = supabase
    .from("generations")
    .select("id, user_id, type, prompt, created_at, result")
    .eq("is_public", true);

  if (options.since) {
    q = q.gte("created_at", options.since);
  }

  if (options.typeFilter !== "all") {
    if (options.typeFilter === "lora") {
      q = q.ilike("type", "%lora%");
    } else {
      q = q.eq("type", options.typeFilter);
    }
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .range(options.offset, options.offset + options.limit - 1);

  if (error || !data?.length) return { rows: [] as GenRow[], hasMore: false };

  let rows = data as GenRow[];

  if (options.sort === "popular") {
    const ids = rows.map((r) => r.id);
    const { data: likes } = await supabase
      .from("community_likes")
      .select("generation_id")
      .in("generation_id", ids);
    const counts = new Map<string, number>();
    for (const l of likes ?? []) {
      counts.set(l.generation_id, (counts.get(l.generation_id) ?? 0) + 1);
    }
    rows = [...rows].sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
    );
  }

  return { rows, hasMore: data.length >= options.limit };
}

export async function getCommunityShowcase(
  sort: ShowcaseSort = "newest",
  typeFilter: ShowcaseTypeFilter = "all",
  offset = 0,
  viewerId: string | null = null
): Promise<{ items: CommunityCreationItem[]; hasMore: boolean }> {
  const supabase = await getReadClient();
  const { rows, hasMore } = await fetchPublicGenerationRows(supabase, {
    sort,
    typeFilter,
    offset,
    limit: PAGE_SIZE + 1,
  });
  const slice = rows.slice(0, PAGE_SIZE);
  const items = await enrichCreations(supabase, slice, viewerId);
  return { items, hasMore: hasMore && rows.length > PAGE_SIZE };
}

export async function getCommunityFeed(
  offset = 0,
  viewerId: string | null = null
): Promise<{ items: CommunityCreationItem[]; hasMore: boolean }> {
  return getCommunityShowcase("newest", "all", offset, viewerId);
}

export async function getCommunityLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await getReadClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: weekGens } = await supabase
    .from("generations")
    .select("user_id, type, result")
    .eq("is_public", true)
    .gte("created_at", weekAgo);

  const countByUser = new Map<string, number>();
  const viralByUser = new Map<string, number[]>();
  const loraByUser = new Set<string>();

  for (const g of weekGens ?? []) {
    countByUser.set(g.user_id, (countByUser.get(g.user_id) ?? 0) + 1);
    if (g.type === "viral_score" && g.result && typeof g.result === "object") {
      const score = (g.result as { total_score?: number }).total_score;
      if (typeof score === "number") {
        const list = viralByUser.get(g.user_id) ?? [];
        list.push(score);
        viralByUser.set(g.user_id, list);
      }
    }
    if (String(g.type).includes("lora")) loraByUser.add(g.user_id);
  }

  const sorted = [...countByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const userIds = sorted.map(([id]) => id);
  const profiles = await loadPublicProfiles(supabase, userIds);

  const entries: LeaderboardEntry[] = [];
  sorted.forEach(([userId, generationCount], index) => {
    const p = profiles.get(userId);
    if (!p?.username) return;
    const scores = viralByUser.get(userId);
    const avgViralScore = scores?.length
      ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
      : null;
    entries.push({
      userId,
      username: p.username!,
      displayName: p.full_name?.trim() || p.username!,
      generationCount,
      avgViralScore,
      badges: computeBadges({
        generationCount,
        avgViralScore,
        hasLora: loraByUser.has(userId),
      }),
      rank: index + 1,
    });
  });
  return entries;
}

export async function getCommunityPageData(viewerId: string | null) {
  const [showcase, feed, leaderboard] = await Promise.all([
    getCommunityShowcase("popular", "all", 0, viewerId),
    getCommunityFeed(0, viewerId),
    getCommunityLeaderboard(),
  ]);
  return { showcase, feed, leaderboard };
}

export async function setGenerationPublic(
  generationId: string,
  isPublic: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_public, username")
    .eq("id", user.id)
    .single();

  if (isPublic && (!profile?.is_public || !profile?.username)) {
    return {
      success: false,
      error: "Aktiviere zuerst dein öffentliches Profil mit Username.",
    };
  }

  const { error } = await supabase
    .from("generations")
    .update({ is_public: isPublic })
    .eq("id", generationId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  invalidateCommunityCache();
  return { success: true };
}

export async function toggleLikeCreation(generationId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const { data: existing } = await supabase
    .from("community_likes")
    .select("generation_id")
    .eq("generation_id", generationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("community_likes")
      .delete()
      .eq("generation_id", generationId)
      .eq("user_id", user.id);
    return { success: true as const, liked: false };
  }

  const read = await getReadClient();
  const { data: gen } = await read
    .from("generations")
    .select("user_id, is_public")
    .eq("id", generationId)
    .single();

  if (!gen?.is_public) {
    return { success: false as const, error: "Creation nicht öffentlich." };
  }

  const { error } = await supabase.from("community_likes").insert({
    generation_id: generationId,
    user_id: user.id,
  });

  if (error) return { success: false as const, error: error.message };

  if (gen.user_id !== user.id) {
    const { data: liker } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();
    const name =
      liker?.full_name?.trim().split(/\s+/)[0] ??
      liker?.username ??
      "Jemand";
    void invokePushNotification({
      userId: gen.user_id,
      type: "COMMUNITY_LIKE",
      variables: { name },
    });
  }

  return { success: true as const, liked: true };
}

export async function commentOnCreation(
  generationId: string,
  content: string
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const text = content.trim().slice(0, 500);
  if (!text) return { success: false as const, error: "Kommentar leer." };

  const { data: gen } = await supabase
    .from("generations")
    .select("user_id")
    .eq("id", generationId)
    .single();

  const { error } = await supabase.from("community_comments").insert({
    generation_id: generationId,
    user_id: user.id,
    content: text,
  });

  if (error) return { success: false as const, error: error.message };

  if (gen?.user_id && gen.user_id !== user.id) {
    const { data: commenter } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const name = commenter?.full_name?.trim().split(/\s+/)[0] ?? "Jemand";
    void invokePushNotification({
      userId: gen.user_id,
      type: "COMMUNITY_REPLY",
      variables: { name },
    });
  }

  return { success: true as const };
}

export async function getCreationComments(generationId: string) {
  const supabase = await getReadClient();
  const { data } = await supabase
    .from("community_comments")
    .select("id, user_id, content, created_at")
    .eq("generation_id", generationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(50);

  const userIds = [...new Set((data ?? []).map((c) => c.user_id))];
  const profiles = await loadPublicProfiles(supabase, userIds);

  return (data ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    author: authorFromProfile(profiles.get(c.user_id), c.user_id),
  }));
}

export async function reportCreation(generationId: string, reason: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const { error } = await supabase.from("community_creation_reports").insert({
    generation_id: generationId,
    reporter_id: user.id,
    reason: reason.trim().slice(0, 500) || "Gemeldet",
  });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

export async function toggleFollowUser(targetUserId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };
  if (user.id === targetUserId) {
    return { success: false as const, error: "Du kannst dir nicht selbst folgen." };
  }

  const { data: existing } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("community_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
    return { success: true as const, following: false };
  }

  const { error } = await supabase.from("community_follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });

  if (error) return { success: false as const, error: error.message };

  const { data: follower } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .single();
  const name =
    follower?.full_name?.trim().split(/\s+/)[0] ??
    follower?.username ??
    "Jemand";

  void invokePushNotification({
    userId: targetUserId,
    type: "COMMUNITY_FOLLOW",
    variables: { name },
  });

  return { success: true as const, following: true };
}

export async function getFollowState(
  targetUserId: string,
  viewerId: string | null
): Promise<{ followerCount: number; following: boolean }> {
  const supabase = await getReadClient();

  const { count } = await supabase
    .from("community_follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", targetUserId);

  let following = false;
  if (viewerId) {
    const { data } = await supabase
      .from("community_follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", targetUserId)
      .maybeSingle();
    following = !!data;
  }

  return { followerCount: count ?? 0, following };
}

export type PublicProfileView = {
  userId: string;
  username: string;
  fullName: string | null;
  bio: string | null;
  creatorNiche: string | null;
  generationCount: number;
  publicGenerationCount: number;
  followerCount: number;
  avgViralScore: number | null;
  badges: CreatorBadgeId[];
  following: boolean;
  creations: CommunityCreationItem[];
};

export async function fetchPublicProfileByUsername(
  username: string,
  viewerId: string | null = null
): Promise<PublicProfileView | null> {
  const normalized = normalizeUsername(username);
  const supabase = await getReadClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, creator_niche, is_public, subscriber_count"
    )
    .eq("username", normalized)
    .eq("is_public", true)
    .maybeSingle();

  if (!profile?.username) return null;

  const { count: generationCount } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("is_public", true);

  const { data: publicRows } = await supabase
    .from("generations")
    .select("id, user_id, type, prompt, created_at, result")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(24);

  const creations = await enrichCreations(
    supabase,
    (publicRows ?? []) as GenRow[],
    viewerId
  );

  const { data: viralRows } = await supabase
    .from("generations")
    .select("result")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .eq("type", "viral_score");

  const scores: number[] = [];
  for (const row of viralRows ?? []) {
    if (row.result && typeof row.result === "object") {
      const s = (row.result as { total_score?: number }).total_score;
      if (typeof s === "number") scores.push(s);
    }
  }

  const { data: loraCheck } = await supabase
    .from("generations")
    .select("id")
    .eq("user_id", profile.id)
    .ilike("type", "%lora%")
    .limit(1);

  const follow = await getFollowState(profile.id, viewerId);

  return {
    userId: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    bio: profile.bio,
    creatorNiche: profile.creator_niche,
    generationCount: generationCount ?? 0,
    publicGenerationCount: creations.length,
    followerCount: follow.followerCount,
    avgViralScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
    badges: computeBadges({
      generationCount: generationCount ?? 0,
      avgViralScore: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
      hasLora: (loraCheck?.length ?? 0) > 0,
    }),
    following: follow.following,
    creations,
  };
}

export async function adminGetCreationReports() {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = await getReadClient();
  const { data: reports } = await supabase
    .from("community_creation_reports")
    .select("id, generation_id, reporter_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(40);

  const genIds = [...new Set((reports ?? []).map((r) => r.generation_id))];
  const { data: gens } = genIds.length
    ? await supabase
        .from("generations")
        .select("id, user_id, type, prompt, created_at, result, is_public")
        .in("id", genIds)
    : { data: [] };

  const enriched = await enrichCreations(
    supabase,
    (gens ?? []).map((g) => ({
      id: g.id,
      user_id: g.user_id,
      type: g.type,
      prompt: g.prompt,
      created_at: g.created_at,
      result: g.result,
    })),
    null
  );
  const genMap = new Map(enriched.map((g) => [g.id, g]));

  return {
    reports: (reports ?? []).map((r) => ({
      ...r,
      creation: genMap.get(r.generation_id) ?? null,
    })),
  };
}

export async function adminHidePublicCreation(generationId: string) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getReadClient();
  const { error } = await supabase
    .from("generations")
    .update({ is_public: false })
    .eq("id", generationId);

  if (error) return { success: false, error: error.message };
  invalidateCommunityCache();
  return { success: true };
}
