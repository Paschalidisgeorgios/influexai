export const PRODUCT_STORIES = [
  {
    id: "image",
    number: "01 — IMAGE STUDIO",
    title: "Image Studio",
    description:
      "Generiere kampagnenfähige Bilder aus jedem Prompt. Claude optimiert deinen Text automatisch — auf Englisch, für das beste Ergebnis.",
    href: "/dashboard/image-generator",
    mockup: "image" as const,
  },
  {
    id: "video",
    number: "02 — VIDEO STUDIO",
    title: "Video Studio",
    description:
      "Animiere Bilder zu cinematischen Videos. TikTok, Reels, YouTube Shorts — das richtige Format wird automatisch erkannt.",
    href: "/dashboard/szenen-generator",
    mockup: "video" as const,
  },
  {
    id: "agent",
    number: "03 — CAMPAIGN AGENT",
    title: "Campaign Agent",
    description:
      "Beschreibe dein Ziel. Der Agent plant, generiert und liefert ein komplettes Content-Paket — Bilder, Videos, Hooks und Captions.",
    href: "/dashboard/ki-agent",
    mockup: "agent" as const,
  },
  {
    id: "avatar",
    number: "04 — AVATAR STUDIO",
    title: "Avatar Studio",
    description:
      "Dein Gesicht. Jede Szene. Jede Sprache. Sprechende Fotos, Lip Sync und AI Voice — alles in einem.",
    href: "/dashboard/avatar-studio",
    mockup: "avatar" as const,
  },
] as const;
