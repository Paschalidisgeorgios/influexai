import type { CharacterType } from "@/lib/ai-creator/types";

/** Columns from migration 060 — safe baseline without optional AI-Creator extensions. */
export const CHARACTERS_BASELINE_SELECT =
  "id, name, description, source, status, trigger_word, lora_ref, casting_image_url, created_at, updated_at";

/** Baseline + AI Creator consent/type fields (063 + 066). */
export const CHARACTERS_AI_CREATOR_SELECT = `${CHARACTERS_BASELINE_SELECT}, character_type, consent_confirmed, consent_confirmed_at, consent_source, consent_version`;

export type CharactersBaselineRow = {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  status: string | null;
  trigger_word: string | null;
  lora_ref: string | null;
  casting_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CharactersAiCreatorRow = CharactersBaselineRow & {
  character_type: CharacterType | null;
  consent_confirmed: boolean | null;
  consent_confirmed_at: string | null;
  consent_source: string | null;
  consent_version: string | null;
};

export type AiCreatorCharacterListItem = {
  id: string;
  name: string;
  description: string;
  source: string;
  characterType: CharacterType | "unknown";
  triggerWord: string;
  trainingStatus: string;
  previewImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  consentConfirmed: boolean;
  consentConfirmedAt: string | null;
};

export function inferCharacterTypeFromSource(
  source: string | null | undefined
): CharacterType | "unknown" {
  if (source === "uploaded") return "self";
  if (source === "generated") return "fictional";
  return "unknown";
}

function resolveCharacterType(
  row: CharactersAiCreatorRow
): CharacterType | "unknown" {
  if (row.character_type === "self" || row.character_type === "fictional") {
    return row.character_type;
  }
  return inferCharacterTypeFromSource(row.source);
}

export function aiCreatorRowToListItem(
  row: CharactersAiCreatorRow
): AiCreatorCharacterListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    source: row.source ?? "generated",
    characterType: resolveCharacterType(row),
    triggerWord: row.trigger_word ?? "",
    trainingStatus: row.status ?? "draft",
    previewImageUrl: row.casting_image_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    consentConfirmed: row.consent_confirmed === true,
    consentConfirmedAt: row.consent_confirmed_at ?? null,
  };
}

/** @deprecated Prefer aiCreatorRowToListItem when consent columns are available. */
export function baselineRowToListItem(
  row: CharactersBaselineRow
): AiCreatorCharacterListItem {
  return aiCreatorRowToListItem({
    ...row,
    character_type: null,
    consent_confirmed: null,
    consent_confirmed_at: null,
    consent_source: null,
    consent_version: null,
  });
}
