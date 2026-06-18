import type { CharacterType } from "@/lib/ai-creator/types";

export const CHARACTER_NAME_MAX = 120;
export const CHARACTER_DESCRIPTION_MAX = 4000;
export const CHARACTER_TRIGGER_WORD_MAX = 64;

/** Request body for POST /api/ai-creator/characters (baseline-schema compatible). */
export type CreateCharacterBody = {
  name?: string;
  /** Alias for characterType */
  type?: CharacterType;
  characterType?: CharacterType;
  description?: string;
  triggerWord?: string;
  /** Legacy persona fields — merged into description text, not separate DB columns */
  niche?: string;
  style?: string;
  tone?: string;
  platforms?: string[];
  targetAudience?: string;
  /** Checked for self-type drafts; not persisted in baseline schema */
  consentConfirmed?: boolean;
  consentAccepted?: boolean;
  safetyAcknowledged?: boolean;
  /** Accepted but ignored for DB insert in this phase (no upload persistence) */
  referenceImageUrls?: string[];
  previewImageUrl?: string;
  trainingStatus?: string;
  castingImageUrl?: string;
};

export type ParsedCreateCharacter = {
  name: string;
  description: string | null;
  source: "uploaded" | "generated";
  characterType: CharacterType;
  triggerWord: string | null;
  castingImageUrl: string | null;
};

export type CreateValidationResult =
  | { ok: true; data: ParsedCreateCharacter }
  | { ok: false; error: string; status: number };

export type BaselineCharacterInsert = {
  user_id: string;
  name: string;
  description: string | null;
  source: "uploaded" | "generated";
  status: "draft";
  trigger_word: string | null;
  lora_ref: null;
  casting_image_url: string | null;
};

function normalizeCharacterType(body: CreateCharacterBody): CharacterType | null {
  const raw = body.type ?? body.characterType ?? null;
  if (raw === "self" || raw === "fictional") return raw;
  return null;
}

function appendPersonaToDescription(body: CreateCharacterBody): string | null {
  const parts: string[] = [];
  const base = body.description?.trim();
  if (base) parts.push(base);

  const extras: string[] = [];
  if (body.niche?.trim()) extras.push(`Nische: ${body.niche.trim()}`);
  if (body.style?.trim()) extras.push(`Stil: ${body.style.trim()}`);
  if (body.tone?.trim()) extras.push(`Tonalität: ${body.tone.trim()}`);
  if (body.targetAudience?.trim()) {
    extras.push(`Zielgruppe: ${body.targetAudience.trim()}`);
  }
  if (body.platforms?.length) {
    extras.push(`Plattformen: ${body.platforms.map((p) => p.trim()).filter(Boolean).join(", ")}`);
  }

  if (extras.length) parts.push(extras.join("\n"));

  const combined = parts.join("\n\n").trim();
  if (!combined) return null;
  if (combined.length > CHARACTER_DESCRIPTION_MAX) {
    return combined.slice(0, CHARACTER_DESCRIPTION_MAX);
  }
  return combined;
}

function isSafetyAcknowledged(body: CreateCharacterBody): boolean {
  return (
    body.safetyAcknowledged === true ||
    body.consentAccepted === true ||
    body.consentConfirmed === true
  );
}

function parseCastingImageUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

/** Validates POST payload and maps to baseline insert fields (no extended columns). */
export function validateCreateCharacterBody(
  body: CreateCharacterBody
): CreateValidationResult {
  if (body.type && body.type !== "self" && body.type !== "fictional") {
    return { ok: false, error: "type muss self oder fictional sein.", status: 400 };
  }
  if (
    body.characterType &&
    body.characterType !== "self" &&
    body.characterType !== "fictional"
  ) {
    return {
      ok: false,
      error: "characterType muss self oder fictional sein.",
      status: 400,
    };
  }

  const name = body.name?.trim() ?? "";
  if (!name) {
    return { ok: false, error: "Name ist erforderlich.", status: 400 };
  }
  if (name.length > CHARACTER_NAME_MAX) {
    return {
      ok: false,
      error: `Name darf maximal ${CHARACTER_NAME_MAX} Zeichen haben.`,
      status: 400,
    };
  }

  const triggerRaw = body.triggerWord?.trim() ?? "";
  if (triggerRaw.length > CHARACTER_TRIGGER_WORD_MAX) {
    return {
      ok: false,
      error: `Trigger Word darf maximal ${CHARACTER_TRIGGER_WORD_MAX} Zeichen haben.`,
      status: 400,
    };
  }

  const characterType = normalizeCharacterType(body) ?? "fictional";
  const source = characterType === "self" ? "uploaded" : "generated";

  if (characterType === "self" && !isSafetyAcknowledged(body)) {
    return {
      ok: false,
      error:
        "Für eigene Characters ist safetyAcknowledged oder consentAccepted erforderlich.",
      status: 400,
    };
  }

  const castingImageUrl =
    parseCastingImageUrl(body.castingImageUrl) ??
    parseCastingImageUrl(body.previewImageUrl);

  return {
    ok: true,
    data: {
      name,
      description: appendPersonaToDescription(body),
      source,
      characterType,
      triggerWord: triggerRaw || null,
      castingImageUrl,
    },
  };
}

export function buildBaselineCharacterInsert(
  userId: string,
  parsed: ParsedCreateCharacter
): BaselineCharacterInsert {
  return {
    user_id: userId,
    name: parsed.name,
    description: parsed.description,
    source: parsed.source,
    status: "draft",
    trigger_word: parsed.triggerWord,
    lora_ref: null,
    casting_image_url: parsed.castingImageUrl,
  };
}
