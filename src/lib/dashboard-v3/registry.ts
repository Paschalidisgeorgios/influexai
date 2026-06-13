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
}

export const WORKSPACE_TOOLS: WorkspaceTool[] = [
  { id: "viral-hook", label: "Viral Hook", icon: "⚡", route: "/dashboard/viral-hook", category: "ERSTELLEN" },
  {
    id: "content-kalender",
    label: "Content Kalender",
    icon: "📅",
    route: "/dashboard/content-kalender",
    category: "ERSTELLEN",
  },
  { id: "trend-script", label: "Trend Script", icon: "📈", route: "/dashboard/trend-to-script", category: "ERSTELLEN" },
  { id: "produkt-werbung", label: "Produkt-Werbung", icon: "📢", route: "/dashboard/produkt", category: "ERSTELLEN" },
  { id: "bild-generator", label: "Bild Generator", icon: "🖼", route: "/dashboard/image-generator", category: "VISUALS" },
  { id: "ki-ich", label: "KI-Ich", icon: "👤", route: "/dashboard/ki-influencer", category: "VISUALS" },
  { id: "lora-training", label: "LoRA Training", icon: "🎨", route: "/dashboard/lora-training", category: "VISUALS" },
  { id: "studio-archiv", label: "Studio Archiv", icon: "🗂", route: "/dashboard/gallery", category: "VISUALS" },
  {
    id: "szenen-generator",
    label: "Szenen Generator",
    icon: "🎬",
    route: "/dashboard/szenen-generator",
    category: "VIDEO & FILM",
    defaultModelId: "seedance-2.0-fast",
  },
  { id: "story-creator", label: "Story Creator", icon: "✨", route: "/dashboard/story-creator", category: "VIDEO & FILM" },
  {
    id: "video-transformer",
    label: "Video Transformer",
    icon: "🎭",
    route: "/dashboard/video-transformer",
    category: "VIDEO & FILM",
  },
  {
    id: "video-uebersetzer",
    label: "Video Übersetzer",
    icon: "🌐",
    route: "/dashboard/video-uebersetzer",
    category: "VIDEO & FILM",
  },
  { id: "live-creator", label: "Live Creator", icon: "🎥", route: "/dashboard/live-creator", category: "AVATAR & LIVE" },
  { id: "avatar-studio", label: "Avatar Studio", icon: "🤖", route: "/dashboard/avatar-studio", category: "AVATAR & LIVE" },
  {
    id: "character-studio",
    label: "Character Studio",
    icon: "👥",
    route: "/dashboard/character-studio",
    category: "AVATAR & LIVE",
  },
  { id: "lipsync-studio", label: "Lipsync Studio", icon: "💋", route: "/dashboard/lipsync", category: "AVATAR & LIVE" },
  { id: "melodia", label: "Melodia Studio", icon: "🎵", route: "/dashboard/melodia", category: "AUDIO" },
  { id: "ad-creator", label: "Ad Creator", icon: "🛍", route: "/dashboard/ecommerce-ads", category: "WERBUNG" },
  { id: "agent-autopilot", label: "Agent Autopilot", icon: "⭐", route: "/dashboard/ki-agent", category: "AUTOMATION" },
  {
    id: "autopilot-kampagne",
    label: "Autopilot Kampagne",
    icon: "🚀",
    route: "/dashboard/campaign-autopilot",
    category: "AUTOMATION",
  },
];

export const TOOL_CATEGORIES = [
  "ERSTELLEN",
  "VISUALS",
  "VIDEO & FILM",
  "AVATAR & LIVE",
  "AUDIO",
  "WERBUNG",
  "AUTOMATION",
] as const;

export function getToolByRoute(pathname: string): WorkspaceTool | undefined {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/ki-agent")) {
    return WORKSPACE_TOOLS.find((t) => t.id === "agent-autopilot");
  }
  return WORKSPACE_TOOLS.find(
    (t) => pathname === t.route || pathname.startsWith(`${t.route}/`)
  );
}
