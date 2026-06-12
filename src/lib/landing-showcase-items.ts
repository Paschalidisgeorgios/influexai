export const SHOWCASE_ITEM_IDS = [
  "reel",
  "motion",
  "hook",
  "adPack",
  "creator",
  "score",
] as const;

export type ShowcaseItemId = (typeof SHOWCASE_ITEM_IDS)[number];

export type ShowcaseItem = {
  id: ShowcaseItemId;
  badgeKeys: readonly string[];
};

export const LANDING_SHOWCASE_ITEMS: ShowcaseItem[] = [
  { id: "reel", badgeKeys: ["ratio", "visual"] },
  { id: "motion", badgeKeys: ["video", "duration"] },
  { id: "hook", badgeKeys: ["tiktok", "hook"] },
  { id: "adPack", badgeKeys: ["export", "multi"] },
  { id: "creator", badgeKeys: ["ugc", "ads"] },
  { id: "score", badgeKeys: ["score", "analysis"] },
];
