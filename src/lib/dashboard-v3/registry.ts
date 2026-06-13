import { getCanvasToolBaseCoins } from "@/lib/canvas/tool-credit-costs";

export type ThemeKey = "green" | "blue" | "violet";

export const THEME_COLORS = {
  green: { r: 0, g: 255, b: 102, hex: "#00FF66", rgb: "0,255,102", label: "Schnellmodus" },
  blue: { r: 0, g: 102, b: 255, hex: "#0066FF", rgb: "0,102,255", label: "Profi-Modus" },
  violet: { r: 153, g: 0, b: 255, hex: "#9900FF", rgb: "153,0,255", label: "Leichtmodus" },
} as const;

export type ThemeColor = (typeof THEME_COLORS)[ThemeKey];

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: string[];
  creditCost: number;
  themeKey: ThemeKey;
  durations: string[];
  resolutions: string[];
  supportsStart: boolean;
  supportsEnd: boolean;
  supportsAudio: boolean;
  sampleMediaUrl: string;
  params: Record<string, string[]>;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "seedance-2.0-fast",
    name: "Seedance 2.0 Fast",
    provider: "Seedance",
    description: "Schnellere Variante mit Start-, End- und Referenzbild.",
    tags: ["Start", "End", "Referenz"],
    creditCost: 900,
    themeKey: "green",
    durations: ["2s", "5s", "8s"],
    resolutions: ["720p"],
    supportsStart: true,
    supportsEnd: true,
    supportsAudio: false,
    sampleMediaUrl: "/videos/landing/seedance-2-0.mp4",
    params: {
      cameraMovement: ["Keiner", "Rotate Around", "Zoom In", "Zoom Out", "Pan Left", "Pan Right"],
      shotType: ["Keiner", "Wide", "Medium", "Close-Up"],
      expression: ["Keiner", "Happy", "Neutral", "Surprised"],
      atmosphere: ["Keiner", "Dramatic", "Energetic", "Peaceful"],
      light: ["None", "Golden Hour", "Studio", "Natural"],
      effectEnhance: ["Keiner", "Leicht", "Mittel", "Stark"],
    },
  },
  {
    id: "seedance-2.0",
    name: "Seedance 2.0",
    provider: "Seedance",
    description: "Hochwertige Bild-zu-Video mit Audio & Referenz.",
    tags: ["Start", "End", "Audio", "Referenz"],
    creditCost: 1100,
    themeKey: "blue",
    durations: ["2s", "5s", "8s", "10s"],
    resolutions: ["720p", "1080p"],
    supportsStart: true,
    supportsEnd: true,
    supportsAudio: true,
    sampleMediaUrl: "/videos/landing/ki-influencer.mp4",
    params: {
      cameraMovement: [
        "Keiner",
        "Rotate Around",
        "Zoom In",
        "Zoom Out",
        "Pan Left",
        "Pan Right",
        "Tilt Up",
        "Tilt Down",
      ],
      shotType: ["Keiner", "Wide", "Medium", "Close-Up", "Extreme Close-Up"],
      expression: ["Keiner", "Happy", "Sad", "Surprised", "Angry", "Neutral"],
      atmosphere: ["Keiner", "Dramatic", "Romantic", "Mysterious", "Energetic", "Peaceful"],
      light: ["None", "Golden Hour", "Soft Box", "Studio", "Natural", "Neon"],
      effectEnhance: ["Keiner", "Leicht", "Mittel", "Stark"],
    },
  },
  {
    id: "hailuo-2.3-fast",
    name: "Hailuo 2.3 Fast",
    provider: "Minimax",
    description: "Günstigstes Medium-Qualität Modell. Schnell.",
    tags: ["Start"],
    creditCost: 150,
    themeKey: "violet",
    durations: ["4s", "6s"],
    resolutions: ["480p", "720p", "768p"],
    supportsStart: true,
    supportsEnd: false,
    supportsAudio: false,
    sampleMediaUrl: "/videos/landing/lora-training.mp4",
    params: {
      aspectRatio: ["16:9", "9:16", "1:1"],
    },
  },
  {
    id: "kling-3.0-omni",
    name: "Kling 3.0 Omni",
    provider: "Kling",
    description: "Höchste Identitätstreue. Audio-Video-Sync.",
    tags: ["Start", "End", "Audio"],
    creditCost: 800,
    themeKey: "blue",
    durations: ["5s", "10s"],
    resolutions: ["1080p"],
    supportsStart: true,
    supportsEnd: true,
    supportsAudio: true,
    sampleMediaUrl: "/videos/landing/ki-avatar.mp4",
    params: {
      cameraMovement: ["Static", "Rotate", "Zoom In", "Zoom Out", "Pan", "Crane"],
      shotType: ["Wide", "Medium", "Close-Up", "Cinematic"],
      atmosphere: ["Dramatic", "Golden", "Mystisch", "Clean"],
      light: ["Golden Hour", "Studio", "Natural", "Neon"],
    },
  },
];

