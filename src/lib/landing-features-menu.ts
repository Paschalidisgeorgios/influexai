import {
  Calendar,
  Clapperboard,
  Download,
  FileText,
  Gauge,
  ImageIcon,
  Mic2,
  Rocket,
  ScanFace,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  Wand2,
  Zap,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";

export type FeatureMenuItem = {
  id: string;
  href: string;
};

export type FeatureMenuGroup = {
  id: string;
  icon: LucideIcon;
  items: FeatureMenuItem[];
};

export type FeatureMenuCategory = {
  id: string;
  groups: FeatureMenuGroup[];
};

/** Landing mega-menu — user-facing tools only (no admin/settings). */
export const LANDING_FEATURES_MENU: FeatureMenuCategory[] = [
  {
    id: "create",
    groups: [
      {
        id: "scripts",
        icon: FileText,
        items: [
          { id: "script", href: "/dashboard/script-generator" },
          { id: "hook", href: "/dashboard/viral-hook" },
          { id: "trend", href: "/dashboard/trend-to-script" },
          { id: "calendar", href: "/dashboard/content-kalender" },
        ],
      },
      {
        id: "ads",
        icon: ShoppingBag,
        items: [
          { id: "product", href: "/dashboard/produkt" },
          { id: "ad", href: "/dashboard/ad-creator" },
          { id: "thumbnail", href: "/dashboard/thumbnail-concept" },
        ],
      },
    ],
  },
  {
    id: "visuals",
    groups: [
      {
        id: "images",
        icon: ImageIcon,
        items: [
          { id: "imageGen", href: "/dashboard/image-generator" },
          { id: "kiIch", href: "/dashboard/ki-influencer" },
          { id: "lora", href: "/dashboard/lora-training" },
          { id: "upscaler", href: "/dashboard/upscaler" },
        ],
      },
      {
        id: "ugc",
        icon: Sparkles,
        items: [
          { id: "ugcVideo", href: "/dashboard/ugc-video" },
          { id: "ecommerce", href: "/dashboard/ecommerce-ads" },
        ],
      },
    ],
  },
  {
    id: "video",
    groups: [
      {
        id: "motion",
        icon: Clapperboard,
        items: [
          { id: "story", href: "/dashboard/story-creator" },
          { id: "scene", href: "/dashboard/szenen-generator" },
          { id: "seedance", href: "/dashboard/szenen-generator" },
          { id: "textToVideo", href: "/dashboard/szenen-generator" },
        ],
      },
      {
        id: "edit",
        icon: Wand2,
        items: [
          { id: "transform", href: "/dashboard/video-transformer" },
          { id: "remix", href: "/dashboard/video-remix" },
          { id: "motionTransfer", href: "/dashboard/motion-transfer" },
        ],
      },
    ],
  },
  {
    id: "avatar",
    groups: [
      {
        id: "live",
        icon: Video,
        items: [
          { id: "liveCreator", href: "/dashboard/live-creator" },
          { id: "avatarStudio", href: "/dashboard/avatar-studio" },
          { id: "character", href: "/dashboard/character-studio" },
        ],
      },
      {
        id: "audio",
        icon: Mic2,
        items: [
          { id: "lipsync", href: "/dashboard/lipsync-studio" },
          { id: "melodia", href: "/dashboard/melodia" },
          { id: "translate", href: "/dashboard/video-uebersetzer" },
          { id: "faceStudio", href: "/dashboard/face-studio" },
        ],
      },
    ],
  },
  {
    id: "intelligence",
    groups: [
      {
        id: "agent",
        icon: BrainCircuit,
        items: [
          { id: "autopilot", href: "/dashboard/ki-agent" },
          { id: "campaign", href: "/dashboard/campaign-autopilot" },
        ],
      },
      {
        id: "analysis",
        icon: TrendingUp,
        items: [
          { id: "score", href: "/dashboard/viral-score" },
          { id: "outlier", href: "/dashboard/outlier-detector" },
          { id: "niche", href: "/dashboard/niche-analyzer" },
          { id: "competitor", href: "/dashboard/competitor" },
        ],
      },
    ],
  },
  {
    id: "workflow",
    groups: [
      {
        id: "library",
        icon: Download,
        items: [{ id: "gallery", href: "/dashboard/gallery" }],
      },
      {
        id: "tools",
        icon: Target,
        items: [
          { id: "analytics", href: "/dashboard/analytics" },
        ],
      },
    ],
  },
];

export type FeaturePromoVariant =
  | "campaign"
  | "create"
  | "visuals"
  | "video"
  | "avatar"
  | "intelligence";

export const FEATURE_PROMO_BY_CATEGORY: Record<string, FeaturePromoVariant> = {
  create: "create",
  visuals: "visuals",
  video: "video",
  avatar: "avatar",
  intelligence: "intelligence",
  workflow: "campaign",
};

export const DEFAULT_FEATURE_PROMO: FeaturePromoVariant = "campaign";
