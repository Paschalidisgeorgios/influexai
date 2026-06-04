import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import type { CommunityFeedFilter } from "@/lib/community";
import type { AnalyticsDateRange } from "@/app/actions/get-analytics";
import {
  fetchAnalyticsData,
  fetchCommunityPostRows,
  fetchCreditsBalance,
  fetchLiveStatsRaw,
  fetchProfileSummary,
  fetchActiveChallengeRow,
} from "@/lib/db";

export const CACHE_TAGS = {
  user: (userId: string) => `user-${userId}`,
  credits: (userId: string) => `credits-${userId}`,
  generations: (userId: string) => `generations-${userId}`,
  community: "community-posts",
  analytics: (userId: string) => `analytics-${userId}`,
  leaderboard: "leaderboard",
  challenges: "challenges",
  liveStats: "live-stats",
} as const;

const REVALIDATE_PROFILE = "max" as const;

export function invalidateUserCredits(userId: string) {
  revalidateTag(CACHE_TAGS.credits(userId), REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.user(userId), REVALIDATE_PROFILE);
}

export function invalidateUserGenerations(userId: string) {
  revalidateTag(CACHE_TAGS.generations(userId), REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.analytics(userId), REVALIDATE_PROFILE);
  invalidateUserCredits(userId);
}

export function invalidateCommunityCache() {
  revalidateTag(CACHE_TAGS.community, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.challenges, REVALIDATE_PROFILE);
}

export function getCachedCredits(userId: string) {
  return unstable_cache(
    async () => fetchCreditsBalance(userId),
    ["user-credits", userId],
    { revalidate: 30, tags: [CACHE_TAGS.credits(userId)] }
  )();
}

export function getCachedProfileSummary(userId: string) {
  return unstable_cache(
    async () => fetchProfileSummary(userId),
    ["user-profile", userId],
    { revalidate: 300, tags: [CACHE_TAGS.user(userId)] }
  )();
}

export function getCachedCommunityPosts(
  filter: CommunityFeedFilter,
  page: number
) {
  return unstable_cache(
    async () => fetchCommunityPostRows(filter, page),
    ["community-posts", filter, String(page)],
    { revalidate: 60, tags: [CACHE_TAGS.community] }
  )();
}

export function getCachedActiveChallenge() {
  return unstable_cache(
    async () => fetchActiveChallengeRow(),
    ["active-challenge"],
    { revalidate: 60, tags: [CACHE_TAGS.challenges] }
  )();
}

export function getCachedAnalytics(userId: string, range: AnalyticsDateRange) {
  return unstable_cache(
    async () => fetchAnalyticsData(userId, range),
    ["analytics", userId, range],
    { revalidate: 300, tags: [CACHE_TAGS.analytics(userId)] }
  )();
}

export const getCachedLiveStats = unstable_cache(
  async () => fetchLiveStatsRaw(),
  ["live-stats"],
  { revalidate: 3600, tags: [CACHE_TAGS.liveStats] }
);
