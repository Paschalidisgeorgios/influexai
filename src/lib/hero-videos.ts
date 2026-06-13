export interface HeroScene {
  id: string;
  videoUrl: string;
  label: string;
  theme: "green" | "blue" | "violet";
}

/** Local clips from /public/videos/landing/ — served at /videos/landing/*.mp4 */
export const HERO_SCENES: HeroScene[] = [
  {
    id: "ki-influencer",
    videoUrl: "/videos/landing/ki-influencer.mp4",
    label: "KI Influencer",
    theme: "violet",
  },
  {
    id: "seedance",
    videoUrl: "/videos/landing/seedance-2-0.mp4",
    label: "Seedance Video",
    theme: "blue",
  },
  {
    id: "ki-avatar",
    videoUrl: "/videos/landing/ki-avatar.mp4",
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
