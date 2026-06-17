/** Landing-v2 preview — copy, assets, scroll-story config */

export type LandingV2AssetSlot = {
  id: string;
  label: string;
  placeholderLabel: string;
  kind: "image" | "video";
  primary: string;
  poster?: string;
};

export const LANDING_V2_AUDIENCE = [
  "Creator",
  "Brands",
  "E-Commerce",
  "Lokale Unternehmen",
] as const;

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

export const SCROLL_STORY_STATIONS = [
  {
    id: "briefing",
    label: "Briefing",
    title: "Hook und Richtung festlegen",
    description:
      "Starte mit einer klaren Idee — Briefing, Hook und nächster Schritt in einer Fläche.",
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

export const PRODUCTION_PATH_PURPOSE: Record<string, string> = {
  image:
    "Für Produktbilder, Kampagnenmotive und Social Visuals — ohne Tool-Wechsel.",
  video:
    "Für Motion-Clips aus Bildern oder Szenen — ein klarer Video-Produktionsweg.",
  campaign:
    "Für Hooks, Inhalte und Rhythmus — Kampagne strukturieren statt lose planen.",
};
