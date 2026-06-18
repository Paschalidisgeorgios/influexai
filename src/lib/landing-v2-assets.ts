/** Landing-v2 preview — asset paths */

import { LANDING_V2_COPY } from "./landing-v2-copy";
import { LORA_REFERENCE_IMAGES } from "./landing-v2-studio-demo-scenarios";

export type LandingV2AssetSlot = {
  id: string;
  label: string;
  placeholderLabel: string;
  kind: "image" | "video";
  primary: string;
  poster?: string;
};

export const LANDING_V2_AUDIENCE = ["Creator", "Brands", "E-Commerce", "Teams"] as const;

export const LANDING_V2_ASSETS = {
  /** Brand mark — live intro reveal (transparent PNG) */
  brandLogo: "/images/brand/influexai-logo-transparent.png",
  /** LoRA training demo reference thumbnails (preview only) */
  loraTrainingReferences: LORA_REFERENCE_IMAGES,
  hero: {
    webm: "/videos/landing/hero-loop.webm",
    mp4: "/videos/landing/hero-loop.mp4",
    poster: "/images/landing/hero-poster.jpg",
    placeholderLabel: "Studio Cockpit",
  },
  /** Preview hero backdrop — ping-pong loop (preview only) */
  heroPreviewVideo: {
    mp4: "/videos/landing/influexai-video-loop.mp4",
    webm: "/videos/landing/influexai-video-loop.webm",
    poster: "/videos/studio/studio-poster.webp",
  },
  /** Editorial landing film — same source as preview hero */
  editorialVideo: {
    mp4: "/videos/landing/influexai-video.mp4",
    poster: "/videos/studio/studio-poster.webp",
  },
  /** Hero backdrop loop — studio assets (fallback) */
  heroBackdrop: {
    webm: "/videos/studio/studio-loop.webm",
    mp4: "/videos/studio/studio-loop.mp4",
    poster: "/videos/studio/studio-poster.webp",
  },
  /** Existing studio loop — hero panel ambient background */
  studioLoop: {
    webm: "/videos/studio/studio-loop.webm",
    mp4: "/videos/studio/studio-loop.mp4",
    poster: "/videos/studio/studio-poster.webp",
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
