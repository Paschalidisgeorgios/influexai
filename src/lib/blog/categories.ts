export const BLOG_CATEGORIES = [
  "Alle",
  "Niche-Analyse",
  "Script Writing",
  "Thumbnail",
  "Viral Tactics",
  "KI Tools",
  "YouTube Algorithm",
  "Case Studies",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const CATEGORY_BADGE_CLASS: Record<string, string> = {
  "Niche-Analyse": "bg-emerald-500/20 text-emerald-400",
  "Script Writing": "bg-[#B4FF00]/20 text-[#B4FF00]",
  Thumbnail: "bg-violet-500/20 text-violet-400",
  "Viral Tactics": "bg-orange-500/20 text-orange-400",
  "KI Tools": "bg-cyan-500/20 text-cyan-400",
  "YouTube Algorithm": "bg-blue-500/20 text-blue-400",
  "Case Studies": "bg-pink-500/20 text-pink-400",
};

export function categoryBadgeClass(category: string): string {
  return CATEGORY_BADGE_CLASS[category] ?? "bg-white/10 text-white/60";
}

export function categoryToFeaturePath(category: string): string {
  const map: Record<string, string> = {
    "Niche-Analyse": "/dashboard/niche-analyzer",
    "Script Writing": "/dashboard/script-generator",
    Thumbnail: "/dashboard/thumbnail-concept",
    "Viral Tactics": "/dashboard/outlier-detector",
    "KI Tools": "/dashboard",
    "YouTube Algorithm": "/dashboard/outlier-detector",
    "Case Studies": "/community",
  };
  return map[category] ?? "/dashboard";
}

export function categoryCtaLabel(category: string): string {
  const map: Record<string, string> = {
    "Niche-Analyse": "Niche Analyzer",
    "Script Writing": "Script Generator",
    Thumbnail: "Thumbnail Concept",
    "Viral Tactics": "Outlier Detector",
    "KI Tools": "InfluexAI Dashboard",
    "YouTube Algorithm": "Outlier Detector",
    "Case Studies": "Community",
  };
  return map[category] ?? "InfluexAI";
}
