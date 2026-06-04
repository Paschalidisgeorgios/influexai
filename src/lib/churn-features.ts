export const FEATURE_NUDGE_ORDER = [
  {
    key: "outlier-detector",
    name: "Outlier Detector",
    href: "/dashboard/outlier-detector",
    description: "Finde virale Video-Ideen bevor alle anderen",
  },
  {
    key: "script-generator",
    name: "Script Generator",
    href: "/dashboard/script-generator",
    description: "Fertige Video-Scripts in 30 Sekunden",
  },
  {
    key: "niche-analyzer",
    name: "Niche Analyzer",
    href: "/dashboard/niche-analyzer",
    description: "Deine profitable Nische in 3 Minuten",
  },
  {
    key: "thumbnail-concept",
    name: "Thumbnail Konzept",
    href: "/dashboard/thumbnail-concept",
    description: "CTR-optimierte Thumbnail-Ideen",
  },
  {
    key: "video-remix",
    name: "Video Remix",
    href: "/dashboard/video-remix",
    description: "Remixe virale Videos mit deinem Twist",
  },
] as const;

export type FeatureNudgeKey = (typeof FEATURE_NUDGE_ORDER)[number]["key"];

export const REENGAGEMENT_FEATURES = [
  { name: "Thumbnail Konzept Generator", href: "/dashboard/thumbnail-concept" },
  { name: "Outlier Detector", href: "/dashboard/outlier-detector" },
  { name: "Script Generator", href: "/dashboard/script-generator" },
];
