/**
 * Studio model catalog — metadata only (Phase 4G.4V).
 * Product-facing labels; no provider SDKs or secrets.
 */

export type ModelCategory =
  | "image"
  | "video"
  | "text-to-video"
  | "image-to-video"
  | "lipsync"
  | "avatar"
  | "character";

export type ModelCatalogStatus = "available" | "shell_only" | "coming_soon" | "disabled";

export type ModelCatalogEntry = {
  modelId: string;
  label: string;
  category: ModelCategory;
  description: string;
  status: ModelCatalogStatus;
  estimatedCredits: string;
  /** Product-facing tier name — not raw provider branding */
  providerLabel: string;
  /** Optional internal routing key — never a secret */
  providerKey?: string;
  executionEnabled: boolean;
  supports: string[];
  notes?: string;
};

export const STUDIO_MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    modelId: "flux-standard",
    label: "Influex Fast",
    category: "image",
    description: "Schnelle Kampagnenmotive für Social und Ads.",
    status: "shell_only",
    estimatedCredits: "5 Credits",
    providerLabel: "Influex Fast",
    providerKey: "fast-image",
    executionEnabled: false,
    supports: ["1:1", "9:16", "16:9"],
    notes: "Ideal für schnelle Iterationen",
  },
  {
    modelId: "flux-high",
    label: "Influex Premium",
    category: "image",
    description: "Hochauflösende Motive für Premium-Kampagnen.",
    status: "shell_only",
    estimatedCredits: "8 Credits",
    providerLabel: "Influex Premium",
    providerKey: "premium-image",
    executionEnabled: false,
    supports: ["1:1", "9:16", "16:9", "4K"],
  },
  {
    modelId: "kling-v2-turbo",
    label: "Influex Motion",
    category: "image-to-video",
    description: "Startbild in flüssigen Motion-Clip verwandeln.",
    status: "shell_only",
    estimatedCredits: "Dynamisch",
    providerLabel: "Influex Motion",
    providerKey: "fast-video",
    executionEnabled: false,
    supports: ["5s", "10s", "720p"],
  },
  {
    modelId: "kling-v2-master",
    label: "Influex Cinematic",
    category: "image-to-video",
    description: "Cinematic Motion mit höherer Detailtiefe.",
    status: "shell_only",
    estimatedCredits: "Dynamisch",
    providerLabel: "Influex Cinematic",
    providerKey: "cinematic-video",
    executionEnabled: false,
    supports: ["5s", "10s", "1080p"],
  },
  {
    modelId: "akool-text-video-standard",
    label: "Influex Clip",
    category: "text-to-video",
    description: "Clip aus Szenenbeschreibung generieren.",
    status: "shell_only",
    estimatedCredits: "Ab 50 Credits",
    providerLabel: "Influex Clip",
    providerKey: "motion-video",
    executionEnabled: false,
    supports: ["5s", "720p"],
  },
  {
    modelId: "akool-lipsync-standard",
    label: "Influex Lip Sync",
    category: "lipsync",
    description: "Video mit synchronen Lippen und Stimme.",
    status: "shell_only",
    estimatedCredits: "40 Credits",
    providerLabel: "Influex Lip Sync",
    providerKey: "lip-sync-basic",
    executionEnabled: false,
    supports: ["video + audio"],
  },
  {
    modelId: "character-draft-shell",
    label: "Character Draft",
    category: "character",
    description: "Character-Entwurf mit Consent und Handoff-Vorbereitung.",
    status: "shell_only",
    estimatedCredits: "0 Credits",
    providerLabel: "Influex Character",
    providerKey: "character-draft",
    executionEnabled: false,
    supports: ["draft", "consent", "handoff"],
    notes: "Upload/Training folgt in späteren Phasen",
  },
];

const CATALOG_BY_ID = new Map(
  STUDIO_MODEL_CATALOG.map((entry) => [entry.modelId, entry])
);

export function getModelById(modelId: string): ModelCatalogEntry | undefined {
  return CATALOG_BY_ID.get(modelId);
}

export function getModelsByCategory(category: ModelCategory): ModelCatalogEntry[] {
  return STUDIO_MODEL_CATALOG.filter((m) => m.category === category);
}

export function getModelsForToolIds(modelIds: string[]): ModelCatalogEntry[] {
  return modelIds
    .map((id) => CATALOG_BY_ID.get(id))
    .filter((m): m is ModelCatalogEntry => m !== undefined);
}
