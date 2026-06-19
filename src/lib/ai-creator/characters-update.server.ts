import type { CharacterType } from "@/lib/ai-creator/types";
import {
  CHARACTER_DESCRIPTION_MAX,
  CHARACTER_NAME_MAX,
  CHARACTER_TRIGGER_WORD_MAX,
  type CreateCharacterBody,
} from "@/lib/ai-creator/characters-create.server";
import type { CharactersAiCreatorRow } from "@/lib/ai-creator/characters-list.server";
import {
  CHARACTER_EDIT_BLOCKED_MESSAGE,
  EDITABLE_CHARACTER_STATUSES,
} from "@/lib/ai-creator/characters-update-policy";

/** PATCH body — partial updates only; consent fields are never accepted. */
export type UpdateCharacterBody = {
  name?: string;
  description?: string;
  type?: CharacterType;
  characterType?: CharacterType;
  triggerWord?: string;
  niche?: string;
  style?: string;
  styleNotes?: string;
  tone?: string;
  platforms?: string[];
  targetAudience?: string;
  targetPlatform?: string;
  status?: string;
};

export type CharacterDbUpdate = {
  name?: string;
  description?: string | null;
  source?: "uploaded" | "generated";
  character_type?: CharacterType;
  trigger_word?: string | null;
  niche?: string | null;
  style?: string | null;
  tone?: string | null;
  platforms?: string[] | null;
  target_audience?: string | null;
  status?: "draft";
  updated_at: string;
};

export type UpdateValidationResult =
  | { ok: true; data: CharacterDbUpdate }
  | { ok: false; error: string; status: number };

const ALLOWED_PATCH_KEYS = new Set([
  "name",
  "description",
  "type",
  "characterType",
  "triggerWord",
  "niche",
  "style",
  "styleNotes",
  "tone",
  "platforms",
  "targetAudience",
  "targetPlatform",
  "status",
]);

const BLOCKED_PATCH_KEYS = new Set([
  "id",
  "userId",
  "user_id",
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
  "consentConfirmed",
  "consent_confirmed",
  "consentAccepted",
  "consentAcceptedAt",
  "consentConfirmedAt",
  "consent_confirmed_at",
  "consentSource",
  "consent_source",
  "consentVersion",
  "consent_version",
  "safetyAcknowledged",
  "trainingStatus",
  "training_status",
  "trainingProvider",
  "training_provider",
  "trainingModel",
  "training_model",
  "trainingJobId",
  "training_job_id",
  "providerJobId",
  "provider_job_id",
  "falRequestId",
  "fal_request_id",
  "akoolJobId",
  "akool_job_id",
  "referenceImageUrls",
  "reference_image_urls",
  "previewImageUrl",
  "preview_image_url",
  "castingImageUrl",
  "casting_image_url",
  "loraRef",
  "lora_ref",
  "loraId",
  "lora_id",
  "uploadSessionId",
  "upload_session_id",
  "uploadZipUrl",
  "upload_zip_url",
  "uploadImageCount",
  "upload_image_count",
  "source",
]);

const PLATFORM_ITEM_MAX = 64;
const PLATFORMS_MAX = 12;
const PERSONA_FIELD_MAX = 500;

function normalizeOptionalText(
  value: string | undefined,
  maxLength: number
): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normalizePlatforms(raw: string[] | undefined): string[] | null | undefined {
  if (raw === undefined) return undefined;
  const items = raw
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, PLATFORMS_MAX)
    .map((item) =>
      item.length > PLATFORM_ITEM_MAX ? item.slice(0, PLATFORM_ITEM_MAX) : item
    );
  return items.length ? items : null;
}

