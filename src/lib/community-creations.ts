export type ShowcaseSort = "newest" | "popular";
export type ShowcaseTypeFilter = "all" | "image" | "video" | "script" | "viral_score" | "remix" | "lora";

export type CreatorBadgeId = "viral_creator" | "power_user" | "lora_master";

export const CREATOR_BADGES: Record<
  CreatorBadgeId,
  { emoji: string; labelKey: string }
> = {
  viral_creator: { emoji: "🔥", labelKey: "badge_viral_creator" },
  power_user: { emoji: "⚡", labelKey: "badge_power_user" },
  lora_master: { emoji: "🎨", labelKey: "badge_lora_master" },
};

export type CommunityCreationAuthor = {
  id: string;
  username: string;
  name: string;
  niche: string;
};

export type CommunityCreationItem = {
  id: string;
  type: string;
  prompt: string;
  createdAt: string;
  author: CommunityCreationAuthor;
  likeCount: number;
  commentCount: number;
  userLiked: boolean;
  previewUrl: string | null;
  assetKind: "image" | "video" | "text";
  viralScore: number | null;
  remixSourceUrl: string | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  generationCount: number;
  avgViralScore: number | null;
  badges: CreatorBadgeId[];
};

export function communityPreviewUrl(generationId: string): string {
  return `/api/community/preview/${generationId}`;
}

export function profilePath(username: string): string {
  return `/profile/${username}`;
}

export function remixHref(item: CommunityCreationItem): string {
  const topic = encodeURIComponent(item.prompt.slice(0, 120));
  return `/dashboard/video-remix?topic=${topic}`;
}

export function computeBadges(input: {
  generationCount: number;
  avgViralScore: number | null;
  hasLora: boolean;
}): CreatorBadgeId[] {
  const badges: CreatorBadgeId[] = [];
  if (input.avgViralScore != null && input.avgViralScore >= 75) {
    badges.push("viral_creator");
  }
  if (input.generationCount >= 10) {
    badges.push("power_user");
  }
  if (input.hasLora) {
    badges.push("lora_master");
  }
  return badges;
}
