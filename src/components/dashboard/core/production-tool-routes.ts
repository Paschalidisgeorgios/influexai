import type { ToolId } from "./DashboardLayout";

/** Dedicated dashboard pages — exist but locked from nav until redesign (Phase 2B.4). */
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

/** Query-param aliases → canonical ToolId for launch views */
export const TOOL_QUERY_ALIASES: Record<string, ToolId> = {
  "image-generator": "image-gen",
  "bild-generator": "image-gen",
  "video-generator": "img-to-video",
  "szenen-generator": "img-to-video",
  "image-to-video": "img-to-video",
};

const LAUNCH_TOOL_IDS = new Set<ToolId>([
  ...(Object.keys(TOOL_DEDICATED_ROUTES) as ToolId[]),
  ...Object.values(TOOL_QUERY_ALIASES),
  "img-to-img",
]);

const PATH_TO_LAUNCH_TOOL = new Map<string, ToolId>();
for (const [toolId, path] of Object.entries(TOOL_DEDICATED_ROUTES) as [ToolId, string][]) {
  PATH_TO_LAUNCH_TOOL.set(path, toolId);
}

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
    description: "Hooks, Scripts und Planung für Social und Ads.",
    tools: [
      { id: "viral-hook", label: "Viral Hook", description: "Einstiege für Reels, Shorts und Ads" },
      { id: "content-calendar", label: "Content Kalender", description: "Themen, Formate und Rhythmus planen" },
      { id: "trend-script", label: "Trend Script", description: "Trend-Thema in ein Script überführen" },
    ],
  },
  {
    id: "photo",
    title: "Bild & Produktvisuals",
    description: "Motive für Social, Ads und Produktpräsentation.",
    tools: [
      { id: "image-gen", label: "Bildgenerator", description: "Produkt- und Kampagnenmotive erstellen" },
      { id: "img-to-img", label: "Bild zu Bild", description: "Variationen und Remix aus Vorlage" },
    ],
  },
  {
    id: "video",
    title: "Video-Produktion",
    description: "Motion-Clips aus Bild oder Szenenbeschreibung.",
    tools: [
      { id: "img-to-video", label: "Bild zu Video", description: "Startbild in Motion-Clip verwandeln" },
      { id: "text-to-video", label: "Text zu Video", description: "Clip aus Szenenbeschreibung" },
      { id: "ai-video-editor", label: "Videoeditor", description: "Stil-Transfer und Bearbeitung" },
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
    title: "Brand & Assets",
    description: "Fertige Assets sammeln und weiterverwenden.",
    tools: [
      { id: "gallery", label: "Galerie", description: "Generierte Assets ansehen" },
    ],
  },
];

const TOOL_DISPLAY_LABELS: Partial<Record<ToolId, string>> = Object.fromEntries(
  TOOL_OVERVIEW_CATEGORIES.flatMap((c) => c.tools.map((t) => [t.id, t.label]))
) as Partial<Record<ToolId, string>>;

export function resolveToolRoute(toolId: ToolId): string | null {
  return TOOL_DEDICATED_ROUTES[toolId] ?? null;
}

/** Phase 2B.4: dedicated pages stay locked until visual redesign */
export function isToolPushSafeToOpen(_toolId: ToolId): boolean {
  return false;
}

export function normalizeToolQueryParam(raw: string): ToolId | null {
  const id = (TOOL_QUERY_ALIASES[raw] ?? raw) as ToolId;
  return LAUNCH_TOOL_IDS.has(id) ? id : null;
}

export function resolveLaunchToolFromPath(pathname: string): ToolId | null {
  for (const [path, toolId] of PATH_TO_LAUNCH_TOOL) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return toolId;
    }
  }
  return null;
}

export function isLegacyLockedToolPath(pathname: string): boolean {
  return resolveLaunchToolFromPath(pathname) !== null;
}

export function isDedicatedToolPath(pathname: string): boolean {
  return isLegacyLockedToolPath(pathname);
}

export function getToolDisplayLabel(toolId: ToolId): string {
  return (
    TOOL_DISPLAY_LABELS[toolId] ??
    toolId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}
