/** Landing-v2 preview — asset paths */

import { LANDING_V2_COPY } from "./landing-v2-copy";

export type LandingV2AssetSlot = {
  id: string;
  label: string;
  placeholderLabel: string;
  kind: "image" | "video";
  primary: string;
  poster?: string;
};

export const LANDING_V2_AUDIENCE = LANDING_V2_COPY.hero.chips;

export const LANDING_V2_ASSETS = {
  hero: {
    webm: "/videos/landing/hero-loop.webm",
    mp4: "/videos/landing/hero-loop.mp4",
    poster: "/images/landing/hero-poster.webp",
    placeholderLabel: "Studio Preview",
  },
  outputVideo: {
    webm: "/videos/landing/output-video-loop-01.webm",
    mp4: "/videos/landing/output-video-loop-01.mp4",
    poster: "/images/landing/output-video-poster-01.webp",
    placeholderLabel: "Motion Draft",
  },
  products: [
    {
      id: "studio",
      label: "Studio Cockpit",
      placeholderLabel: "Studio Cockpit",
      kind: "image" as const,
      primary: "/images/landing/product-studio.webp",
    },
    {
      id: "tools",
      label: "Tools Hub",
      placeholderLabel: "Tools Hub",
      kind: "image" as const,
      primary: "/images/landing/product-tools.webp",
    },
    {
      id: "agent",
      label: "Agent Briefing",
      placeholderLabel: "Agent Briefing",
      kind: "image" as const,
      primary: "/images/landing/product-agent.webp",
    },
    {
      id: "gallery",
      label: "Galerie",
      placeholderLabel: "Galerie",
      kind: "image" as const,
      primary: "/images/landing/product-gallery.webp",
    },
  ] satisfies LandingV2AssetSlot[],
  proofImage: {
    id: "output-image",
    label: "Campaign Visual",
    placeholderLabel: "Campaign Visual",
    kind: "image" as const,
    primary: "/images/landing/output-image-01.webp",
  } satisfies LandingV2AssetSlot,
} as const;

/** @deprecated Use LANDING_V2_COPY.workflow.stations */
export const SCROLL_STORY_STATIONS = LANDING_V2_COPY.workflow.stations;
