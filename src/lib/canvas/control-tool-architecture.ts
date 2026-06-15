import type { ToolApiDefinition, ToolId, ToolParamSchema } from "./toolApiSchema";
import { isParamValueFilled } from "./tool-param-validation";

export type ToolArchitecture = "claude-agent" | "media-generator";

/** Claude API — Text-/Strategie-Agenten */
export const CLAUDE_AGENT_TOOL_IDS = new Set<ToolId>([
  "viral-hook",
  "content-kalender",
  "trend-script",
  "script-generator",
  "produkt-werbung",
  "agent-autopilot",
  "thumbnail-concept",
  "niche-analyzer",
  "outlier-detector",
  "viral-score",
  "campaign-autopilot",
]);

/** Fal AI / Akool — Medien-Generatoren */
export const MEDIA_GENERATOR_TOOL_IDS = new Set<ToolId>([
  "flux-image",
  "ki-ich",
  "lora-training",
  "seedance-video",
  "video-transformer",
  "video-uebersetzer",
  "avatar-studio",
  "lipsync-studio",
  "ugc-video",
  "melodia-studio",
]);

const VIDEO_MODEL_PROVIDER_LABELS = new Set(["Seedance", "Minimax", "Kling"]);

const CLAUDE_CONTEXT_PARAM_KEYS = new Set([
  "nische",
  "niche",
  "plattform",
  "platform",
  "tonfall",
  "tone",
  "tonalitaet",
  "frequenz",
  "umfang",
  "platforms",
]);

export const CLAUDE_AGENT_PLATFORM_OPTIONS = [
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube Shorts", label: "YouTube Shorts" },
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
] as const;

export const CLAUDE_AGENT_TONALITY_OPTIONS = [
  { value: "hook", label: "Hook-fokussiert" },
  { value: "educational", label: "Edukativ" },
  { value: "emotional", label: "Emotional" },
] as const;

export const CLAUDE_AGENT_SCOPE_OPTIONS = [
  { value: "taeglich", label: "Täglich" },
  { value: "woechentlich", label: "Wöchentlich" },
  { value: "sprint", label: "2–3 Tage Sprint" },
  { value: "monthly", label: "30 Tage Monat" },
] as const;

export type ClaudeAgentFormData = {
  nische: string;
  plattform: string;
  tonalitaet: string;
  umfang: string;
};

export const CLAUDE_AGENT_COMMON_PARAMS: ToolParamSchema[] = [
  {
    key: "nische",
    label: "Nische / Branche",
    type: "string",
    required: true,
    placeholder: "z.B. Fitness, SaaS, Food",
  },
  {
    key: "plattform",
    label: "Zielplattform",
    type: "select",
    required: true,
    defaultValue: "TikTok",
    options: [...CLAUDE_AGENT_PLATFORM_OPTIONS],
  },
  {
    key: "tonalitaet",
    label: "Tonalität",
    type: "select",
    required: true,
    defaultValue: "hook",
    options: [...CLAUDE_AGENT_TONALITY_OPTIONS],
  },
  {
    key: "umfang",
    label: "Umfang / Frequenz",
    type: "select",
    required: true,
    defaultValue: "woechentlich",
    options: [...CLAUDE_AGENT_SCOPE_OPTIONS],
  },
];

export function getToolArchitecture(toolId: string): ToolArchitecture | null {
  if (CLAUDE_AGENT_TOOL_IDS.has(toolId as ToolId)) return "claude-agent";
  if (MEDIA_GENERATOR_TOOL_IDS.has(toolId as ToolId)) return "media-generator";
  return null;
}

export function isClaudeAgentTool(toolId: string): boolean {
  return CLAUDE_AGENT_TOOL_IDS.has(toolId as ToolId);
}

export function isMediaGeneratorTool(toolId: string): boolean {
  return MEDIA_GENERATOR_TOOL_IDS.has(toolId as ToolId);
}

type SeedanceModelLike = {
  value: string;
  label: string;
  provider?: string;
  providerLabel?: string;
};

export function filterVideoProviderModels<T extends SeedanceModelLike>(models: T[]): T[] {
  const filtered = models.filter((model) => {
    const providerLabel = model.providerLabel?.trim() ?? "";
    const provider = model.provider?.trim() ?? "";
    if (VIDEO_MODEL_PROVIDER_LABELS.has(providerLabel) || VIDEO_MODEL_PROVIDER_LABELS.has(provider)) {
      return true;
    }
    const hay = `${model.label} ${model.value}`.toLowerCase();
    return (
      hay.includes("kling") || hay.includes("seedance") || hay.includes("minimax")
    );
  });
  return filtered.length > 0 ? filtered : models;
}

const MEDIA_PROMPT_KEYS = new Set([
  "prompt",
  "produkt_beschreibung",
  "topic",
  "trend_thema",
  "message",
]);

export function getClaudeSupplementalParamSchemas(
  tool: ToolApiDefinition
): ToolParamSchema[] {
  return tool.params.filter((field) => {
    if (CLAUDE_CONTEXT_PARAM_KEYS.has(field.key)) return false;
    if (field.key === "modelId") return false;
    if (field.type === "file" || field.type === "file-list") return false;
    return true;
  });
}

