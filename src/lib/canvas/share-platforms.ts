export type SharePlatform = "tiktok" | "instagram" | "youtube";

export type ShareMediaType = "image" | "video";

export interface SharePlatformConfig {
  id: SharePlatform;
  label: string;
  shortLabel: string;
  apiRoute: `/api/share/${SharePlatform}`;
  accent: string;
  accentRgb: string;
}

export const SHARE_PLATFORMS: SharePlatformConfig[] = [
  {
    id: "tiktok",
    label: "TikTok",
    shortLabel: "TikTok",
    apiRoute: "/api/share/tiktok",
    accent: "#00f2ea",
    accentRgb: "0,242,234",
  },
  {
    id: "instagram",
    label: "Instagram Reels",
    shortLabel: "Reels",
    apiRoute: "/api/share/instagram",
    accent: "#e1306c",
    accentRgb: "225,48,108",
  },
  {
    id: "youtube",
    label: "YouTube Shorts",
    shortLabel: "Shorts",
    apiRoute: "/api/share/youtube",
    accent: "#ff0033",
    accentRgb: "255,0,51",
  },
];

export function getSharePlatform(id: SharePlatform): SharePlatformConfig {
  return SHARE_PLATFORMS.find((p) => p.id === id)!;
}
