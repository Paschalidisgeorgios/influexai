import { LANDING_VIDEOS } from "@/lib/landing-video-urls";

export const LANDING_DEMO_VIDEOS = {
  kiAvatar: LANDING_VIDEOS.kiAvatar,
  kiInfluencer: LANDING_VIDEOS.kiInfluencer,
  loraTraining: LANDING_VIDEOS.loraTraining,
  seedance: LANDING_VIDEOS.seedance20,
} as const;

export type LandingDemoVideoKey = keyof typeof LANDING_DEMO_VIDEOS;