export function getClaudeAgentUiParamSchemas(tool: ToolApiDefinition): ToolParamSchema[] {
  return [...CLAUDE_AGENT_COMMON_PARAMS, ...getClaudeSupplementalParamSchemas(tool)];
}

export function getMediaToolParamSchemas(tool: ToolApiDefinition): ToolParamSchema[] {
  const showVideoModel = tool.id === "seedance-video";

  return tool.params.filter((field) => {
    if (field.key === "modelId") return showVideoModel;
    if (MEDIA_PROMPT_KEYS.has(field.key) || field.type === "textarea") return true;
    if (field.type === "file" || field.type === "file-list") return true;
    if (field.key === "characterId") return true;
    if (field.type === "node-ref" && field.required) return true;
    return false;
  });
}

export function getMediaAdvancedParamSchemas(tool: ToolApiDefinition): ToolParamSchema[] {
  const primaryKeys = new Set(getMediaToolParamSchemas(tool).map((f) => f.key));
  return tool.params.filter((field) => !primaryKeys.has(field.key));
}

function readString(params: Record<string, unknown>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
}

function mapLegacyTonality(params: Record<string, unknown>): string {
  const direct = readString(params, "tonalitaet");
  if (direct) return direct;

  const tonfall = readString(params, "tonfall").toLowerCase();
  if (tonfall === "aggressiv" || tonfall === "neugierig") return "hook";
  if (tonfall === "story") return "emotional";

  const tone = readString(params, "tone").toLowerCase();
  if (tone === "professional" || tone === "trustworthy") return "educational";
  if (tone === "bold" || tone === "direct") return "hook";
  if (tone === "modern") return "hook";

  return "hook";
}

function mapLegacyPlatform(params: Record<string, unknown>, toolId: ToolId): string {
  const direct = readString(params, "plattform");
  if (direct) {
    if (direct === "Reels" || direct === "instagram_reels") return "Instagram";
    if (direct === "Shorts" || direct === "youtube_shorts") return "YouTube Shorts";
    if (direct === "tiktok") return "TikTok";
    if (direct === "linkedin") return "LinkedIn";
    return direct;
  }

  const platform = readString(params, "platform");
  if (platform) {
    if (platform === "YouTube Shorts" || platform === "youtube_shorts") return "YouTube Shorts";
    if (platform === "instagram" || platform === "Instagram Reels") return "Instagram";
    if (platform === "linkedin") return "LinkedIn";
    return platform;
  }

  if (Array.isArray(params.platforms) && params.platforms.length > 0) {
    const first = String(params.platforms[0]);
    if (first === "tiktok") return "TikTok";
    if (first === "instagram") return "Instagram";
    if (first === "youtube_shorts") return "YouTube Shorts";
    if (first === "linkedin") return "LinkedIn";
    return first;
  }

  return toolId === "campaign-autopilot" ? "Instagram" : "TikTok";
}

function mapLegacyNische(params: Record<string, unknown>): string {
  return (
    readString(params, "nische") ||
    readString(params, "niche") ||
    readString(params, "topic") ||
    readString(params, "trend_thema") ||
    readString(params, "campaign_goal") ||
    readString(params, "campaign_brief") ||
    readString(params, "produkt_name") ||
    ""
  );
}

function mapLegacyUmfang(params: Record<string, unknown>): string {
  const direct = readString(params, "umfang");
  if (direct) return direct;

  const frequenz = readString(params, "frequenz");
  if (frequenz) return frequenz;

  const mode = readString(params, "mode");
  if (mode === "weekly") return "woechentlich";
  if (mode === "sprint") return "sprint";
  if (mode === "monthly") return "monthly";
  if (mode === "product_launch") return "sprint";

  return "woechentlich";
}

/** Strikt nur Text-Kontext für Claude-Agenten (Payload an Backend). */
export function buildClaudeAgentFormData(
  toolId: ToolId,
  params: Record<string, unknown>
): ClaudeAgentFormData {
  return {
    nische: mapLegacyNische(params),
    plattform: mapLegacyPlatform(params, toolId),
    tonalitaet: mapLegacyTonality(params),
    umfang: mapLegacyUmfang(params),
  };
}

function mapTonalitaetToTonfall(tonalitaet: string): string {
  switch (tonalitaet) {
    case "educational":
      return "story";
    case "emotional":
      return "story";
    case "hook":
    default:
      return "neugierig";
  }
}

function mapTonalitaetToCampaignTone(tonalitaet: string): string {
  switch (tonalitaet) {
    case "educational":
      return "trustworthy";
    case "emotional":
      return "bold";
    case "hook":
    default:
      return "modern";
  }
}

function mapUmfangToFrequenz(umfang: string): string {
  if (umfang === "taeglich" || umfang === "woechentlich" || umfang === "sprint" || umfang === "monthly") {
    return umfang;
  }
  return "woechentlich";
}

