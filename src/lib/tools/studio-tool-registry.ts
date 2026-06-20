/**
 * Studio tool & model registry — UX/routing foundation (Phase 4G.4V).
 * Client-safe: no provider SDKs, no server-only imports.
 */

import type { ToolId } from "@/components/dashboard/core/DashboardLayout";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";
import { isProvidersDisabledForGenerateImageClient } from "@/lib/generate-image-ux";
import {
  getModelById,
  getModelsForToolIds,
  type ModelCatalogEntry,
} from "@/lib/tools/model-catalog";

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
  supportsModelSelection: boolean;
  supportsUpload: boolean;
  supportsPrompt: boolean;
  supportsReferenceImage: boolean;
  supportsAspectRatio: boolean;
  supportsDuration: boolean;
  supportsVoice: boolean;
  supportsCharacter: boolean;
};

export const STUDIO_PROVIDER_DISABLED_HINT =
  "Provider-Ausführung ist in dieser Umgebung deaktiviert.";

export const STUDIO_SHELL_ONLY_HINT =
  "Dieses Tool ist vorbereitet, aber noch nicht aktiviert.";

export const STUDIO_STATUS_LABELS: Record<StudioToolStatus, string> = {
  available: "Verfügbar",
  shell: "Vorbereitung",
  disabled: "Deaktiviert",
  coming_soon: "Demnächst",
};

const IMAGE_MODEL_IDS = ["flux-standard", "flux-high"];
const VIDEO_MODEL_IDS = ["kling-v2-turbo", "kling-v2-master"];
const TEXT_VIDEO_MODEL_IDS = ["akool-text-video-standard"];
const LIPSYNC_MODEL_IDS = ["akool-lipsync-standard"];
const AI_CREATOR_MODEL_IDS = ["character-draft-shell"];

function catalogToStudioModel(entry: ModelCatalogEntry): StudioModelDefinition {
  return {
    id: entry.modelId,
    label: entry.label,
    providerLabel: entry.providerLabel,
    capability: entry.category,
    creditEstimate: entry.estimatedCredits,
    supports: entry.supports,
    status: entry.status === "shell_only" ? "shell" : entry.status === "available" ? "available" : "disabled",
    notes: entry.notes,
  };
}

function modelsFromIds(ids: string[]): StudioModelDefinition[] {
  return getModelsForToolIds(ids).map(catalogToStudioModel);
}

const IMAGE_MODELS = modelsFromIds(IMAGE_MODEL_IDS);
const VIDEO_MODELS = modelsFromIds(VIDEO_MODEL_IDS);
const TEXT_VIDEO_MODELS = modelsFromIds(TEXT_VIDEO_MODEL_IDS);
const LIPSYNC_MODELS = modelsFromIds(LIPSYNC_MODEL_IDS);
const AI_CREATOR_MODELS = modelsFromIds(AI_CREATOR_MODEL_IDS);

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
    supportsModelSelection: true,
    supportsUpload: false,
    supportsPrompt: true,
    supportsReferenceImage: false,
    supportsAspectRatio: true,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: false,
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
    supportsModelSelection: true,
    supportsUpload: true,
    supportsPrompt: true,
    supportsReferenceImage: true,
    supportsAspectRatio: false,
    supportsDuration: true,
    supportsVoice: false,
    supportsCharacter: false,
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
    supportsModelSelection: true,
    supportsUpload: false,
    supportsPrompt: true,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: true,
    supportsVoice: false,
    supportsCharacter: false,
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
    supportsModelSelection: true,
    supportsUpload: true,
    supportsPrompt: false,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: true,
    supportsCharacter: false,
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
    supportsModelSelection: false,
    supportsUpload: true,
    supportsPrompt: false,
    supportsReferenceImage: true,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: false,
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
    supportsModelSelection: false,
    supportsUpload: false,
    supportsPrompt: false,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: true,
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
    supportsModelSelection: true,
    supportsUpload: false,
    supportsPrompt: false,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: true,
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
    supportsModelSelection: false,
    supportsUpload: false,
    supportsPrompt: true,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: false,
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
    supportsModelSelection: false,
    supportsUpload: false,
    supportsPrompt: true,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: false,
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
    supportsModelSelection: false,
    supportsUpload: false,
    supportsPrompt: true,
    supportsReferenceImage: false,
    supportsAspectRatio: false,
    supportsDuration: false,
    supportsVoice: false,
    supportsCharacter: false,
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
  const fromCatalog = getModelById(tool.defaultModelId);
  if (fromCatalog) return catalogToStudioModel(fromCatalog);
  return tool.models.find((m) => m.id === tool.defaultModelId) ?? tool.models[0] ?? null;
}

export function isToolAvailable(id: string): boolean {
  const tool = getStudioToolById(id);
  return tool?.status === "available";
}

export function isStudioProviderExecutionDisabled(toolId?: string): boolean {
  if (isProvidersDisabledForGenerateImageClient()) {
    return true;
  }

  // SPA Bildgenerator uses POST /api/generate-image — honor provider kill-switch only.
  if (toolId === "image-gen") {
    return false;
  }

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
