import { LANDING_DEMO_VIDEOS } from "@/lib/landing-demo-videos";

export type LandingMediaItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  src: string;
  accent: string;
  href?: string;
};

export const landingMedia: LandingMediaItem[] = [
  {
    id: "ki-influencer",
    title: "KI Influencer",
    category: "Visuals",
    description:
      "Erstelle hochwertige Creator-Visuals und Social-Media-Kampagnen aus einer Idee.",
    src: LANDING_DEMO_VIDEOS.kiInfluencer,
    accent: "#8B5DFF",
    href: "/dashboard/ki-influencer",
  },
  {
    id: "lora-training",
    title: "LoRA Training",
    category: "Brand Consistency",
    description:
      "Trainiere konsistente Looks für Marken, Personen, Produkte und wiedererkennbare Kampagnen.",
    src: LANDING_DEMO_VIDEOS.loraTraining,
    accent: "#FFD84D",
    href: "/dashboard/lora-training",
  },
  {
    id: "ki-avatar",
    title: "KI Avatar",
    category: "Avatar & Live",
    description:
      "Erstelle digitale Avatare für Social Content, Live-Formate und Kampagnen.",
    src: LANDING_DEMO_VIDEOS.kiAvatar,
    accent: "#B7FF00",
    href: "/dashboard/avatar-studio",
  },
  {
    id: "seedance",
    title: "Seedance Video",
    category: "Video & Film",
    description:
      "Verwandle Bilder und Ideen in filmische KI-Videos mit Bewegung und Atmosphäre.",
    src: LANDING_DEMO_VIDEOS.seedance,
    accent: "#00D5FF",
    href: "/dashboard/szenen-generator",
  },
];
