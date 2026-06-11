import {
  Bot,
  Calendar,
  Clapperboard,
  Film,
  Image,
  Languages,
  Mic,
  Mic2,
  Rocket,
  ScanFace,
  ShoppingBag,
  Sparkles,
  Star,
  Theater,
  TrendingUp,
  Video,
  Wand2,
  Zap,
  Brain,
  Images,
  type LucideIcon,
} from "lucide-react";
import { TablerPhoto } from "@/components/icons/TablerPhoto";

const ImageGeneratorPhotoIcon = TablerPhoto as unknown as LucideIcon;

export type DashboardProductTool = {
  id: string;
  href: string;
  title: string;
  description: string;
  creditLabel: string;
  icon: LucideIcon;
  badge?: "NEU";
  categoryKey: string;
  categoryLabel: string;
};

/** InfluexAI product names for dashboard home cards — no external provider branding. */
export const DASHBOARD_PRODUCT_TOOLS: DashboardProductTool[] = [
  // Erstellen
  {
    id: "viral-hook",
    href: "/dashboard/viral-hook",
    title: "Viral Hook Generator",
    description: "YouTube-URL → Hook, Storytelling & Script-Idee",
    creditLabel: "3 Credits",
    icon: Zap,
    categoryKey: "erstellen",
    categoryLabel: "Erstellen",
  },
  {
    id: "content-kalender",
    href: "/dashboard/content-kalender",
    title: "Content Kalender",
    description: "30-Tage-Plan mit Hooks und Posting-Zeiten",
    creditLabel: "5 Credits",
    icon: Calendar,
    categoryKey: "erstellen",
    categoryLabel: "Erstellen",
  },
  {
    id: "trend-to-script",
    href: "/dashboard/trend-to-script",
    title: "Trend Script",
    description: "Trend erkennen → passendes Script sofort",
    creditLabel: "4 Credits",
    icon: Rocket,
    categoryKey: "erstellen",
    categoryLabel: "Erstellen",
  },
  {
    id: "produkt",
    href: "/dashboard/produkt",
    title: "Produkt-Werbung",
    description: "Werbespots für TikTok, Reels & YouTube aus einer URL",
    creditLabel: "75 Credits",
    icon: ShoppingBag,
    categoryKey: "erstellen",
    categoryLabel: "Erstellen",
  },
  // Visuals
  {
    id: "image-generator",
    href: "/dashboard/image-generator",
    title: "Bild Generator",
    description: "10 Kategorien · Standard & High-Res · Upscaler",
    creditLabel: "ab 5 Credits",
    icon: ImageGeneratorPhotoIcon,
    categoryKey: "visuals",
    categoryLabel: "Visuals",
  },
  {
    id: "ki-influencer",
    href: "/dashboard/ki-influencer",
    title: "KI-Ich",
    description: "Dein Gesicht in einer Szene — AI-Self-Bild",
    creditLabel: "8 Credits",
    icon: Sparkles,
    categoryKey: "visuals",
    categoryLabel: "Visuals",
  },
  {
    id: "lora-training",
    href: "/dashboard/lora-training",
    title: "LoRA Training",
    description: "Trainiere dein eigenes KI-Modell",
    creditLabel: "ab 10 Credits",
    icon: Brain,
    categoryKey: "visuals",
    categoryLabel: "Visuals",
  },
  {
    id: "gallery",
    href: "/dashboard/gallery",
    title: "Galerie",
    description: "Alle generierten Bilder, Videos & Audio",
    creditLabel: "Speicher",
    icon: Images,
    categoryKey: "visuals",
    categoryLabel: "Visuals",
  },
  // Video & Film
  {
    id: "szenen-generator",
    href: "/dashboard/szenen-generator",
    title: "Szenen Generator",
    description: "Statisches Bild in bewegtes Video mit Sound verwandeln",
    creditLabel: "dynamisch",
    icon: Film,
    badge: "NEU",
    categoryKey: "video-film",
    categoryLabel: "Video & Film",
  },
  {
    id: "story-creator",
    href: "/dashboard/story-creator",
    title: "Story Creator",
    description: "Videos allein aus einer Textbeschreibung erstellen",
    creditLabel: "50 Credits",
    icon: Clapperboard,
    badge: "NEU",
    categoryKey: "video-film",
    categoryLabel: "Video & Film",
  },
  {
    id: "video-transformer",
    href: "/dashboard/video-transformer",
    title: "Video Transformer",
    description: "KI-Stile und Looks auf bestehende Videos anwenden",
    creditLabel: "40 Credits",
    icon: Wand2,
    badge: "NEU",
    categoryKey: "video-film",
    categoryLabel: "Video & Film",
  },
  {
    id: "video-uebersetzer",
    href: "/dashboard/video-uebersetzer",
    title: "Video Übersetzer",
    description: "Videos in andere Sprachen übersetzen — optional Stimmklon",
    creditLabel: "30 Credits/Min",
    icon: Languages,
    badge: "NEU",
    categoryKey: "video-film",
    categoryLabel: "Video & Film",
  },
  // Avatar & Live
  {
    id: "live-creator",
    href: "/dashboard/live-creator",
    title: "Live Creator",
    description: "KI-Avatar live streamen — 9:16 Shorts mit Webcam",
    creditLabel: "2 Credits/Min",
    icon: Video,
    categoryKey: "avatar-live",
    categoryLabel: "Avatar & Live",
  },
  {
    id: "avatar-studio",
    href: "/dashboard/avatar-studio",
    title: "Avatar Studio",
    description: "Premium Live-Avatar-Export mit Qualitätscheck",
    creditLabel: "ab 9 Credits",
    icon: Theater,
    categoryKey: "avatar-live",
    categoryLabel: "Avatar & Live",
  },
  {
    id: "character-studio",
    href: "/dashboard/character-studio",
    title: "Character Studio",
    description: "Charakter animieren oder Gesicht in Video ersetzen",
    creditLabel: "25 Credits",
    icon: ScanFace,
    badge: "NEU",
    categoryKey: "avatar-live",
    categoryLabel: "Avatar & Live",
  },
  {
    id: "face-studio",
    href: "/dashboard/face-studio",
    title: "Face Studio",
    description: "Face Swap in Videos und Fotos — nur mit Einwilligung",
    creditLabel: "5–10 Credits",
    icon: ScanFace,
    categoryKey: "avatar-live",
    categoryLabel: "Avatar & Live",
  },
  {
    id: "lipsync-studio",
    href: "/dashboard/lipsync-studio",
    title: "Lipsync Studio",
    description: "Lippenbewegungen im Video mit Audio synchronisieren",
    creditLabel: "20 Credits",
    icon: Mic,
    badge: "NEU",
    categoryKey: "avatar-live",
    categoryLabel: "Avatar & Live",
  },
  // Audio
  {
    id: "melodia",
    href: "/dashboard/melodia",
    title: "Melodia Studio",
    description: "Text zu Sprache, Stimme klonen & Stimme ändern",
    creditLabel: "ab 3 Credits",
    icon: Mic2,
    badge: "NEU",
    categoryKey: "audio",
    categoryLabel: "Audio",
  },
  // Werbung & Business
  {
    id: "ad-creator",
    href: "/dashboard/ad-creator",
    title: "Ad Creator",
    description: "Produktfotos in werbefertige Creatives verwandeln",
    creditLabel: "15 Credits",
    icon: ShoppingBag,
    badge: "NEU",
    categoryKey: "werbung-business",
    categoryLabel: "Werbung & Business",
  },
  {
    id: "thumbnail-concept",
    href: "/dashboard/thumbnail-concept",
    title: "Thumbnail Concept",
    description: "CTR-starke Thumbnail-Ideen mit Text & Layout",
    creditLabel: "1 Credit",
    icon: Image,
    categoryKey: "werbung-business",
    categoryLabel: "Werbung & Business",
  },
  // Automation
  {
    id: "ki-agent",
    href: "/dashboard/ki-agent",
    title: "Agent Autopilot",
    description: "Beschreibe dein Ziel — Agent Autopilot erstellt Content",
    creditLabel: "1 Credit / Anfrage",
    icon: Star,
    categoryKey: "automation",
    categoryLabel: "Automation",
  },
  {
    id: "campaign-autopilot",
    href: "/dashboard/campaign-autopilot",
    title: "Autopilot Kampagne",
    description: "Kampagnenstruktur & Content-Plan",
    creditLabel: "ab 5 Credits",
    icon: Bot,
    categoryKey: "automation",
    categoryLabel: "Automation",
  },
];

export function productToolsByCategory(): {
  key: string;
  label: string;
  tools: DashboardProductTool[];
}[] {
  const order = [
    "erstellen",
    "visuals",
    "video-film",
    "avatar-live",
    "audio",
    "werbung-business",
    "automation",
  ];
  const map = new Map<string, { label: string; tools: DashboardProductTool[] }>();
  for (const tool of DASHBOARD_PRODUCT_TOOLS) {
    const entry = map.get(tool.categoryKey) ?? {
      label: tool.categoryLabel,
      tools: [],
    };
    entry.tools.push(tool);
    map.set(tool.categoryKey, entry);
  }
  return order
    .filter((k) => map.has(k))
    .map((k) => ({ key: k, label: map.get(k)!.label, tools: map.get(k)!.tools }));
}
