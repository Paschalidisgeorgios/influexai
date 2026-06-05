/**
 * Strip third-party provider names from user-visible copy.
 * ElevenLabs is allowed in voice/audio UI only — pass { allowElevenLabs: true }.
 */

const REPLACEMENTS: Array<{ pattern: RegExp; replace: string }> = [
  { pattern: /fal\.?ai/gi, replace: "KI-Technologie" },
  { pattern: /soulx[\s-]*flashhead?/gi, replace: "KI-Technologie" },
  { pattern: /flashhead/gi, replace: "KI-Technologie" },
  { pattern: /flux[\s-]?pulid/gi, replace: "KI-Technologie" },
  { pattern: /\bflux\b/gi, replace: "KI-Technologie" },
  { pattern: /akool/gi, replace: "KI-Technologie" },
  { pattern: /heygen/gi, replace: "KI-Technologie" },
  { pattern: /anthropic/gi, replace: "KI-Technologie" },
  { pattern: /\bclaude\b/gi, replace: "KI-Technologie" },
  { pattern: /openai/gi, replace: "KI-Technologie" },
  { pattern: /replicate/gi, replace: "KI-Technologie" },
  { pattern: /\brunway\b/gi, replace: "KI-Technologie" },
  { pattern: /\bkling\b/gi, replace: "KI-Technologie" },
  { pattern: /\bgoogle\b/gi, replace: "KI-Technologie" },
  { pattern: /byte\s*dance/gi, replace: "KI-Technologie" },
  { pattern: /kuaishou/gi, replace: "KI-Technologie" },
  { pattern: /alibaba/gi, replace: "KI-Technologie" },
  { pattern: /\bxai\b/gi, replace: "KI-Technologie" },
  { pattern: /\bgrok\b/gi, replace: "KI-Technologie" },
  { pattern: /black\s*forest\s*labs?/gi, replace: "KI-Technologie" },
  { pattern: /stable\s*diffusion/gi, replace: "KI-Technologie" },
  { pattern: /hugging\s*face/gi, replace: "KI-Technologie" },
  { pattern: /live\s*portrait/gi, replace: "KI-Technologie" },
  { pattern: /\bresend\b/gi, replace: "E-Mail-Dienst" },
  { pattern: /\bsupabase\b/gi, replace: "KI-Technologie" },
  { pattern: /\bvercel\b/gi, replace: "Hosting" },
  { pattern: /youtube\s*(data\s*)?api/gi, replace: "Video-Metadaten" },
  { pattern: /nano\s*banana/gi, replace: "InfluexAI Vision" },
  { pattern: /\bagora\b/gi, replace: "Live-Stream" },
  { pattern: /AKOOL_[A-Z_]+/g, replace: "" },
  { pattern: /ANTHROPIC_API_KEY/g, replace: "" },
  { pattern: /ELEVENLABS_API_KEY/g, replace: "" },
  { pattern: /FAL_API_KEY|FAL_KEY/g, replace: "" },
  { pattern: /YOUTUBE_API_KEY/g, replace: "" },
  { pattern: /sk-ant-[a-z0-9]+/gi, replace: "" },
];

export function sanitizeUserMessage(
  message: string,
  options?: { allowElevenLabs?: boolean }
): string {
  if (!message?.trim()) return message;

  let out = message.trim();
  const rules = options?.allowElevenLabs
    ? REPLACEMENTS.filter((r) => !/elevenlabs/i.test(r.pattern.source))
    : [...REPLACEMENTS, { pattern: /elevenlabs/gi, replace: "Sprach-KI" }];

  for (const { pattern, replace } of rules) {
    out = out.replace(pattern, replace);
  }

  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();

  if (/^(KI|Video-Dienst|Plattform)\s*(fehlgeschlagen|ist nicht)/i.test(out)) {
    return out;
  }

  if (/fehlgeschlagen|nicht konfiguriert|nicht verfügbar/i.test(out)) {
    return out;
  }

  return out;
}

export const MSG_GENERATION_FAILED =
  "Generierung fehlgeschlagen. Bitte erneut versuchen.";
export const MSG_AI_UNAVAILABLE =
  "KI ist gerade nicht verfügbar. Bitte später erneut versuchen.";
export const MSG_VIDEO_SERVICE_UNAVAILABLE =
  "Video-Generierung ist gerade nicht verfügbar. Bitte später erneut versuchen.";
