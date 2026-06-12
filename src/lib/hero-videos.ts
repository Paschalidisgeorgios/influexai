export interface HeroScene {
  id: string;
  videoUrl: string;
  fallbackImageUrl: string;
  label: string;
  theme: "green" | "blue" | "violet";
}

/** Local clips from /public/videos/landing/ — served at /videos/landing/*.mp4 */
export const HERO_SCENES: HeroScene[] = [
  {
    id: "ki-ich",
    videoUrl: "/videos/landing/feature-1.mp4",
    fallbackImageUrl: "/images/landing/hero.jpg",
    label: "KI-Ich Studio",
    theme: "green",
  },
  {
    id: "szenen",
    videoUrl: "/videos/landing/feature-2.mp4",
    fallbackImageUrl: "/images/landing/hero-2.jpg",
    label: "Szenen Generator",
    theme: "blue",
  },
  {
    id: "agent",
    videoUrl: "/videos/landing/feature-3.mp4",
    fallbackImageUrl: "/images/landing/hero-3.jpg",
    label: "Agent Autopilot",
    theme: "violet",
  },
  {
    id: "story",
    videoUrl: "/videos/landing/feature-1.mp4",
    fallbackImageUrl: "/images/landing/hero-poster.jpg",
    label: "Story Creator",
    theme: "green",
  },
];

export const THEME_CONFIG = {
  green: { r: 180, g: 255, b: 0, hex: "#B4FF00", rgb: "180,255,0" },
  blue: { r: 40, g: 160, b: 255, hex: "#40A0FF", rgb: "40,160,255" },
  violet: { r: 160, g: 60, b: 255, hex: "#A040FF", rgb: "160,60,255" },
} as const;

export type ThemeKey = keyof typeof THEME_CONFIG;
