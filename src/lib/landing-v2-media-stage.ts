/** Landing-v2 preview — cinematic media stage assets */

export type MediaStageState = "hero" | "system" | "workflow" | "studio" | "outputs";

export const LANDING_V2_MEDIA_STAGE = {
  /** Primary loop — hero + system (studio ambient, not static face poster) */
  primary: {
    mp4: "/videos/studio/studio-loop.mp4",
    webm: "/videos/studio/studio-loop.webm",
    poster: "/videos/studio/studio-poster.webp",
  },
  /** Editorial hook — used when available, falls back to primary in component */
  editorial: {
    mp4: "/videos/landing/influexai-video.mp4",
    poster: "/videos/studio/studio-poster.webp",
  },
  /** Motion / workflow layer */
  workflow: {
    mp4: "/videos/landing/output-video-loop-01.mp4",
    webm: "/videos/landing/output-video-loop-01.webm",
    poster: "/images/landing/hero-2.jpg",
    fallbackMp4: "/videos/studio/studio-loop.mp4",
    fallbackWebm: "/videos/studio/studio-loop.webm",
  },
  studio: {
    image: "/images/landing/hero-2.jpg",
    poster: "/videos/studio/studio-poster.webp",
  },
  outputs: {
    mp4: "/videos/landing/output-video-loop-01.mp4",
    webm: "/videos/landing/output-video-loop-01.webm",
    poster: "/images/landing/hero-3.jpg",
    image: "/images/landing/hero-3.jpg",
    fallbackMp4: "/videos/studio/studio-loop.mp4",
  },
  mobilePoster: "/videos/studio/studio-poster.webp",
} as const;

export const MEDIA_STAGE_SECTIONS: ReadonlyArray<{
  state: MediaStageState;
  selector: string;
}> = [
  { state: "hero", selector: ".landing-v2-hero" },
  { state: "system", selector: "#system" },
  { state: "workflow", selector: "#story" },
  { state: "studio", selector: "#studio" },
  { state: "outputs", selector: "#paths" },
] as const;
