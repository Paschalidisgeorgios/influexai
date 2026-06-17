/** Asset paths for landing-v2 preview — primary targets + optional studio fallbacks for video only */

export type LandingV2AssetSlot = {
  id: string;
  label: string;
  kind: "image" | "video";
  primary: string;
  /** Used only when primary 404s — still a real file, not a fake claim */
  studioFallback?: string;
  poster?: string;
  studioPosterFallback?: string;
};

export const LANDING_V2_ASSETS = {
  hero: {
    webm: "/videos/landing/hero-loop.webm",
    mp4: "/videos/landing/hero-loop.mp4",
    poster: "/images/landing/hero-poster.webp",
    studioWebm: "/videos/studio/studio-loop.webm",
    studioMp4: "/videos/studio/studio-loop.mp4",
    studioPoster: "/videos/studio/studio-poster.webp",
  },
  outputVideo: {
    webm: "/videos/landing/output-video-loop-01.webm",
    mp4: "/videos/landing/output-video-loop-01.mp4",
    poster: "/images/landing/output-video-poster-01.webp",
    studioWebm: "/videos/studio/studio-loop.webm",
    studioMp4: "/videos/studio/studio-loop.mp4",
    studioPoster: "/videos/studio/studio-poster.webp",
  },
  products: [
    {
      id: "studio",
      label: "Studio Cockpit",
      kind: "image" as const,
      primary: "/images/landing/product-studio.webp",
    },
    {
      id: "tools",
      label: "Tools Hub",
      kind: "image" as const,
      primary: "/images/landing/product-tools.webp",
    },
    {
      id: "agent",
      label: "Agent Briefing",
      kind: "image" as const,
      primary: "/images/landing/product-agent.webp",
    },
    {
      id: "gallery",
      label: "Galerie",
      kind: "image" as const,
      primary: "/images/landing/product-gallery.webp",
    },
  ] satisfies LandingV2AssetSlot[],
  proofImage: {
    id: "output-image",
    label: "Beispiel-Visual",
    kind: "image" as const,
    primary: "/images/landing/output-image-01.webp",
  } satisfies LandingV2AssetSlot,
} as const;

export const SCROLL_STORY_STATIONS = [
  {
    id: "briefing",
    label: "Briefing",
    title: "Hook und Richtung festlegen",
    description:
      "Starte mit einer klaren Idee — der Agent strukturiert Briefing, Hook und nächsten Produktionsschritt.",
  },
  {
    id: "path",
    label: "Produktionspfad",
    title: "Pfad wählen, nicht Tool suchen",
    description:
      "Bild, Video oder Kampagne — drei Wege statt zehn lose Tabs.",
  },
  {
    id: "image",
    label: "Bild",
    title: "Kampagnen-Visuals erzeugen",
    description:
      "Produktmotive und Social Visuals direkt im Studio — bereit für den nächsten Schritt.",
  },
  {
    id: "motion",
    label: "Motion",
    title: "Aus Bildern werden Clips",
    description:
      "Motion-Clips aus Visuals oder Szenenbeschreibungen — im gleichen Workflow.",
  },
  {
    id: "gallery",
    label: "Galerie",
    title: "Assets sammeln und weiterverwenden",
    description:
      "Alle Outputs an einem Ort — wiederverwendbar für die nächste Kampagne.",
  },
] as const;
