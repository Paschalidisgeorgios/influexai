/** Static demo metadata for landing page — no API calls, no credits. */

export type ToolIntelligenceEntry = {
  toolId: string;
  agentHint: string;
};

export const toolIntelligenceData: ToolIntelligenceEntry[] = [
  {
    toolId: "script",
    agentHint: "Agent nutzt dieses Tool für Hook → Story → CTA.",
  },
  {
    toolId: "product",
    agentHint: "Agent wandelt Produktdaten in Reel-Ad, Caption und CTA.",
  },
  {
    toolId: "thumbnail",
    agentHint: "Agent prüft Lesbarkeit, Kontrast und Click-Fit.",
  },
  {
    toolId: "agent",
    agentHint: "Orchestriert mehrere Tools automatisch.",
  },
  {
    toolId: "ki_ich",
    agentHint: "Erstellt KI-Avatar-Konzepte aus Foto-Input.",
  },
  {
    toolId: "image_gen",
    agentHint: "Erstellt Visuals mit Quality Gate gegen Text-/Logo-Fehler.",
  },
  {
    toolId: "viral_hook",
    agentHint: "Bewertet Hooks nach Scroll-Stop, Klarheit und Zielgruppen-Fit.",
  },
  {
    toolId: "content_kalender",
    agentHint: "Plant Content nach Ziel, Frequenz und Plattform.",
  },
  {
    toolId: "trend_script",
    agentHint: "Übersetzt Trends in fertige Video-Scripts.",
  },
  {
    toolId: "voice",
    agentHint: "Bereitet Voiceover und Audio-Stil vor.",
  },
  {
    toolId: "live",
    agentHint: "Avatar-Live-Workflows für spätere Videoformate.",
  },
  {
    toolId: "lora",
    agentHint: "Sichert konsistenten Look für Marken und Creator.",
  },
];

export const pricingCreditExamples = [
  "Scripts & Hooks",
  "Bildideen & Visual-Briefings",
  "Content-Kalender",
  "Avatar-Workflows",
  "Kampagnenpakete",
] as const;

export {
  STACKED_DEMO_STEP_IDS,
  HERO_SCENE_IDS,
  ACTIVITY_STREAM_IDS,
  CAMPAIGN_MODE_IDS,
  QUALITY_CHECK_IDS,
  STACKED_SCORE_KEYS,
  type StackedDemoStepId,
  type HeroSceneId,
} from "@/lib/landing-demo-ids";
