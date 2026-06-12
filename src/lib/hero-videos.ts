export interface HeroScene {
  id: string;
  imageUrl: string;
  label: string;
  theme: "green" | "blue" | "violet";
}

export const HERO_SCENES: HeroScene[] = [
  {
    id: "ki-ich",
    imageUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=85",
    label: "KI-Ich Studio",
    theme: "green",
  },
  {
    id: "szenen",
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85",
    label: "Szenen Generator",
    theme: "blue",
  },
  {
    id: "agent",
    imageUrl:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=85",
    label: "Agent Autopilot",
    theme: "violet",
  },
  {
    id: "story",
    imageUrl:
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1200&q=85",
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
