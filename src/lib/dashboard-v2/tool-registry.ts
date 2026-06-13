import type { ThemeKey } from "./model-registry";

export type DashboardToolId =
  | "agent-autopilot"
  | "campaign-autopilot"
  | "viral-hook"
  | "content-kalender"
  | "trend-to-script"
  | "produkt"
  | "bild-generator"
  | "ki-influencer"
  | "lora-training"
  | "gallery"
  | "szenen-generator"
  | "story-creator"
  | "video-transformer"
  | "video-uebersetzer"
  | "live-creator"
  | "avatar-studio"
  | "character-studio"
  | "lipsync-studio"
  | "melodia"
  | "ad-creator"
  | "thumbnail-concept";

export type ToolCapabilityType =
  | "text-generation"
  | "image-generation"
  | "image-to-video"
  | "text-to-video"
  | "avatar"
  | "audio"
  | "campaign";

export interface DashboardToolDef {
  id: DashboardToolId;
  label: string;
  route: string;
  routeAliases?: string[];
  category: string;
  provider: string;
  themeKey: ThemeKey;
  capabilityType: ToolCapabilityType;
  modelIds: string[];
  hasModels: boolean;
  hasPrompt: boolean;
  hasPayload: boolean;
  creditBase: number;
  creditUnit: string;
  description: string;
}

