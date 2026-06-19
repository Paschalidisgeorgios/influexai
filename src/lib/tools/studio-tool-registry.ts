/**
 * Studio tool & model registry — UX/routing foundation (Phase 4G.4V).
 * Client-safe: no provider SDKs, no server-only imports.
 */

import type { ToolId } from "@/components/dashboard/core/DashboardLayout";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";

export type StudioToolStatus = "available" | "shell" | "disabled" | "coming_soon";

export type StudioProviderExecution = "disabled" | "shell_only" | "enabled_later";

export type StudioToolOpenMode =
  | "spa_setup"
  | "spa_launch"
  | "dedicated"
  | "external_route";

export type StudioModelStatus = "available" | "shell" | "disabled";

export type StudioModelDefinition = {
  id: string;
  label: string;
  providerLabel: string;
  capability: string;
  creditEstimate: string;
  supports: string[];
  status: StudioModelStatus;
  notes?: string;
};

export type StudioToolDefinition = {
  id: ToolId | string;
  slug: string;
  label: string;
  description: string;
  category: string;
  route: string;
  openMode: StudioToolOpenMode;
  status: StudioToolStatus;
  creditLabel: string;
  defaultModelId: string | null;
  models: StudioModelDefinition[];
  requiresConsent: boolean;
  requiresUpload: boolean;
  providerExecution: StudioProviderExecution;
};

export const STUDIO_PROVIDER_DISABLED_HINT =
  "Model selection is prepared. Provider execution is disabled in this environment.";

export const STUDIO_STATUS_LABELS: Record<StudioToolStatus, string> = {
  available: "Verfügbar",
  shell: "Vorbereitung",
  disabled: "Deaktiviert",
  coming_soon: "Demnächst",
};

const IMAGE_MODELS: StudioModelDefinition[] = [
  {
    id: "flux-standard",
    label: "Standard",
    providerLabel: "fal.ai",
    capability: "image",
    creditEstimate: "5 Credits",
    supports: ["1:1", "9:16", "16:9"],
    status: "shell",
    notes: "Schnelle Kampagnenmotive",
  },
  {
    id: "flux-high",
    label: "High Resolution",
    providerLabel: "fal.ai",
    capability: "image",
    creditEstimate: "8 Credits",
    supports: ["1:1", "9:16", "16:9", "4K"],
    status: "shell",
  },
];

const VIDEO_MODELS: StudioModelDefinition[] = [
  {
    id: "kling-v2-turbo",
    label: "Kling v2 Turbo",
    providerLabel: "Seedance / fal",
    capability: "image-to-video",
    creditEstimate: "Dynamisch",
    supports: ["5s", "10s", "720p"],
    status: "shell",
  },
  {
    id: "kling-v2-master",
    label: "Kling v2 Master",
    providerLabel: "Seedance / fal",
    capability: "image-to-video",
    creditEstimate: "Dynamisch",
    supports: ["5s", "10s", "1080p"],
    status: "shell",
  },
];

const TEXT_VIDEO_MODELS: StudioModelDefinition[] = [
  {
    id: "akool-text-video-standard",
    label: "Standard Clip",
    providerLabel: "Akool",
    capability: "text-to-video",
    creditEstimate: "Ab 50 Credits",
    supports: ["5s", "720p"],
    status: "shell",
  },
];

const LIPSYNC_MODELS: StudioModelDefinition[] = [
  {
    id: "akool-lipsync-standard",
    label: "Lip Sync Standard",
    providerLabel: "Akool",
    capability: "lipsync",
    creditEstimate: "40 Credits",
    supports: ["video + audio"],
    status: "shell",
  },
];

const AI_CREATOR_MODELS: StudioModelDefinition[] = [
  {
    id: "character-draft-shell",
    label: "Character Draft",
    providerLabel: "InfluexAI",
    capability: "character",
    creditEstimate: "0 Credits",
    supports: ["draft", "consent", "handoff"],
    status: "shell",
    notes: "Upload/Training folgt in späteren Phasen",
  },
];

function creditLabelFor(id: string): string {
  return getCreditDisplayLabel(id);
}

