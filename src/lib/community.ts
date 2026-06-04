export type CommunityPostType = "win" | "idea" | "question";
export type CommunityReactionType = "fire" | "applause" | "insight";
export type CommunityFeedFilter = "all" | "win" | "idea" | "question" | "new";

export const POST_TYPE_META: Record<
  CommunityPostType,
  { label: string; badge: string }
> = {
  win: { label: "Win", badge: "🏆 Win" },
  idea: { label: "Idee", badge: "💡 Idee" },
  question: { label: "Frage", badge: "❓ Frage" },
};

export const FEED_TABS: { id: CommunityFeedFilter; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "win", label: "🏆 Wins" },
  { id: "idea", label: "💡 Ideen" },
  { id: "question", label: "❓ Fragen" },
  { id: "new", label: "Neu" },
];

export const REACTIONS: {
  type: CommunityReactionType;
  emoji: string;
  label: string;
  field: "reactions_fire" | "reactions_applause" | "reactions_insight";
}[] = [
  { type: "fire", emoji: "🔥", label: "Fire", field: "reactions_fire" },
  {
    type: "applause",
    emoji: "👏",
    label: "Applause",
    field: "reactions_applause",
  },
  {
    type: "insight",
    emoji: "💡",
    label: "Insightful",
    field: "reactions_insight",
  },
];

export type CommunityAuthor = {
  id: string;
  name: string;
  niche: string;
};

export type CommunityReply = {
  id: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
};

export type CommunityPost = {
  id: string;
  type: CommunityPostType;
  content: string;
  metric: string | null;
  niche: string;
  createdAt: string;
  author: CommunityAuthor;
  reactionsFire: number;
  reactionsApplause: number;
  reactionsInsight: number;
  userReaction: CommunityReactionType | null;
  replyCount: number;
  replies: CommunityReply[];
  challengeId: string | null;
};

export type CommunityChallenge = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  userJoined: boolean;
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} Tag${days === 1 ? "" : "en"}`;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
  });
}

export function daysUntil(iso: string): number {
  const end = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

export function totalReactions(post: {
  reactionsFire: number;
  reactionsApplause: number;
  reactionsInsight: number;
}): number {
  return post.reactionsFire + post.reactionsApplause + post.reactionsInsight;
}
