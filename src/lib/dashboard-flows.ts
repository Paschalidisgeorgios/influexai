import {
  Bot,
  Calendar,
  FileText,
  Flame,
  ChartBar,
  Image,
  Mic2,
  Repeat2,
  Rocket,
  ScanFace,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  Film,
  Images,
  Brain,
  Home,
  PlusCircle,
  User,
  ZoomIn,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { TablerPhoto } from "@/components/icons/TablerPhoto";
import { TablerSpy } from "@/components/icons/TablerSpy";

const CompetitorSpyIcon = TablerSpy as unknown as LucideIcon;
const ImageGeneratorPhotoIcon = TablerPhoto as unknown as LucideIcon;

export type FlowCategory = "create" | "analyze" | "live";

export type DashboardFlow = {
  id: string;
  href: string;
  category: FlowCategory;
  icon: LucideIcon;
  /** i18n key under flows.* or dashboard.flows.* */
  i18nKey?: string;
  /** Fallback title if no i18n */
  title: string;
  /** One-line value prop (fallback) */
  tagline: string;
  creditCost: number | null;
  creditLabel: string;
  badge?: "NEU" | "SOON";
  locked?: boolean;
  /** generation.type values counted for popularity */
  genTypes: string[];
};

export const DASHBOARD_FLOW_CATEGORIES: {
  id: FlowCategory;
  labelKey: string;
}[] = [
  { id: "create", labelKey: "section_create" },
  { id: "analyze", labelKey: "section_analyze" },
  { id: "live", labelKey: "section_live" },
];

export const DASHBOARD_FLOWS: DashboardFlow[] = [
  {
    id: "script-generator",
    href: "/dashboard/script-generator",
    category: "create",
    icon: FileText,
    i18nKey: "script",
    title: "Script Generator",
    tagline: "Schreibe virale YouTube-Scripts in 30 Sekunden",
    creditCost: 2,
    creditLabel: "2 Credits",
    badge: "NEU",
    genTypes: ["script-generator", "script"],
  },
  {
    id: "thumbnail-concept",
    href: "/dashboard/thumbnail-concept",
    category: "create",
    icon: Image,
    i18nKey: "thumbnail",
    title: "Thumbnail Konzept",
    tagline: "CTR-starke Thumbnail-Ideen mit Text & Layout",
    creditCost: 1,
    creditLabel: "1 Credit",
    badge: "NEU",
    genTypes: ["thumbnail-concept", "thumbnail"],
  },
  {
    id: "produkt",
    href: "/dashboard/produkt",
    category: "create",
    icon: ShoppingBag,
    i18nKey: "video_ad",
    title: "Produkt-Werbung",
    tagline: "Werbespots für TikTok, Reels & YouTube aus einer URL",
    creditCost: 75,
    creditLabel: "75 Credits",
    genTypes: ["produkt", "product_ad", "video-ad"],
  },
  {
    id: "ki-ich",
    href: "/dashboard/ki-ich",
    category: "create",
    icon: Sparkles,
    title: "Mein KI-Ich",
    tagline: "Dein Gesicht in jeder Szene — konsistente KI-Bilder",
    creditCost: 8,
    creditLabel: "8 Credits",
    genTypes: ["ki-ich"],
  },
  {
    id: "lora-training",
    href: "/dashboard/lora-training",
    category: "create",
    icon: Brain,
    i18nKey: "loraTraining",
    title: "LoRA Training",
    tagline: "Trainiere dein eigenes KI-Modell",
    creditCost: 40,
    creditLabel: "ab 40 Credits",
    badge: "NEU",
    genTypes: ["lora_training", "lora_generation"],
  },
  {
    id: "image-generator",
    href: "/dashboard/image-generator",
    category: "create",
    icon: ImageGeneratorPhotoIcon,
    i18nKey: "image_generator",
    title: "Bild Generator",
    tagline: "10 Kategorien · Standard & High-Res · Upscaler",
    creditCost: 5,
    creditLabel: "ab 5 Credits",
    badge: "NEU",
    genTypes: ["image", "image-generator"],
  },
  {
    id: "upscaler",
    href: "/dashboard/upscaler",
    category: "create",
    icon: ZoomIn,
    title: "HD Upscaler",
    tagline: "Clarity Upscaler — Schärfe & Detail für deine Bilder",
    creditCost: 4,
    creditLabel: "4 Credits",
    badge: "NEU",
    genTypes: ["image", "upscale"],
  },
  {
    id: "seedance",
    href: "/dashboard/seedance",
    category: "create",
    icon: Film,
    title: "Bild zu Video",
    tagline: "Statisches Bild in bewegtes Video mit Sound verwandeln",
    creditCost: 25,
    creditLabel: "25 Credits",
    badge: "NEU",
    genTypes: ["seedance", "image_to_video"],
  },
  {
    id: "niche-analyzer",
    href: "/dashboard/niche-analyzer",
    category: "analyze",
    icon: TrendingUp,
    i18nKey: "niche",
    title: "Niche Analyzer",
    tagline: "Finde profitable YouTube-Nischen mit KI",
    creditCost: 2,
    creditLabel: "2 Credits",
    badge: "NEU",
    genTypes: ["niche-analyzer", "niche"],
  },
  {
    id: "outlier-detector",
    href: "/dashboard/outlier-detector",
    category: "analyze",
    icon: Flame,
    i18nKey: "outlier",
    title: "Outlier Detector",
    tagline: "Entdecke virale Videos und verstehe warum sie funktionieren",
    creditCost: 3,
    creditLabel: "3 Credits",
    badge: "NEU",
    genTypes: ["outlier-detector", "outlier"],
  },
  {
    id: "viral-hook",
    href: "/dashboard/viral-hook",
    category: "analyze",
    icon: Zap,
    i18nKey: "viral_hook",
    title: "Viral Hook Extraktor",
    tagline: "YouTube URL → Hook + Storytelling → Script",
    creditCost: 3,
    creditLabel: "3 Credits",
    badge: "NEU",
    genTypes: ["viral-hook"],
  },
  {
    id: "content-kalender",
    href: "/dashboard/content-kalender",
    category: "analyze",
    icon: Calendar,
    i18nKey: "content_kalender",
    title: "Content Kalender",
    tagline: "30-Tage Plan mit Hooks und Posting-Zeiten",
    creditCost: 5,
    creditLabel: "5 Credits",
    badge: "NEU",
    genTypes: ["content-kalender"],
  },
  {
    id: "campaign-autopilot",
    href: "/dashboard/campaign-autopilot",
    category: "analyze",
    icon: Bot,
    title: "Campaign Autopilot",
    tagline: "Kampagne planen — Reels, Posts & Ads in einem Lauf",
    creditCost: 24,
    creditLabel: "ab 12 Credits",
    badge: "NEU",
    genTypes: ["campaign-autopilot"],
  },
  {
    id: "trend-to-script",
    href: "/dashboard/trend-to-script",
    category: "analyze",
    icon: Rocket,
    i18nKey: "trend_to_script",
    title: "Trend → Script",
    tagline: "Trend erkennen → sofort passendes Script",
    creditCost: 4,
    creditLabel: "4 Credits",
    badge: "NEU",
    genTypes: ["trend-to-script"],
  },
  {
    id: "competitor",
    href: "/dashboard/competitor",
    category: "analyze",
    icon: CompetitorSpyIcon,
    i18nKey: "competitor",
    title: "Konkurrenz-Analyse",
    tagline: "Analysiere Konkurrenz-Kanäle — Lücken & Chancen",
    creditCost: 5,
    creditLabel: "5 Credits",
    badge: "NEU",
    genTypes: ["competitor_analysis"],
  },
  {
    id: "viral-score",
    href: "/dashboard/viral-score",
    category: "analyze",
    icon: ChartBar,
    i18nKey: "viral_score",
    title: "Viral Score",
    tagline: "Score 0–100 für Script, Thumbnail & Nische",
    creditCost: 2,
    creditLabel: "2 Credits",
    badge: "NEU",
    genTypes: ["viral_score"],
  },
  {
    id: "video-remix",
    href: "/dashboard/video-remix",
    category: "analyze",
    icon: Repeat2,
    i18nKey: "remix",
    title: "Video Remix",
    tagline: "Remixe virale Videos mit deinem eigenen Twist",
    creditCost: 2,
    creditLabel: "2 Credits",
    badge: "NEU",
    genTypes: ["video-remix", "remix"],
  },
  {
    id: "live-creator",
    href: "/dashboard/live-creator",
    category: "live",
    icon: Video,
    title: "Live Creator",
    tagline: "KI-Avatar live streamen — 9:16 Shorts mit Webcam",
    creditCost: 1,
    creditLabel: "1 Credit / Min",
    badge: "NEU",
    genTypes: ["live-creator"],
  },
  {
    id: "ugc-video",
    href: "/dashboard/ugc-video",
    category: "create",
    icon: Video,
    i18nKey: "ugc_video",
    title: "UGC Video",
    tagline: "Authentische Creator-Videos mit KI-Avatar — 9:16 UGC-Stil",
    creditCost: 5,
    creditLabel: "5 Credits",
    badge: "NEU",
    genTypes: ["ugc-video"],
  },
  {
    id: "live-creator-new",
    href: "/dashboard/live-creator-new",
    category: "live",
    icon: ScanFace,
    title: "Face Swap",
    tagline: "Face Swap in Videos — werde zu jedem Creator",
    creditCost: 10,
    creditLabel: "10 Credits",
    badge: "NEU",
    genTypes: ["live-creator-new", "faceswap"],
  },
  {
    id: "voice",
    href: "/dashboard/voice",
    category: "live",
    icon: Mic2,
    title: "Stimme & Musik",
    tagline: "KI-Stimme & lizenzfreie Musik für deine Videos",
    creditCost: 3,
    creditLabel: "3 Credits",
    badge: "NEU",
    genTypes: ["voice-tts", "stimme-clone", "stimme-speak"],
  },
  {
    id: "voice-agent",
    href: "/dashboard/voice-agent",
    category: "live",
    icon: Bot,
    title: "Voice Agent",
    tagline: "ElevenLabs Conversational AI — demnächst",
    creditCost: null,
    creditLabel: "Coming Soon",
    badge: "SOON",
    locked: true,
    genTypes: ["voice-agent"],
  },
];

export const NAV_GROUPS: {
  labelKey: string;
  items: {
    id: string;
    href: string;
    labelKey?: string;
    label?: string;
    icon: LucideIcon;
    badge?: string;
    comingSoon?: boolean;
  }[];
}[] = [
  {
    labelKey: "nav_group_create",
    items: [
      { id: "script", href: "/dashboard/script-generator", labelKey: "script", icon: FileText },
      { id: "thumbnail", href: "/dashboard/thumbnail-concept", labelKey: "thumbnail", icon: Image },
      { id: "produkt", href: "/dashboard/produkt", label: "Produkt-Werbung", icon: ShoppingBag },
      { id: "ki-ich", href: "/dashboard/ki-ich", label: "Mein KI-Ich", icon: Sparkles },
      {
        id: "image-generator",
        href: "/dashboard/image-generator",
        labelKey: "image_generator",
        icon: ImageGeneratorPhotoIcon,
        badge: "NEU",
      },
      {
        id: "ki-agent",
        href: "/dashboard/ki-agent",
        label: "KI Agent",
        icon: Bot,
      },
      {
        id: "campaign-autopilot",
        href: "/dashboard/campaign-autopilot",
        label: "Campaign Autopilot",
        icon: Rocket,
        badge: "NEU",
      },
      {
        id: "upscaler",
        href: "/dashboard/upscaler",
        label: "HD Upscaler",
        icon: ZoomIn,
        badge: "NEU",
      },
      {
        id: "seedance",
        href: "/dashboard/seedance",
        label: "Bild zu Video",
        icon: Film,
        badge: "NEU",
      },
      {
        id: "lora-training",
        href: "/dashboard/lora-training",
        label: "LoRA Training",
        icon: Brain,
        badge: "NEU",
      },
      {
        id: "ugc-video",
        href: "/dashboard/ugc-video",
        labelKey: "ugc_video",
        icon: Video,
        badge: "NEU",
      },
    ],
  },
  {
    labelKey: "nav_group_analyze",
    items: [
      { id: "niche", href: "/dashboard/niche-analyzer", label: "Niche Analyzer", icon: TrendingUp },
      { id: "outlier", href: "/dashboard/outlier-detector", label: "Outlier Detector", icon: Flame },
      {
        id: "viral-hook",
        href: "/dashboard/viral-hook",
        label: "Viral Hook Extraktor",
        icon: Zap,
        badge: "NEU",
      },
      {
        id: "content-kalender",
        href: "/dashboard/content-kalender",
        label: "Content Kalender",
        icon: Calendar,
        badge: "NEU",
      },
      {
        id: "trend-to-script",
        href: "/dashboard/trend-to-script",
        label: "Trend → Script",
        icon: Rocket,
        badge: "NEU",
      },
      { id: "competitor", href: "/dashboard/competitor", labelKey: "competitor", icon: CompetitorSpyIcon, badge: "NEU" },
      { id: "viral-score", href: "/dashboard/viral-score", labelKey: "viral_score", icon: ChartBar, badge: "NEU" },
      { id: "remix", href: "/dashboard/video-remix", labelKey: "remix", icon: Repeat2 },
    ],
  },
  {
    labelKey: "nav_group_live",
    items: [
      { id: "live-creator", href: "/dashboard/live-creator", labelKey: "live_creator", icon: Video, badge: "LIVE", comingSoon: false },
      { id: "live-creator-new", href: "/dashboard/live-creator-new", label: "Face Swap", icon: ScanFace, badge: "NEU" },
      { id: "voice", href: "/dashboard/voice", label: "Stimme & Musik", icon: Mic2 },
    ],
  },
];

export const MOBILE_QUICK_NAV = [
  { href: "/dashboard", icon: Home, labelKey: "nav_home" as const },
  {
    href: "/dashboard/script-generator",
    icon: PlusCircle,
    labelKey: "quick_create" as const,
  },
  { href: "/dashboard/agent", icon: Star, labelKey: "quick_agent" as const },
  { href: "/dashboard/gallery", icon: Images, labelKey: "quick_gallery" as const },
  { href: "/dashboard/settings", icon: User, labelKey: "nav_settings" as const },
];

export function flowsByCategory(): Record<FlowCategory, DashboardFlow[]> {
  return {
    create: DASHBOARD_FLOWS.filter((f) => f.category === "create" && !f.locked),
    analyze: DASHBOARD_FLOWS.filter((f) => f.category === "analyze" && !f.locked),
    live: DASHBOARD_FLOWS.filter((f) => f.category === "live" && !f.locked),
  };
}

export function rankTopFlows(
  generations: { type: string }[],
  limit = 3
): DashboardFlow[] {
  const counts = new Map<string, number>();
  for (const g of generations) {
    counts.set(g.type, (counts.get(g.type) ?? 0) + 1);
  }

  const scored = DASHBOARD_FLOWS.filter((f) => !f.locked).map((flow) => {
    let score = 0;
    for (const t of flow.genTypes) {
      score += counts.get(t) ?? 0;
    }
    return { flow, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.flow);

  if (picked.length >= limit) return picked;

  const defaults = [
    "script-generator",
    "niche-analyzer",
    "thumbnail-concept",
  ];
  for (const id of defaults) {
    if (picked.length >= limit) break;
    const f = DASHBOARD_FLOWS.find((x) => x.id === id);
    if (f && !picked.some((p) => p.id === id)) picked.push(f);
  }
  return picked.slice(0, limit);
}