export const STUDIO_TOOL_REGISTRY: StudioToolDefinition[] = [
  {
    id: "image-gen",
    slug: "image-gen",
    label: "Bildgenerator",
    description: "Produkt- und Kampagnenmotive für Social, Ads und Präsentationen.",
    category: "Visuals",
    route: "/dashboard/image-generator",
    openMode: "spa_setup",
    status: "available",
    creditLabel: creditLabelFor("image-gen"),
    defaultModelId: "flux-standard",
    models: IMAGE_MODELS,
    requiresConsent: false,
    requiresUpload: false,
    providerExecution: "disabled",
  },
  {
    id: "img-to-video",
    slug: "img-to-video",
    label: "Bild zu Video",
    description: "Startbild in Motion-Clip — für Reels, Ads und Produktshows.",
    category: "Video",
    route: "/dashboard/szenen-generator",
    openMode: "spa_setup",
    status: "available",
    creditLabel: creditLabelFor("img-to-video"),
    defaultModelId: "kling-v2-turbo",
    models: VIDEO_MODELS,
    requiresConsent: false,
    requiresUpload: true,
    providerExecution: "disabled",
  },
  {
    id: "text-to-video",
    slug: "text-to-video",
    label: "Text zu Video",
    description: "Clip aus Szenenbeschreibung.",
    category: "Video",
    route: "/dashboard/text-to-video",
    openMode: "spa_setup",
    status: "available",
    creditLabel: creditLabelFor("text-to-video"),
    defaultModelId: "akool-text-video-standard",
    models: TEXT_VIDEO_MODELS,
    requiresConsent: false,
    requiresUpload: false,
    providerExecution: "disabled",
  },
  {
    id: "talking-avatar",
    slug: "lipsync",
    label: "Lip Sync",
    description: "Video mit synchronen Lippen und Stimme.",
    category: "Stimme & Avatar",
    route: "/dashboard/lipsync-studio",
    openMode: "dedicated",
    status: "shell",
    creditLabel: creditLabelFor("talking-avatar"),
    defaultModelId: "akool-lipsync-standard",
    models: LIPSYNC_MODELS,
    requiresConsent: true,
    requiresUpload: true,
    providerExecution: "disabled",
  },
  {
    id: "face-swap-video",
    slug: "face-swap",
    label: "Face Swap",
    description: "Gesicht in Video oder Bild austauschen.",
    category: "Video",
    route: "/dashboard/face-studio",
    openMode: "dedicated",
    status: "shell",
    creditLabel: creditLabelFor("face-swap-video"),
    defaultModelId: null,
    models: [],
    requiresConsent: true,
    requiresUpload: true,
    providerExecution: "disabled",
  },
  {
    id: "live-creator",
    slug: "live-creator",
    label: "Live Creator",
    description: "Echtzeit-Character-Workflows und Live Portrait.",
    category: "Live",
    route: "/dashboard/live-creator",
    openMode: "external_route",
    status: "shell",
    creditLabel: creditLabelFor("live-creator"),
    defaultModelId: null,
    models: [],
    requiresConsent: true,
    requiresUpload: false,
    providerExecution: "disabled",
  },
  {
    id: "ai-creator",
    slug: "ai-creator",
    label: "AI Creator",
    description: "Character Drafts, Consent und Upload-Vorbereitung.",
    category: "Character",
    route: "/dashboard/ai-creator",
    openMode: "external_route",
    status: "available",
    creditLabel: "0 Credits · Shell",
    defaultModelId: "character-draft-shell",
    models: AI_CREATOR_MODELS,
    requiresConsent: true,
    requiresUpload: false,
    providerExecution: "disabled",
  },
  {
    id: "viral-hook",
    slug: "viral-hook",
    label: "Viral Hook",
    description: "Einstiege für Reels, Shorts und Ads.",
    category: "Kampagne",
    route: "/dashboard?tool=viral-hook",
    openMode: "spa_setup",
    status: "available",
    creditLabel: creditLabelFor("viral-hook"),
    defaultModelId: null,
    models: [],
    requiresConsent: false,
    requiresUpload: false,
    providerExecution: "shell_only",
  },
  {
    id: "content-calendar",
    slug: "content-calendar",
    label: "Content Kalender",
    description: "Themen, Formate und Rhythmus planen.",
    category: "Kampagne",
    route: "/dashboard?tool=content-calendar",
    openMode: "spa_setup",
    status: "available",
    creditLabel: creditLabelFor("content-calendar"),
    defaultModelId: null,
    models: [],
    requiresConsent: false,
    requiresUpload: false,
    providerExecution: "shell_only",
  },
  {
    id: "trend-script",
    slug: "trend-script",
    label: "Trend Script",
    description: "Trend-Thema in ein Script überführen.",
    category: "Kampagne",
    route: "/dashboard/trend-to-script",
    openMode: "dedicated",
    status: "shell",
    creditLabel: creditLabelFor("trend-script"),
    defaultModelId: null,
    models: [],
    requiresConsent: false,
    requiresUpload: false,
    providerExecution: "disabled",
  },
];

