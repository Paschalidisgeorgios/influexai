export interface HeroScene {
  id: string;
  videoUrl: string;
  label: string;
  theme: "green" | "blue" | "violet";
}

/** Local clips from /public/videos/landing/ — served at /videos/landing/*.mp4 */
export const HERO_SCENES: HeroScene[] = [
  {
    id: "scene-1",
    videoUrl: "/videos/landing/feature-1.mp4",
    label: "KI-Ich Studio",
    theme: "green",
  },
  {
    id: "scene-2",
    videoUrl: "/videos/landing/feature-2.mp4",
    label: "Szenen Generator",
    theme: "blue",
  },
  {
    id: "scene-3",
    videoUrl: "/videos/landing/feature-3.mp4",
    label: "Agent Autopilot",
    theme: "violet",
  },
];

export const THEME_CONFIG = {
  green: { r: 180, g: 255, b: 0, hex: "#B4FF00", rgb: "180,255,0" },
  blue: { r: 40, g: 160, b: 255, hex: "#40A0FF", rgb: "40,160,255" },
  violet: { r: 160, g: 60, b: 255, hex: "#A040FF", rgb: "160,60,255" },
} as const;

export type ThemeKey = keyof typeof THEME_CONFIG;