export interface WorkspaceTool {
  id: string;
  label: string;
  icon: string;
  route: string;
  category: string;
  defaultModelId?: string;
  /** Base credit cost for sidebar / CTA hints */
  creditCost?: number | null;
  /** When true, cost varies with params (duration, resolution, etc.) */
  dynamicCreditCost?: boolean;
  comingSoon?: boolean;
}

export const WORKSPACE_TOOLS: WorkspaceTool[] = [
  // ERSTELLEN
  {
    id: "script-generator",
    label: "Script Generator",
    icon: "📝",
    route: "/dashboard/script-generator",
    category: "ERSTELLEN",
    creditCost: getCanvasToolBaseCoins("script-generator"),
  },
  {
    id: "viral-hook",
    label: "Viral Hook Generator",
    icon: "⚡",
    route: "/dashboard/viral-hook",
    category: "ERSTELLEN",
    creditCost: getCanvasToolBaseCoins("viral-hook"),
  },
  {
    id: "trend-script",
    label: "Trend Script",
    icon: "📈",
    route: "/dashboard/trend-to-script",
    category: "ERSTELLEN",
    creditCost: getCanvasToolBaseCoins("trend-script"),
  },
  {
    id: "content-kalender",
    label: "Content Kalender",
    icon: "📅",
    route: "/dashboard/content-kalender",
    category: "ERSTELLEN",
    creditCost: getCanvasToolBaseCoins("content-kalender"),
  },
  {
    id: "produkt-werbung",
    label: "Produkt-Werbung",
    icon: "📢",
    route: "/dashboard/produkt",
    category: "ERSTELLEN",
    creditCost: getCanvasToolBaseCoins("produkt-werbung"),
  },
  {
    id: "ad-creator",
    label: "Ad Creator",
    icon: "🛍",
    route: "/dashboard/ad-creator",
    category: "ERSTELLEN",
    creditCost: 8,
  },
  {
    id: "thumbnail-concept",
    label: "Thumbnail Konzept",
    icon: "🖼",
    route: "/dashboard/thumbnail-concept",
    category: "ERSTELLEN",
    creditCost: 1,
  },
  // VISUALS
  {
    id: "bild-generator",
    label: "Bild Generator",
    icon: "🎨",
    route: "/dashboard/image-generator",
    category: "VISUALS",
    creditCost: getCanvasToolBaseCoins("flux-image"),
    dynamicCreditCost: true,
  },
  {
    id: "ki-ich",
    label: "Mein KI-Ich",
    icon: "👤",
    route: "/dashboard/ki-influencer",
    category: "VISUALS",
    creditCost: getCanvasToolBaseCoins("ki-ich"),
  },
  {
    id: "lora-training",
    label: "LoRA Training",
    icon: "🧬",
    route: "/dashboard/lora-training",
    category: "VISUALS",
    creditCost: getCanvasToolBaseCoins("lora-training"),
    dynamicCreditCost: true,
  },
  {
    id: "upscaler",
    label: "HD Upscaler",
    icon: "🔍",
    route: "/dashboard/upscaler",
    category: "VISUALS",
    creditCost: 4,
  },
  {
    id: "ugc-video",
    label: "UGC Video",
    icon: "📱",
    route: "/dashboard/ugc-video",
    category: "VISUALS",
    creditCost: 5,
  },
  {
    id: "ecommerce-ads",
    label: "E-Commerce Ads",
    icon: "🛒",
    route: "/dashboard/ecommerce-ads",
    category: "VISUALS",
    creditCost: 8,
  },
  // VIDEO & FILM
  {
    id: "story-creator",
    label: "Story Creator",
    icon: "✨",
    route: "/dashboard/story-creator",
    category: "VIDEO & FILM",
    creditCost: 15,
  },
  {
    id: "szenen-generator",
    label: "Szenen Generator",
    icon: "🎬",
    route: "/dashboard/szenen-generator",
    category: "VIDEO & FILM",
    defaultModelId: "seedance-2.0-fast",
    creditCost: getCanvasToolBaseCoins("seedance-video"),
    dynamicCreditCost: true,
  },
  {
    id: "video-transformer",
    label: "Video Transformer",
    icon: "🎭",
    route: "/dashboard/video-transformer",
    category: "VIDEO & FILM",
    creditCost: getCanvasToolBaseCoins("video-transformer"),
  },
  {
    id: "video-remix",
    label: "Video Remix",
    icon: "🔁",
    route: "/dashboard/video-remix",
    category: "VIDEO & FILM",
    creditCost: 2,
  },
  {
    id: "motion-transfer",
    label: "Motion Transfer",
    icon: "💃",
    route: "/dashboard/motion-transfer",
    category: "VIDEO & FILM",
    creditCost: 8,
  },
  {
    id: "video-uebersetzer",
    label: "Video Übersetzer",
    icon: "🌐",
    route: "/dashboard/video-uebersetzer",
    category: "VIDEO & FILM",
    creditCost: getCanvasToolBaseCoins("video-uebersetzer"),
    dynamicCreditCost: true,
  },
  // AVATAR & LIVE
  {
    id: "live-creator",
    label: "Live Creator",
    icon: "🎥",
    route: "/dashboard/live-creator",
    category: "AVATAR & LIVE",
    creditCost: 2,
    dynamicCreditCost: true,
  },
  {
    id: "avatar-studio",
    label: "Avatar Studio",
    icon: "🤖",
    route: "/dashboard/avatar-studio",
    category: "AVATAR & LIVE",
    creditCost: getCanvasToolBaseCoins("avatar-studio"),
    dynamicCreditCost: true,
  },
  {
    id: "character-studio",
    label: "Character Studio",
    icon: "👥",
    route: "/dashboard/character-studio",
    category: "AVATAR & LIVE",
    creditCost: 5,
  },
  {
    id: "lipsync-studio",
    label: "Lipsync Studio",
    icon: "💋",
    route: "/dashboard/lipsync-studio",
    category: "AVATAR & LIVE",
    creditCost: getCanvasToolBaseCoins("lipsync-studio"),
  },
  {
    id: "face-studio",
    label: "Face Studio",
    icon: "🎭",
    route: "/dashboard/face-studio",
    category: "AVATAR & LIVE",
    creditCost: 5,
    dynamicCreditCost: true,
  },
  // AUDIO
  {
    id: "melodia",
    label: "Melodia Studio",
    icon: "🎵",
    route: "/dashboard/melodia",
    category: "AUDIO",
    creditCost: getCanvasToolBaseCoins("melodia-studio"),
  },
  // INTELLIGENCE
  {
    id: "agent-autopilot",
    label: "Agent Autopilot",
    icon: "⭐",
    route: "/dashboard/ki-agent",
    category: "INTELLIGENCE",
    creditCost: getCanvasToolBaseCoins("agent-autopilot"),
    dynamicCreditCost: true,
  },
  {
    id: "autopilot-kampagne",
    label: "Campaign Autopilot",
    icon: "🚀",
    route: "/dashboard/campaign-autopilot",
    category: "INTELLIGENCE",
    creditCost: 5,
    dynamicCreditCost: true,
  },
  {
    id: "viral-score",
    label: "Viral Score",
    icon: "📊",
    route: "/dashboard/viral-score",
    category: "INTELLIGENCE",
    creditCost: 2,
  },
  {
    id: "outlier-detector",
    label: "Outlier Detector",
    icon: "🔥",
    route: "/dashboard/outlier-detector",
    category: "INTELLIGENCE",
    creditCost: 3,
  },
  {
    id: "niche-analyzer",
    label: "Niche Analyzer",
    icon: "📈",
    route: "/dashboard/niche-analyzer",
    category: "INTELLIGENCE",
    creditCost: 2,
  },
  {
    id: "competitor",
    label: "Konkurrenz-Analyse",
    icon: "🕵",
    route: "/dashboard/competitor",
    category: "INTELLIGENCE",
    creditCost: 5,
  },
  // WORKFLOW
  {
    id: "studio-archiv",
    label: "Studio Archiv",
    icon: "🗂",
    route: "/dashboard/gallery",
    category: "WORKFLOW",
    creditCost: null,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "📉",
    route: "/dashboard/analytics",
    category: "WORKFLOW",
    creditCost: null,
  },
];

export const TOOL_CATEGORIES = [
  "ERSTELLEN",
  "VISUALS",
  "VIDEO & FILM",
  "AVATAR & LIVE",
  "AUDIO",
  "INTELLIGENCE",
  "WORKFLOW",
] as const;

export function formatWorkspaceToolCredits(tool: WorkspaceTool): string | null {
  if (tool.comingSoon) return null;
  if (tool.creditCost == null) return null;
  const prefix = tool.dynamicCreditCost ? "ab " : "";
  return `${prefix}${tool.creditCost} Credits`;
}

export function getToolByRoute(pathname: string): WorkspaceTool | undefined {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/ki-agent")) {
    return WORKSPACE_TOOLS.find((t) => t.id === "agent-autopilot");
  }
  return WORKSPACE_TOOLS.find(
    (t) => pathname === t.route || pathname.startsWith(`${t.route}/`)
  );
}
