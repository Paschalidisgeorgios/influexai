import {
  Calendar,
  Film,
  Rocket,
  Sparkles,
  Video,
  Zap,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { TablerPhoto } from "@/components/icons/TablerPhoto";

const ImageGeneratorPhotoIcon = TablerPhoto as unknown as LucideIcon;

export type DashboardHomeTool = {
  id: string;
  href: string;
  title: string;
  description: string;
  creditLabel: string;
  icon: LucideIcon;
  badge?: "NEU";
};

/** Eight featured tools for dashboard home (4×2 grid). */
export const DASHBOARD_HOME_TOOLS: DashboardHomeTool[] = [
  {
    id: "viral-hook",
    href: "/dashboard/viral-hook",
    title: "Viral Hook Generator",
    description: "Hooks die stoppen — aus URL oder Idee",
    creditLabel: "3 Credits",
    icon: Zap,
  },
  {
    id: "content-kalender",
    href: "/dashboard/content-kalender",
    title: "Content Kalender",
    description: "30-Tage-Plan mit Hooks & Zeiten",
    creditLabel: "5 Credits",
    icon: Calendar,
  },
  {
    id: "trend-to-script",
    href: "/dashboard/trend-to-script",
    title: "Trend Script",
    description: "Trend → passendes Script sofort",
    creditLabel: "4 Credits",
    icon: Rocket,
  },
  {
    id: "image-generator",
    href: "/dashboard/image-generator",
    title: "Bild Generator",
    description: "KI-Bilder für Content & Ads",
    creditLabel: "ab 5 Credits",
    icon: ImageGeneratorPhotoIcon,
  },
  {
    id: "ki-influencer",
    href: "/dashboard/ki-influencer",
    title: "KI-Ich",
    description: "Dein Gesicht in einer Szene",
    creditLabel: "8 Credits",
    icon: Sparkles,
  },
  {
    id: "lora-training",
    href: "/dashboard/lora-training",
    title: "LoRA Training",
    description: "Dein persönliches KI-Modell",
    creditLabel: "ab 10 Credits",
    icon: Brain,
  },
  {
    id: "szenen-generator",
    href: "/dashboard/szenen-generator",
    title: "Szenen Generator",
    description: "Bild → Video mit Sound",
    creditLabel: "dynamisch",
    icon: Film,
    badge: "NEU",
  },
  {
    id: "live-creator",
    href: "/dashboard/live-creator",
    title: "Live Creator",
    description: "KI-Avatar live streamen",
    creditLabel: "2 Credits/Min",
    icon: Video,
  },
];
