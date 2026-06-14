import { LANDING_VIDEOS } from "@/lib/landing-video-urls";

export interface HeroScene {
  id: string;
  videoUrl: string;
  label: string;
  theme: "green" | "blue" | "violet";
}

/** Fullscreen hero background on the landing page */
export const HERO_BACKGROUND_VIDEO = LANDING_VIDEOS.heroCreatorStudio;

export const HERO_SCENES: HeroScene[] = [
  {
    id: "ki-influencer",
    videoUrl: LANDING_VIDEOS.kiInfluencer,
    label: "KI Influencer",
    theme: "violet",
  },
  {
    id: "seedance",
    videoUrl: LANDING_VIDEOS.seedance20,
    label: "Seedance Video",
    theme: "blue",
  },
  {
    id: "ki-avatar",
    videoUrl: LANDING_VIDEOS.kiAvatar,
    label: "KI Avatar",
    theme: "green",
  },
];

export const THEME_CONFIG = {
  green: { r: 180, g: 255, b: 0, hex: "#B4FF00", rgb: "180,255,0" },
  blue: { r: 40, g: 160, b: 255, hex: "#40A0FF", rgb: "40,160,255" },
  violet: { r: 160, g: 60, b: 255, hex: "#A040FF", rgb: "160,60,255" },
} as const;

export type ThemeKey = keyof typeof THEME_CONFIG;
