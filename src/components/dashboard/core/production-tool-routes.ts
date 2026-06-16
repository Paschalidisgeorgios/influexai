import type { ToolId } from "./DashboardLayout";

/** Dedicated dashboard pages — prefer these over ?tool= query + AgentBox legacy. */
export const TOOL_DEDICATED_ROUTES: Partial<Record<ToolId, string>> = {
  "viral-hook": "/dashboard/viral-hook",
  "content-calendar": "/dashboard/content-kalender",
  "trend-script": "/dashboard/trend-to-script",
  "image-gen": "/dashboard/image-generator",
  "img-to-video": "/dashboard/szenen-generator",
  "face-swap-video": "/dashboard/face-studio",
  "face-swap-image": "/dashboard/face-studio",
  "live-face-swap": "/dashboard/face-studio",
  "talking-photo": "/dashboard/live-portrait",
  "talking-avatar": "/dashboard/lipsync-studio",
  "character-swap": "/dashboard/character-studio",
  "char-studio-video": "/dashboard/character-studio",
  "char-studio-image": "/dashboard/character-studio",
  "avatar-video": "/dashboard/avatar-studio",
  "video-translation": "/dashboard/video-translation",
  "tts": "/dashboard/melodia",
  "voice-clone": "/dashboard/melodia",
  "voice-changer": "/dashboard/melodia",
  "ai-video-editor": "/dashboard/video-editor",
  "ecommerce-ads": "/dashboard/ecommerce-ads",
  "text-to-video": "/dashboard/text-to-video",
};

export type ToolOverviewCategory = {
  id: string;
  title: string;
  description: string;
  tools: {
    id: ToolId;
    label: string;
    description: string;
  }[];
};

export const TOOL_OVERVIEW_CATEGORIES: ToolOverviewCategory[] = [
  {
    id: "text",
    title: "Text & Kampagne",
    description: "Hooks, Scripts und Content-Planung.",
    tools: [
      { id: "viral-hook", label: "Viral Hook", description: "Hook aus Trend oder Briefing extrahieren" },
      { id: "content-calendar", label: "Content Kalender", description: "30-Tage-Plan mit Hooks" },
      { id: "trend-script", label: "Trend Script", description: "Trend → Script in Minuten" },
    ],
  },
  {
    id: "photo",
    title: "Foto",
    description: "Bildgenerierung und Bild-zu-Bild.",
    tools: [
      { id: "image-gen", label: "Bildgenerator", description: "KI-Bilder für Content & Ads" },
      { id: "img-to-img", label: "Bild zu Bild", description: "Variationen und Remix" },
    ],
  },
  {
    id: "video",
    title: "Video",
    description: "Clips, Szenen und Video-Transformation.",
    tools: [
      { id: "img-to-video", label: "Bild zu Video", description: "Statisches Bild animieren" },
      { id: "text-to-video", label: "Text zu Video", description: "Prompt → Video-Clip" },
      { id: "ai-video-editor", label: "KI-Videoeditor", description: "Stil-Transfer & Bearbeitung" },
      { id: "ecommerce-ads", label: "E-Commerce Ads", description: "Produkt-Clips für Ads" },
    ],
  },
  {
    id: "avatar",
    title: "Avatar & Voice",
    description: "Avatare, Lip Sync und Stimme.",
    tools: [
      { id: "avatar-video", label: "Avatar Studio", description: "Sprechende Avatare" },
      { id: "talking-avatar", label: "Lip Sync", description: "Video mit synchronen Lippen" },
      { id: "talking-photo", label: "Live Portrait", description: "Foto zum sprechenden Clip" },
      { id: "tts", label: "Melodia Studio", description: "TTS, Voice Clone, Voice Changer" },
    ],
  },
  {
    id: "brand",
    title: "Brand / Assets",
    description: "Outputs verwalten und weiterverwenden.",
    tools: [
      { id: "gallery", label: "Galerie", description: "Generierte Assets ansehen" },
    ],
  },
];

export function resolveToolRoute(toolId: ToolId): string | null {
  return TOOL_DEDICATED_ROUTES[toolId] ?? null;
}

export function isDedicatedToolPath(pathname: string): boolean {
  return Object.values(TOOL_DEDICATED_ROUTES).some((route) =>
    pathname.startsWith(route)
  );
}
