/** Stable public paths for landing demo loops (public/videos/landing/). */
export const LANDING_DEMO_VIDEOS = {
  kiAvatar: "/videos/landing/ki-avatar.mp4",
  kiInfluencer: "/videos/landing/ki-influencer.mp4",
  loraTraining: "/videos/landing/lora-training.mp4",
  seedance: "/videos/landing/seedance-2-0.mp4",
} as const;

export type LandingDemoVideoKey = keyof typeof LANDING_DEMO_VIDEOS;
