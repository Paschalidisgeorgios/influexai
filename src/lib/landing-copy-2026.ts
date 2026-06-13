import type { IntentKey } from "@/hooks/useIntentTracking";
import { LANDING_DEMO_VIDEOS } from "@/lib/landing-demo-videos";

export type LandingCopySegment = {
  text: string;
  highlight?: boolean;
};

export type LandingFeatureCardCopy = {
  id: string;
  title: string;
  tag: string;
  segments: LandingCopySegment[];
  accent: "green" | "blue" | "gold";
  intentKey: IntentKey;
  videoSrc?: string;
};

export const LANDING_HERO_2026 = {
  kicker: "App Studio · KI-Creator-Plattform 2026",
  headlineStatic: "Dein Studio für",
  headlineRotating: [
    "KI-Visuals",
    "Videos",
    "virale Hooks",
    "KI-Avatare",
    "Kampagnen",
    "Content-Workflows",
  ] as const,
  subheadline:
    "InfluexAI bündelt Hooks, Visuals, Videos, Avatare und Kampagnen-Workflows in einem Studio.",
  ctaPrimary: "Studio starten",
  ctaSecondary: "So funktioniert es",
  welcomeStudio: (name: string) =>
    `Willkommen, ${name}. Dein App Studio ist bereit.`,
} as const;

export const LANDING_STUDIO_SECTION_2026 = {
  statusMessages: [
    "App Studio bereit",
    "Claude Script Engine online",
    "B-Roll Matcher aktiv",
    "Viral-Predictor synchronisiert",
    "Seedance Render-Queue offen",
  ],
  headline: "Briefing rein.",
  headlineAccent: "Pipeline raus.",
  subline:
    "Skript, Score, B-Roll und Video — als verbundene Nodes in deinem App Studio, nicht als lose Tabs.",
  featuresKicker: "Core Stack · 2026",
  featuresTitle: "Vier Säulen. Ein Flow.",
  featuresSubline:
    "Die Features, die du gerade live im Studio nutzt — erklärt für Creator, die 2026 wirklich skalieren wollen.",
} as const;

export const LANDING_FEATURE_CARDS_2026: LandingFeatureCardCopy[] = [
  {
    id: "infinite-canvas",
    title: "App Studio",
    tag: "Studio",
    accent: "green",
    intentKey: "agent-autopilot",
    segments: [
      { text: "Verbinde Skripte, Flux-Bilder und Video-Nodes in deinem " },
      {
        text: "App Studio",
        highlight: true,
      },
      {
        text: " — mit Laser-Edges, Claude-Premium-Skripten und automatischem B-Roll-Matching pro Abschnitt.",
      },
    ],
  },
  {
    id: "seedance-kling",
    title: "Seedance & Kling Engine",
    tag: "Video Engine",
    accent: "blue",
    intentKey: "video-film",
    videoSrc: LANDING_DEMO_VIDEOS.seedance,
    segments: [
      { text: "Bild-zu-Video und text-gesteuerte Szenen mit " },
      { text: "Seedance 2.0 & Kling", highlight: true },
      {
        text: " in einer Pipeline. Hochvisuelle Prompts landen direkt als vorbefüllte Video-Kacheln neben deinem Skript.",
      },
    ],
  },
  {
    id: "avatar-studio",
    title: "Avatar Studio",
    tag: "Avatar · Live",
    accent: "gold",
    intentKey: "avatar-live",
    videoSrc: LANDING_DEMO_VIDEOS.kiAvatar,
    segments: [
      { text: "Trainiere deinen digitalen Creator einmal — nutze ihn für " },
      { text: "Lipsync, UGC und Live-Formate", highlight: true },
      {
        text: ". Konsistente Markenidentität ohne neues Shooting, direkt angebunden an dein Skript.",
      },
    ],
  },
  {
    id: "viral-predictor",
    title: "Viral-Predictor",
    tag: "Intelligence",
    accent: "green",
    intentKey: "werbung",
    segments: [
      { text: "Echtzeit-Trend-Matching gegen unsere " },
      { text: "2026-Datenbank", highlight: true },
      {
        text: ". Viral-Score, Keyword-Boosts und Thumbnail-CTR-Signale — bevor du publishst, nicht danach.",
      },
    ],
  },
];
