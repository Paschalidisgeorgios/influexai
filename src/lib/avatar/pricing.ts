import type { AvatarRenderOptions } from "./types";

export const AVATAR_BASE_CREDITS: Record<number, number> = {
  15: 5,
  30: 9,
  60: 16,
};

export const AVATAR_ADDON_CREDITS = {
  resolution_1080p: 3,
  subtitles: 1,
  voiceover: 2,
  branding: 1,
} as const;

export function estimateAvatarCredits(options: AvatarRenderOptions): number {
  let total = AVATAR_BASE_CREDITS[options.durationSeconds] ?? 9;

  if (options.resolution === "1080p") {
    total += AVATAR_ADDON_CREDITS.resolution_1080p;
  }
  if (options.subtitles) {
    total += AVATAR_ADDON_CREDITS.subtitles;
  }
  if (options.voiceover) {
    total += AVATAR_ADDON_CREDITS.voiceover;
  }
  if (options.branding) {
    total += AVATAR_ADDON_CREDITS.branding;
  }

  return total;
}

export function getCreditBreakdown(
  options: AvatarRenderOptions
): { label: string; credits: number }[] {
  const items: { label: string; credits: number }[] = [
    {
      label: `${options.durationSeconds}s Export`,
      credits: AVATAR_BASE_CREDITS[options.durationSeconds] ?? 9,
    },
  ];
  if (options.resolution === "1080p") {
    items.push({ label: "1080p Qualität", credits: 3 });
  }
  if (options.subtitles) {
    items.push({ label: "Untertitel", credits: 1 });
  }
  if (options.voiceover) {
    items.push({ label: "KI-Voiceover", credits: 2 });
  }
  if (options.branding) {
    items.push({ label: "Branding Overlay", credits: 1 });
  }
  return items;
}