const REGISTRY_BY_ID = new Map<string, StudioToolDefinition>(
  STUDIO_TOOL_REGISTRY.map((tool) => [String(tool.id), tool])
);

export function getStudioToolById(id: string): StudioToolDefinition | undefined {
  return REGISTRY_BY_ID.get(id);
}

export function getStudioToolByDashboardId(toolId: ToolId): StudioToolDefinition | undefined {
  return REGISTRY_BY_ID.get(toolId);
}

export function getModelsForTool(id: string): StudioModelDefinition[] {
  return getStudioToolById(id)?.models ?? [];
}

export function getDefaultModelForTool(id: string): StudioModelDefinition | null {
  const tool = getStudioToolById(id);
  if (!tool?.defaultModelId) return null;
  return tool.models.find((m) => m.id === tool.defaultModelId) ?? tool.models[0] ?? null;
}

export function isToolAvailable(id: string): boolean {
  const tool = getStudioToolById(id);
  return tool?.status === "available";
}

export function isStudioProviderExecutionDisabled(toolId?: string): boolean {
  if (toolId) {
    const tool = getStudioToolById(toolId);
    if (tool) {
      return tool.providerExecution === "disabled" || tool.providerExecution === "shell_only";
    }
  }
  return true;
}

export function isStudioToolDedicatedOpenSafe(toolId: ToolId): boolean {
  const tool = getStudioToolByDashboardId(toolId);
  return tool?.openMode === "dedicated" && tool.status === "available";
}

export type StudioToolPrimaryAction = {
  label: string;
  href: string;
  disabled: boolean;
  disabledReason?: string;
};

export function getStudioToolPrimaryAction(toolId: ToolId): StudioToolPrimaryAction {
  const tool = getStudioToolByDashboardId(toolId);
  if (!tool) {
    return {
      label: "Tool öffnen",
      href: `/dashboard?tool=${encodeURIComponent(toolId)}`,
      disabled: false,
    };
  }

  if (tool.status === "disabled" || tool.status === "coming_soon") {
    return {
      label: STUDIO_STATUS_LABELS[tool.status],
      href: tool.route,
      disabled: true,
      disabledReason:
        tool.status === "coming_soon"
          ? "Dieses Tool ist noch nicht verfügbar."
          : "Dieses Tool ist derzeit deaktiviert.",
    };
  }

  if (tool.openMode === "external_route") {
    return { label: "Tool öffnen", href: tool.route, disabled: false };
  }

  if (tool.openMode === "dedicated" && tool.status === "available") {
    return { label: "Studio öffnen", href: tool.route, disabled: false };
  }

  if (tool.openMode === "spa_setup") {
    return {
      label: "Tool einrichten",
      href: `/dashboard?tool=${encodeURIComponent(String(tool.id))}`,
      disabled: false,
    };
  }

  return {
    label: tool.status === "shell" ? "Vorbereitung anzeigen" : "Tool einrichten",
    href: `/dashboard?tool=${encodeURIComponent(String(tool.id))}`,
    disabled: tool.status === "shell" && tool.models.length === 0,
    disabledReason:
      tool.status === "shell"
        ? "Dieses Tool ist vorbereitet, aber noch nicht aktiviert."
        : undefined,
  };
}

export function resolveStudioToolRoute(toolId: ToolId): string | null {
  const tool = getStudioToolByDashboardId(toolId);
  if (!tool) return null;
  if (tool.openMode === "external_route" || tool.openMode === "dedicated") {
    return tool.route;
  }
  return null;
}