function normalizeTargetPlatform(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCharacterType(
  body: UpdateCharacterBody
): CharacterType | undefined {
  if (body.type === undefined && body.characterType === undefined) {
    return undefined;
  }
  const raw = body.type ?? body.characterType;
  if (raw === "self" || raw === "fictional") return raw;
  return undefined;
}

function appendPersonaToDescription(body: CreateCharacterBody): string | null | undefined {
  const hasPersonaField =
    body.description !== undefined ||
    body.niche !== undefined ||
    body.style !== undefined ||
    body.tone !== undefined ||
    body.targetAudience !== undefined ||
    body.platforms !== undefined;

  if (!hasPersonaField) return undefined;

  const parts: string[] = [];
  const base = body.description?.trim();
  if (base) parts.push(base);

  const styleValue = body.style?.trim();
  const extras: string[] = [];
  if (body.niche?.trim()) extras.push(`Nische: ${body.niche.trim()}`);
  if (styleValue) extras.push(`Stil: ${styleValue}`);
  if (body.tone?.trim()) extras.push(`Tonalität: ${body.tone.trim()}`);
  if (body.targetAudience?.trim()) {
    extras.push(`Zielgruppe: ${body.targetAudience.trim()}`);
  }
  if (body.platforms?.length) {
    extras.push(
      `Plattformen: ${body.platforms.map((p) => p.trim()).filter(Boolean).join(", ")}`
    );
  }

  if (extras.length) parts.push(extras.join("\n"));

  const combined = parts.join("\n\n").trim();
  if (!combined) return null;
  if (combined.length > CHARACTER_DESCRIPTION_MAX) {
    return combined.slice(0, CHARACTER_DESCRIPTION_MAX);
  }
  return combined;
}

function findDisallowedKeys(body: Record<string, unknown>): string[] {
  return Object.keys(body).filter((key) => {
    if (ALLOWED_PATCH_KEYS.has(key)) return false;
    if (BLOCKED_PATCH_KEYS.has(key)) return true;
    return true;
  });
}

function findBlockedKeys(body: Record<string, unknown>): string[] {
  return Object.keys(body).filter((key) => BLOCKED_PATCH_KEYS.has(key));
}

export function assertCharacterEditable(
  row: Pick<CharactersAiCreatorRow, "status" | "lora_ref">
): { ok: true } | { ok: false; error: string } {
  if (row.lora_ref?.trim()) {
    return { ok: false, error: CHARACTER_EDIT_BLOCKED_MESSAGE };
  }

  const status = row.status ?? "draft";
  if (!EDITABLE_CHARACTER_STATUSES.has(status)) {
    return { ok: false, error: CHARACTER_EDIT_BLOCKED_MESSAGE };
  }

  return { ok: true };
}

/** Validates PATCH payload and maps to whitelisted DB columns only. */
export function validateUpdateCharacterBody(
  body: UpdateCharacterBody
): UpdateValidationResult {
  const record = body as Record<string, unknown>;

  const blocked = findBlockedKeys(record);
  if (blocked.length > 0) {
    return {
      ok: false,
      error: "Consent-, Training- und Provider-Felder können nicht geändert werden.",
      status: 400,
    };
  }

  const disallowed = findDisallowedKeys(record);
  if (disallowed.length > 0) {
    return {
      ok: false,
      error: `Unbekannte oder nicht erlaubte Felder: ${disallowed.join(", ")}.`,
      status: 400,
    };
  }

  const patch: CharacterDbUpdate = {
    updated_at: new Date().toISOString(),
  };
  let hasChange = false;

  if (body.name !== undefined) {
    const name = body.name.trim();
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
    patch.name = name;
    hasChange = true;
  }

  if (body.triggerWord !== undefined) {
    const triggerRaw = body.triggerWord.trim();
    if (triggerRaw.length > CHARACTER_TRIGGER_WORD_MAX) {
      return {
        ok: false,
        error: `Trigger Word darf maximal ${CHARACTER_TRIGGER_WORD_MAX} Zeichen haben.`,
        status: 400,
      };
    }
    patch.trigger_word = triggerRaw || null;
    hasChange = true;
  }

  const characterTypeInput = normalizeCharacterType(body);
  if (body.type !== undefined || body.characterType !== undefined) {
    if (characterTypeInput !== "self" && characterTypeInput !== "fictional") {
      return {
        ok: false,
        error: "type muss self oder fictional sein.",
        status: 400,
      };
    }
    patch.character_type = characterTypeInput;
    patch.source = characterTypeInput === "self" ? "uploaded" : "generated";
    hasChange = true;
  }

  if (body.status !== undefined) {
    if (body.status !== "draft") {
      return {
        ok: false,
        error: "Status kann nur auf draft gesetzt werden.",
        status: 400,
      };
    }
    patch.status = "draft";
    hasChange = true;
  }

  const styleFromNotes = body.styleNotes ?? body.style;
  const platformsFromTarget =
    body.targetPlatform !== undefined
      ? normalizeTargetPlatform(body.targetPlatform)
      : undefined;

  const personaBody: CreateCharacterBody = {
    description: body.description,
    niche: body.niche,
    style: styleFromNotes,
    tone: body.tone,
    targetAudience: body.targetAudience,
    platforms: body.platforms ?? platformsFromTarget,
  };

  const descriptionUpdate = appendPersonaToDescription(personaBody);
  if (descriptionUpdate !== undefined) {
    patch.description = descriptionUpdate;
    hasChange = true;
  }

  const niche = normalizeOptionalText(body.niche, PERSONA_FIELD_MAX);
  if (niche !== undefined) {
    patch.niche = niche;
    hasChange = true;
  }

  const style = normalizeOptionalText(styleFromNotes, PERSONA_FIELD_MAX);
  if (styleFromNotes !== undefined || body.styleNotes !== undefined) {
    patch.style = style ?? null;
    hasChange = true;
  }

  const tone = normalizeOptionalText(body.tone, PERSONA_FIELD_MAX);
  if (tone !== undefined) {
    patch.tone = tone;
    hasChange = true;
  }

  const targetAudience = normalizeOptionalText(body.targetAudience, PERSONA_FIELD_MAX);
  if (targetAudience !== undefined) {
    patch.target_audience = targetAudience;
    hasChange = true;
  }

  if (body.platforms !== undefined || body.targetPlatform !== undefined) {
    patch.platforms = normalizePlatforms(personaBody.platforms ?? []) ?? null;
    hasChange = true;
  }

  if (!hasChange) {
    return {
      ok: false,
      error: "Keine gültigen Felder zum Aktualisieren.",
      status: 400,
    };
  }

  return { ok: true, data: patch };
}