function mapUmfangToCampaignMode(umfang: string): string {
  switch (umfang) {
    case "sprint":
      return "sprint";
    case "monthly":
      return "monthly";
    case "taeglich":
    case "woechentlich":
    default:
      return "weekly";
  }
}

function mapPlattformToApiValue(plattform: string): string {
  switch (plattform) {
    case "TikTok":
      return "TikTok";
    case "YouTube Shorts":
      return "Shorts";
    case "Instagram":
      return "Reels";
    case "LinkedIn":
      return "LinkedIn";
    default:
      return plattform;
  }
}

function mapPlattformToCampaignPlatform(plattform: string): string {
  switch (plattform) {
    case "TikTok":
      return "tiktok";
    case "Instagram":
      return "instagram";
    case "YouTube Shorts":
      return "youtube_shorts";
    case "LinkedIn":
      return "linkedin";
    default:
      return "instagram";
  }
}

/** Mappt Claude-FormData zurück auf tool-spezifische API-Parameter. */
export function mergeClaudeFormIntoToolParams(
  toolId: ToolId,
  params: Record<string, unknown>,
  formData: ClaudeAgentFormData
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...params };

  switch (toolId) {
    case "viral-hook":
      merged.nische = formData.nische;
      merged.plattform = mapPlattformToApiValue(formData.plattform);
      merged.tonfall = mapTonalitaetToTonfall(formData.tonalitaet);
      break;
    case "content-kalender":
      merged.nische = formData.nische;
      merged.plattform = formData.plattform;
      merged.frequenz = mapUmfangToFrequenz(formData.umfang);
      break;
    case "trend-script":
      merged.plattform = formData.plattform;
      break;
    case "script-generator":
      merged.tonfall = mapTonalitaetToTonfall(formData.tonalitaet);
      break;
    case "produkt-werbung":
      merged.plattform =
        formData.plattform === "TikTok"
          ? "tiktok"
          : formData.plattform === "Instagram"
            ? "instagram"
            : formData.plattform === "YouTube Shorts"
              ? "youtube"
              : "linkedin";
      break;
    case "campaign-autopilot":
      merged.mode = mapUmfangToCampaignMode(formData.umfang);
      merged.tone = mapTonalitaetToCampaignTone(formData.tonalitaet);
      merged.platforms = [mapPlattformToCampaignPlatform(formData.plattform)];
      break;
    case "agent-autopilot":
      merged.platforms = [formData.plattform];
      break;
    case "outlier-detector":
      merged.niche = formData.nische;
      merged.platform =
        formData.plattform === "YouTube Shorts"
          ? "YouTube Shorts"
          : formData.plattform;
      break;
    case "niche-analyzer":
    case "thumbnail-concept":
      if (!readString(merged, "topic")) {
        merged.topic = formData.nische;
      }
      break;
    case "viral-score":
      if (!readString(merged, "niche")) {
        merged.niche = formData.nische;
      }
      break;
    default:
      break;
  }

  return merged;
}

export function buildGenerationFormData(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): Record<string, unknown> {
  if (isClaudeAgentTool(tool.id)) {
    return buildClaudeAgentFormData(tool.id as ToolId, params);
  }

  if (isMediaGeneratorTool(tool.id)) {
    const mediaKeys = new Set(getMediaToolParamSchemas(tool).map((f) => f.key));
    const formData: Record<string, unknown> = {};
    for (const key of mediaKeys) {
      if (params[key] !== undefined) {
        formData[key] = params[key];
      }
    }
    return formData;
  }

  return { ...params };
}

export function resolveClaudeGenerationParams(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): Record<string, unknown> {
  const formData = buildClaudeAgentFormData(tool.id as ToolId, params);
  return mergeClaudeFormIntoToolParams(tool.id as ToolId, params, formData);
}

export function areClaudeAgentParamsReady(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): boolean {
  const formData = buildClaudeAgentFormData(tool.id as ToolId, params);
  if (!formData.nische || !formData.plattform || !formData.tonalitaet || !formData.umfang) {
    return false;
  }

  return getClaudeSupplementalParamSchemas(tool).every((field) => {
    if (!field.required) return true;
    if (field.key === "topic" && formData.nische) return true;
    return isParamValueFilled(field, params[field.key]);
  });
}

export function areMediaToolParamsReady(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): boolean {
  return getMediaToolParamSchemas(tool).every(
    (field) => !field.required || isParamValueFilled(field, params[field.key])
  );
}

export function isMediaPrimaryParam(field: ToolParamSchema, toolId: string): boolean {
  if (field.key === "modelId" && toolId === "seedance-video") return true;
  if (MEDIA_PROMPT_KEYS.has(field.key) || field.type === "textarea") return true;
  if (field.type === "file" || field.type === "file-list") return true;
  if (field.key === "characterId") return true;
  if (field.type === "node-ref" && field.required) return true;
  return field.required === true;
}

export function isClaudePrimaryParam(field: ToolParamSchema): boolean {
  if (CLAUDE_AGENT_COMMON_PARAMS.some((f) => f.key === field.key)) return true;
  if (field.required) return true;
  if (field.type === "textarea") return true;
  return false;
}
