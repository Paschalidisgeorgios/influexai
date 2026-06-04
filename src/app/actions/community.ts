"use server";

import { requireAdmin } from "@/lib/admin";
import type {
  CommunityChallenge,
  CommunityFeedFilter,
  CommunityPost,
  CommunityPostType,
  CommunityReactionType,
} from "@/lib/community";
import {
  getCachedActiveChallenge,
  getCachedCommunityPosts,
  invalidateCommunityCache,
} from "@/lib/cache";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  invokePushNotification,
  invokePushToMany,
} from "@/lib/push-notifications";

const PAGE_SIZE = 10;

async function getReadClient() {
  try {
    return createServiceSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  creator_niche: string | null;
};

async function loadProfiles(
  supabase: Awaited<ReturnType<typeof getReadClient>>,
  userIds: string[]
): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, creator_niche")
    .in("id", userIds);
  return new Map((data ?? []).map((p) => [p.id, p]));
}

function authorFromProfile(p: ProfileRow | undefined, fallbackId: string) {
  return {
    id: fallbackId,
    name: p?.full_name?.trim() || "Creator",
    niche: p?.creator_niche?.trim() || "Creator",
  };
}

type PostRow = {
  id: string;
  user_id: string;
  type: CommunityPostType;
  content: string;
  metric: string | null;
  niche: string;
  created_at: string;
  challenge_id: string | null;
  reactions_fire: number;
  reactions_applause: number;
  reactions_insight: number;
};

async function enrichPosts(
  supabase: Awaited<ReturnType<typeof getReadClient>>,
  rows: PostRow[],
  viewerId: string | null
): Promise<CommunityPost[]> {
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profiles = await loadProfiles(supabase, userIds);
  const postIds = rows.map((r) => r.id);

  const { data: replies } = await supabase
    .from("community_replies")
    .select("id, post_id, user_id, content, created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  const replyUserIds = [...new Set((replies ?? []).map((r) => r.user_id))];
  const replyProfiles = await loadProfiles(supabase, replyUserIds);

  const replyMap = new Map<string, typeof replies>();
  for (const r of replies ?? []) {
    const list = replyMap.get(r.post_id) ?? [];
    list.push(r);
    replyMap.set(r.post_id, list);
  }

  let userReactions = new Map<string, CommunityReactionType>();
  if (viewerId && postIds.length > 0) {
    const { data: rx } = await supabase
      .from("community_reactions")
      .select("post_id, reaction_type")
      .eq("user_id", viewerId)
      .in("post_id", postIds);
    userReactions = new Map(
      (rx ?? []).map((r) => [
        r.post_id,
        r.reaction_type as CommunityReactionType,
      ])
    );
  }

  return rows.map((row) => {
    const allReplies = replyMap.get(row.id) ?? [];
    const shown = allReplies.slice(-3);
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      metric: row.metric,
      niche: row.niche,
      createdAt: row.created_at,
      challengeId: row.challenge_id,
      author: authorFromProfile(profiles.get(row.user_id), row.user_id),
      reactionsFire: row.reactions_fire,
      reactionsApplause: row.reactions_applause,
      reactionsInsight: row.reactions_insight,
      userReaction: userReactions.get(row.id) ?? null,
      replyCount: allReplies.length,
      replies: shown.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.created_at,
        author: authorFromProfile(replyProfiles.get(r.user_id), r.user_id),
      })),
    };
  });
}

export async function getActiveChallenge(
  viewerId: string | null
): Promise<CommunityChallenge | null> {
  const supabase = await getReadClient();
  const challenge = await getCachedActiveChallenge();

  if (!challenge) return null;

  const { count } = await supabase
    .from("challenge_participants")
    .select("user_id", { count: "exact", head: true })
    .eq("challenge_id", challenge.id);

  let userJoined = false;
  if (viewerId) {
    const { data: joined } = await supabase
      .from("challenge_participants")
      .select("user_id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", viewerId)
      .maybeSingle();
    userJoined = !!joined;
  }

  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    startDate: challenge.start_date,
    endDate: challenge.end_date,
    participantCount: count ?? 0,
    userJoined,
  };
}

export async function getCommunityPosts(
  filter: CommunityFeedFilter = "all",
  offset = 0,
  viewerId: string | null = null
): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
  const supabase = await getReadClient();
  const page = Math.floor(offset / PAGE_SIZE);
  const { rows, hasMore } = await getCachedCommunityPosts(filter, page);

  if (!rows.length) return { posts: [], hasMore: false };

  const posts = await enrichPosts(supabase, rows as PostRow[], viewerId);
  return { posts, hasMore };
}