export const DASHBOARD_TOOL_REGISTRY: Record<DashboardToolId, DashboardToolDef> =
  {
    "agent-autopilot": {
      id: "agent-autopilot",
      label: "Agent Autopilot",
      route: "/dashboard/ki-agent",
      routeAliases: ["/dashboard", "/dashboard/agent"],
      category: "automation",
      provider: "Influex Core",
      themeKey: "green",
      capabilityType: "text-generation",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 5,
      creditUnit: "pro Anfrage",
      description: "KI-Agent für Hooks, Scripts, Strategie und Content.",
    },
    "campaign-autopilot": {
      id: "campaign-autopilot",
      label: "Autopilot Kampagne",
      route: "/dashboard/campaign-autopilot",
      category: "automation",
      provider: "Influex Core",
      themeKey: "violet",
      capabilityType: "campaign",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 15,
      creditUnit: "pro Kampagne",
      description: "Multi-Channel-Kampagnen automatisch planen.",
    },
    "viral-hook": {
      id: "viral-hook",
      label: "Viral Hook Generator",
      route: "/dashboard/viral-hook",
      category: "erstellen",
      provider: "Influex Core",
      themeKey: "green",
      capabilityType: "text-generation",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 2,
      creditUnit: "pro Hook-Set",
      description: "Virale Hooks für TikTok, Reels und Shorts.",
    },
    "content-kalender": {
      id: "content-kalender",
      label: "Content Kalender",
      route: "/dashboard/content-kalender",
      category: "erstellen",
      provider: "Influex Core",
      themeKey: "blue",
      capabilityType: "text-generation",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 5,
      creditUnit: "pro Plan",
      description: "30-Tage Content-Plan mit Hooks und Themen.",
    },
    "trend-to-script": {
      id: "trend-to-script",
      label: "Trend Script",
      route: "/dashboard/trend-to-script",
      category: "erstellen",
      provider: "Influex Core",
      themeKey: "violet",
      capabilityType: "text-generation",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 3,
      creditUnit: "pro Script",
      description: "Trend → fertiges Video-Script in Sekunden.",
    },
    produkt: {
      id: "produkt",
      label: "Produkt-Werbung",
      route: "/dashboard/produkt",
      category: "erstellen",
      provider: "Influex Core",
      themeKey: "blue",
      capabilityType: "text-to-video",
      modelIds: ["akool-t2v-fast"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 75,
      creditUnit: "pro Spot",
      description: "Werbespots aus Produkt-URL generieren.",
    },
    "bild-generator": {
      id: "bild-generator",
      label: "Bild Generator",
      route: "/dashboard/image-generator",
      category: "visuals",
      provider: "fal.ai",
      themeKey: "green",
      capabilityType: "image-generation",
      modelIds: ["fal-ai/flux-2-pro", "fal-ai/flux-pro"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 8,
      creditUnit: "pro Bild",
      description: "KI-Bilder für Content, Thumbnails und Ads.",
    },
    "ki-influencer": {
      id: "ki-influencer",
      label: "KI-Ich",
      route: "/dashboard/ki-influencer",
      routeAliases: ["/dashboard/ki-ich"],
      category: "visuals",
      provider: "Influex Core",
      themeKey: "violet",
      capabilityType: "avatar",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 20,
      creditUnit: "pro Bild",
      description: "Dein Gesicht in jeder Szene.",
    },
    "lora-training": {
      id: "lora-training",
      label: "LoRA Training",
      route: "/dashboard/lora-training",
      category: "visuals",
      provider: "fal.ai",
      themeKey: "blue",
      capabilityType: "image-generation",
      modelIds: ["fal-ai/flux-pro"],
      hasModels: true,
      hasPrompt: false,
      hasPayload: true,
      creditBase: 50,
      creditUnit: "pro Training",
      description: "Eigenes Style-Modell trainieren.",
    },
    gallery: {
      id: "gallery",
      label: "Galerie",
      route: "/dashboard/gallery",
      category: "visuals",
      provider: "Influex Core",
      themeKey: "green",
      capabilityType: "image-generation",
      modelIds: [],
      hasModels: false,
      hasPrompt: false,
      hasPayload: false,
      creditBase: 0,
      creditUnit: "",
      description: "Alle generierten Assets an einem Ort.",
    },
    "szenen-generator": {
      id: "szenen-generator",
      label: "Szenen Generator",
      route: "/dashboard/szenen-generator",
      routeAliases: ["/dashboard/seedance", "/dashboard/video-generator"],
      category: "video-film",
      provider: "Akool",
      themeKey: "blue",
      capabilityType: "image-to-video",
      modelIds: ["seedance-2.0-fast", "seedance-2.0", "kling-3.0-omni"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 900,
      creditUnit: "pro Video",
      description: "Bild → Video mit cinematic Controls.",
    },
    "story-creator": {
      id: "story-creator",
      label: "Story Creator",
      route: "/dashboard/story-creator",
      routeAliases: ["/dashboard/text-to-video"],
      category: "video-film",
      provider: "Akool",
      themeKey: "violet",
      capabilityType: "text-to-video",
      modelIds: ["akool-t2v-fast"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 800,
      creditUnit: "pro Clip",
      description: "Text → Video für Stories und Reels.",
    },
    "video-transformer": {
      id: "video-transformer",
      label: "Video Transformer",
      route: "/dashboard/video-transformer",
      routeAliases: ["/dashboard/video-editor"],
      category: "video-film",
      provider: "Akool",
      themeKey: "blue",
      capabilityType: "image-to-video",
      modelIds: ["seedance-2.0"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 1100,
      creditUnit: "pro Transform",
      description: "Bestehendes Video neu stylen.",
    },
    "video-uebersetzer": {
      id: "video-uebersetzer",
      label: "Video Übersetzer",
      route: "/dashboard/video-uebersetzer",
      routeAliases: ["/dashboard/video-translation"],
      category: "video-film",
      provider: "Akool",
      themeKey: "violet",
      capabilityType: "text-to-video",
      modelIds: [],
      hasModels: false,
      hasPrompt: false,
      hasPayload: true,
      creditBase: 40,
      creditUnit: "pro Minute",
      description: "Video in andere Sprachen übersetzen.",
    },
    "live-creator": {
      id: "live-creator",
      label: "Live Creator",
      route: "/dashboard/live-creator",
      category: "avatar-live",
      provider: "Influex Core",
      themeKey: "green",
      capabilityType: "avatar",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 10,
      creditUnit: "pro Session",
      description: "Live-Avatar Streaming Studio.",
    },
    "avatar-studio": {
      id: "avatar-studio",
      label: "Avatar Studio",
      route: "/dashboard/avatar-studio",
      routeAliases: ["/dashboard/avatar"],
      category: "avatar-live",
      provider: "Influex Core",
      themeKey: "blue",
      capabilityType: "avatar",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 25,
      creditUnit: "pro Render",
      description: "Talking-Head Videos aus Script.",
    },
    "character-studio": {
      id: "character-studio",
      label: "Character Studio",
      route: "/dashboard/character-studio",
      category: "avatar-live",
      provider: "Akool",
      themeKey: "violet",
      capabilityType: "avatar",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 30,
      creditUnit: "pro Character",
      description: "KI-Charaktere designen und animieren.",
    },
    "lipsync-studio": {
      id: "lipsync-studio",
      label: "Lipsync Studio",
      route: "/dashboard/lipsync-studio",
      routeAliases: ["/dashboard/lipsync"],
      category: "avatar-live",
      provider: "Akool",
      themeKey: "blue",
      capabilityType: "avatar",
      modelIds: [],
      hasModels: false,
      hasPrompt: false,
      hasPayload: true,
      creditBase: 15,
      creditUnit: "pro Clip",
      description: "Lippensync für Avatar-Videos.",
    },
    melodia: {
      id: "melodia",
      label: "Melodia Studio",
      route: "/dashboard/melodia",
      routeAliases: ["/dashboard/stimme-musik", "/dashboard/voice-studio"],
      category: "audio",
      provider: "ElevenLabs",
      themeKey: "violet",
      capabilityType: "audio",
      modelIds: [],
      hasModels: false,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 5,
      creditUnit: "pro Track",
      description: "Musik und Voiceovers generieren.",
    },
    "ad-creator": {
      id: "ad-creator",
      label: "Ad Creator",
      route: "/dashboard/ad-creator",
      routeAliases: ["/dashboard/ecommerce-ads", "/dashboard/video-ad"],
      category: "werbung",
      provider: "Influex Core",
      themeKey: "green",
      capabilityType: "text-to-video",
      modelIds: ["akool-t2v-fast"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 50,
      creditUnit: "pro Ad",
      description: "Performance Ads für E-Commerce.",
    },
    "thumbnail-concept": {
      id: "thumbnail-concept",
      label: "Thumbnail Concept",
      route: "/dashboard/thumbnail-concept",
      category: "werbung",
      provider: "Influex Core",
      themeKey: "blue",
      capabilityType: "image-generation",
      modelIds: ["fal-ai/flux-2-pro"],
      hasModels: true,
      hasPrompt: true,
      hasPayload: true,
      creditBase: 3,
      creditUnit: "pro Konzept",
      description: "CTR-starke Thumbnail-Ideen.",
    },
  };

export function getToolByRoute(pathname: string): DashboardToolDef | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/dashboard";
  for (const tool of Object.values(DASHBOARD_TOOL_REGISTRY)) {
    if (path === tool.route || path.startsWith(`${tool.route}/`)) return tool;
    for (const alias of tool.routeAliases ?? []) {
      if (path === alias || path.startsWith(`${alias}/`)) return tool;
    }
  }
  if (path === "/dashboard") {
    return DASHBOARD_TOOL_REGISTRY["agent-autopilot"];
  }
  return null;
}

export function getDefaultModelId(tool: DashboardToolDef): string | null {
  return tool.modelIds[0] ?? null;
}
