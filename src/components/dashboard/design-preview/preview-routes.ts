/** MVP tool routes — preview links only, production paths unchanged */

export const PREVIEW_MVP_ROUTES = {
  imageGen: "/dashboard?tool=image-gen",
  imgToVideo: "/dashboard?tool=img-to-video",
  textToVideo: "/dashboard?tool=text-to-video",
  viralHook: "/dashboard?tool=viral-hook",
  contentCalendar: "/dashboard?tool=content-calendar",
  tools: "/dashboard?tool=tools",
  gallery: "/dashboard/gallery",
} as const;
