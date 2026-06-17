export const PRODUCT_STORIES = [
  {
    id: "image",
    number: "01",
    title: "IMAGE STUDIO",
    description: "Generate campaign-ready visuals from any prompt.",
    href: "/dashboard/image-generator",
    mockup: "image" as const,
  },
  {
    id: "video",
    number: "02",
    title: "VIDEO STUDIO",
    description: "Animate images into cinematic clips in seconds.",
    href: "/dashboard/szenen-generator",
    mockup: "video" as const,
  },
  {
    id: "agent",
    number: "03",
    title: "CAMPAIGN AGENT",
    description: "From one brief to a complete content package.",
    href: "/dashboard/ki-agent",
    mockup: "agent" as const,
  },
  {
    id: "avatar",
    number: "04",
    title: "AVATAR STUDIO",
    description: "Your face. Any scene. Any language.",
    href: "/dashboard/avatar-studio",
    mockup: "avatar" as const,
  },
] as const;