export async function getHallOfFameWins(
  period: "month" | "all",
  viewerId: string | null = null
): Promise<CommunityPost[]> {
  const supabase = await getReadClient();

  let q = supabase
    .from("community_posts")
    .select(
      "id, user_id, type, content, metric, niche, created_at, challenge_id, reactions_fire, reactions_applause, reactions_insight"
    )
    .eq("is_deleted", false)
    .eq("type", "win");

  if (period === "month") {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    q = q.gte("created_at", start.toISOString());
  }

  const { data } = await q.order("created_at", { ascending: false }).limit(100);

  if (!data?.length) return [];

  const sorted = [...data].sort((a, b) => {
    const scoreA =
      a.reactions_fire + a.reactions_applause + a.reactions_insight;
    const scoreB =
      b.reactions_fire + b.reactions_applause + b.reactions_insight;
    return scoreB - scoreA;
  });

  const top = sorted.slice(0, 12) as PostRow[];
  return enrichPosts(supabase, top, viewerId);
}

export async function getRecentWinPosts(limit = 3): Promise<CommunityPost[]> {
  const supabase = await getReadClient();
  const { rows } = await getCachedCommunityPosts("win", 0);
  const slice = rows.slice(0, limit);
  if (!slice.length) return [];
  return enrichPosts(supabase, slice as PostRow[], null);
}

export async function getCommunityInitial(viewerId: string | null) {
  const [challenge, feed, hallMonth, profile] = await Promise.all([
    getActiveChallenge(viewerId),
    getCommunityPosts("all", 0, viewerId),
    getHallOfFameWins("month", viewerId),
    viewerId
      ? (async () => {
          const supabase = await createServerSupabaseClient();
          const { data } = await supabase
            .from("profiles")
            .select("full_name, creator_niche")
            .eq("id", viewerId)
            .single();
          return data;
        })()
      : Promise.resolve(null),
  ]);

  return {
    challenge,
    posts: feed.posts,
    hasMore: feed.hasMore,
    hallOfFame: hallMonth,
    defaultNiche: profile?.creator_niche?.trim() || "Creator",
    userName: profile?.full_name?.trim() || "Creator",
  };
}

export async function createCommunityPost(input: {
  type: CommunityPostType;
  content: string;
  metric?: string;
  niche: string;
  challengeId?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const content = input.content.trim().slice(0, 280);
  if (!content) return { success: false as const, error: "Inhalt fehlt." };

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      type: input.type,
      content,
      metric: input.metric?.trim() || null,
      niche: input.niche.trim() || "Creator",
      challenge_id: input.challengeId ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: error.message };
  invalidateCommunityCache();
  return { success: true as const, postId: data.id };
}

export async function reactToPost(
  postId: string,
  reactionType: CommunityReactionType
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const read = await getReadClient();

  const { data: post } = await read
    .from("community_posts")
    .select("reactions_fire, reactions_applause, reactions_insight, is_deleted")
    .eq("id", postId)
    .single();

  if (!post || post.is_deleted) {
    return { success: false as const, error: "Post nicht gefunden." };
  }

  const { data: existing } = await supabase
    .from("community_reactions")
    .select("reaction_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const fieldMap = {
    fire: "reactions_fire",
    applause: "reactions_applause",
    insight: "reactions_insight",
  } as const;

  let fire = post.reactions_fire;
  let applause = post.reactions_applause;
  let insight = post.reactions_insight;

  if (existing) {
    if (existing.reaction_type === reactionType) {
      return { success: true as const, unchanged: true };
    }
    const oldField = fieldMap[existing.reaction_type as CommunityReactionType];
    if (oldField === "reactions_fire") fire = Math.max(0, fire - 1);
    if (oldField === "reactions_applause") applause = Math.max(0, applause - 1);
    if (oldField === "reactions_insight") insight = Math.max(0, insight - 1);

    await supabase
      .from("community_reactions")
      .update({ reaction_type: reactionType })
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("community_reactions").insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: reactionType,
    });
  }

  const newField = fieldMap[reactionType];
  if (newField === "reactions_fire") fire += 1;
  if (newField === "reactions_applause") applause += 1;
  if (newField === "reactions_insight") insight += 1;

  await read
    .from("community_posts")
    .update({
      reactions_fire: fire,
      reactions_applause: applause,
      reactions_insight: insight,
    })
    .eq("id", postId);

  return { success: true as const };
}

