/** MVP tool routes — preview links only, production paths unchanged */

export const PREVIEW_MVP_ROUTES = {
  imageGen: "/dashboard?tool=image-gen",
  imageGenUltra: "/dashboard?tool=image-gen&quality=ultra&engine=flux-ultra",
  kiInfluencer: "/dashboard/ki-influencer",
  imgToVideo: "/dashboard?tool=img-to-video",
  textToVideo: "/dashboard?tool=text-to-video",
  viralHook: "/dashboard?tool=viral-hook",
  contentCalendar: "/dashboard?tool=content-calendar",
  tools: "/dashboard?tool=tools",
  gallery: "/dashboard/gallery",
  loraTraining: "/dashboard/lora-training",
  imageUpscale: "/dashboard/upscaler",
  videoUpscale: "/dashboard?tool=text-to-video",
} as const;
