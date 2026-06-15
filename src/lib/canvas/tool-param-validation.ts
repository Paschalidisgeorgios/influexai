import type { ToolApiDefinition, ToolParamSchema } from "./toolApiSchema";

export function isParamValueFilled(
  field: ToolParamSchema,
  value: unknown
): boolean {
  switch (field.type) {
    case "boolean":
      return true;
    case "multiselect":
      return Array.isArray(value) && value.length > 0;
    case "file-list":
      return (
        Array.isArray(value) &&
        value.some((item) => typeof item === "string" && item.trim().length > 0)
      );
    case "file":
      return typeof value === "string" && value.trim().length > 0;
    case "slider":
    case "number":
      return typeof value === "number" && !Number.isNaN(value);
    default:
      if (typeof value === "string") return value.trim().length > 0;
      return value != null && value !== "";
  }
}

export function areToolParamsReady(
  tool: ToolApiDefinition | undefined,
  params: Record<string, unknown>
): boolean {
  if (!tool?.params.length) return true;
  return tool.params.every(
    (field) => !field.required || isParamValueFilled(field, params[field.key])
  );
}

export function validateToolRequiredParams(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): string | null {
  for (const field of tool.params) {
    if (!field.required) continue;
    if (!isParamValueFilled(field, params[field.key])) {
      return `Bitte „${field.label}“ ausfüllen.`;
    }
  }
  return null;
}

const UGC_PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram_reels: "Instagram Reels",
  youtube_shorts: "YouTube Shorts",
};

const UGC_STYLE_LABELS: Record<string, string> = {
  unboxing: "Unboxing / Review",
  asmr: "ASMR",
  testimonial: "Testimonial",
  storytelling: "Storytelling",
};

export function buildUgcVideoScript(
  productDescription: string,
  platformKey: string,
  styleKey: string
): string {
  const platform = UGC_PLATFORM_LABELS[platformKey] ?? platformKey;
  const style = UGC_STYLE_LABELS[styleKey] ?? styleKey;

  return [
    `**${style}** für **${platform}**`,
    productDescription,
    "Authentisch, nahbar, mit klarem Hook in den ersten 2 Sekunden und starker CTA am Ende.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 500);
}

export function resolveUgcProductImageUrl(
  value: unknown
): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const first = value.find(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  return first?.trim();
}

const THUMBNAIL_STYLE_LABELS: Record<string, string> = {
  face_emotion: "Gesicht + Emotion (Creator zeigt starke Emotion)",
  text_dominant: "Text-dominant (großer Text, wenig Bild)",
  before_after: "Vorher/Nachher (Split-Screen)",
  curiosity_gap: "Neugier-Gap (etwas verdeckt/mystery)",
  list_number: "Liste / Number (5 Tipps, 3 Fehler etc.)",
  shock_value: "Schock-Wert (controversial, surprising visual)",
};

const THUMBNAIL_COLOR_LABELS: Record<string, string> = {
  warm: "Warm & Energetisch (rot, orange, gelb)",
  cool_premium: "Cool & Premium (blau, weiß, schwarz)",
  acid_viral: "Acid & Viral (#B4FF00 style, neon)",
  minimal: "Minimalistisch (weiß/schwarz, viel Weißraum)",
};

export function resolveThumbnailStyle(key?: string): string {
  if (!key) return THUMBNAIL_STYLE_LABELS.face_emotion;
  return THUMBNAIL_STYLE_LABELS[key] ?? key;
}

export function resolveThumbnailColorEnergy(key?: string): string {
  if (!key) return THUMBNAIL_COLOR_LABELS.acid_viral;
  return THUMBNAIL_COLOR_LABELS[key] ?? key;
}

const NICHE_FORMAT_LABELS: Record<string, string> = {
  youtube_shorts: "YouTube Shorts",
  long_form: "Long-form",
  beide: "Beide",
};

const NICHE_AUDIENCE_LABELS: Record<string, string> = {
  "18-24": "18-24",
  "25-34": "25-34",
  "35-44": "35-44",
  alle: "Alle",
};

export function resolveNicheAudience(key?: string): string {
  if (!key) return NICHE_AUDIENCE_LABELS["25-34"];
  return NICHE_AUDIENCE_LABELS[key] ?? key;
}

export function resolveNicheFormat(key?: string): string {
  if (!key) return NICHE_FORMAT_LABELS.youtube_shorts;
  return NICHE_FORMAT_LABELS[key] ?? key;
}