export async function replyToPost(postId: string, content: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const text = content.trim().slice(0, 140);
  if (!text) return { success: false as const, error: "Antwort leer." };

  const { data: post } = await supabase
    .from("community_posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  const { error } = await supabase.from("community_replies").insert({
    post_id: postId,
    user_id: user.id,
    content: text,
  });

  if (error) return { success: false as const, error: error.message };

  if (post?.user_id && post.user_id !== user.id) {
    const { data: replier } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const name = replier?.full_name?.trim().split(/\s+/)[0] ?? "Jemand";
    void invokePushNotification({
      userId: post.user_id,
      type: "COMMUNITY_REPLY",
      variables: { name },
    });
  }

  return { success: true as const };
}

export async function reportPost(postId: string, reason: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const { error } = await supabase.from("community_reports").insert({
    post_id: postId,
    reporter_id: user.id,
    reason: reason.trim().slice(0, 500) || "Gemeldet",
  });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

export async function joinChallenge(challengeId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Nicht eingeloggt." };

  const { error } = await supabase.from("challenge_participants").upsert({
    challenge_id: challengeId,
    user_id: user.id,
  });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

// --- Admin ---

export async function getAdminCommunityData() {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = await getReadClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { count: totalPosts } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_deleted", false);

  const { data: weekPosts } = await supabase
    .from("community_posts")
    .select("user_id")
    .eq("is_deleted", false)
    .gte("created_at", weekAgo);

  const activeUsers = new Set((weekPosts ?? []).map((p) => p.user_id)).size;

  const { data: allPosts } = await supabase
    .from("community_posts")
    .select(
      "id, user_id, type, content, metric, niche, created_at, challenge_id, reactions_fire, reactions_applause, reactions_insight"
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = await enrichPosts(
    supabase,
    (allPosts ?? []) as PostRow[],
    null
  );

  let topPost: CommunityPost | null = null;
  if (posts.length > 0) {
    topPost = [...posts].sort(
      (a, b) =>
        b.reactionsFire +
        b.reactionsApplause +
        b.reactionsInsight -
        (a.reactionsFire + a.reactionsApplause + a.reactionsInsight)
    )[0];
  }

  const { data: reports } = await supabase
    .from("community_reports")
    .select("id, post_id, reporter_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const reportPostIds = [...new Set((reports ?? []).map((r) => r.post_id))];
  const { data: reportedPosts } = reportPostIds.length
    ? await supabase
        .from("community_posts")
        .select(
          "id, user_id, type, content, metric, niche, created_at, challenge_id, reactions_fire, reactions_applause, reactions_insight"
        )
        .in("id", reportPostIds)
    : { data: [] };

  const reportPostsEnriched = await enrichPosts(
    supabase,
    (reportedPosts ?? []) as PostRow[],
    null
  );
  const reportPostMap = new Map(reportPostsEnriched.map((p) => [p.id, p]));

  const { data: challenges } = await supabase
    .from("community_challenges")
    .select("id, title, description, start_date, end_date, created_at")
    .order("start_date", { ascending: false })
    .limit(10);

  return {
    stats: {
      totalPosts: totalPosts ?? 0,
      activeUsersWeek: activeUsers,
      topPostPreview: topPost
        ? `${topPost.content.slice(0, 60)}… (${topPost.reactionsFire + topPost.reactionsApplause + topPost.reactionsInsight} Reaktionen)`
        : "—",
    },
    posts,
    reports: (reports ?? []).map((r) => ({
      ...r,
      post: reportPostMap.get(r.post_id) ?? null,
    })),
    challenges: challenges ?? [],
  };
}

export async function adminDeleteCommunityPost(postId: string) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getReadClient();
  const { error } = await supabase
    .from("community_posts")
    .update({ is_deleted: true })
    .eq("id", postId);

  if (error) return { success: false, error: error.message };
  invalidateCommunityCache();
  return { success: true };
}

export async function adminCreateChallenge(input: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = await getReadClient();
  const { error } = await supabase.from("community_challenges").insert({
    title: input.title.trim(),
    description: input.description.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
  });

  if (error) return { success: false, error: error.message };
  invalidateCommunityCache();

  const service = createServiceSupabaseClient();
  const { data: subscribers } = await service
    .from("profiles")
    .select("id")
    .not("push_token", "is", null);

  const userIds = (subscribers ?? []).map((p) => p.id);
  if (userIds.length > 0) {
    void invokePushToMany(userIds, "WEEKLY_CHALLENGE", {
      challengeTitle: input.title.trim(),
    });
  }

  return { success: true };
}
