import type { CharacterType } from "@/lib/ai-creator/types";

/** Columns from migration 060 — safe baseline without optional AI-Creator extensions. */
export const CHARACTERS_BASELINE_SELECT =
  "id, name, description, source, status, trigger_word, lora_ref, casting_image_url, created_at, updated_at";

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
};

export function inferCharacterTypeFromSource(
  source: string | null | undefined
): CharacterType | "unknown" {
  if (source === "uploaded") return "self";
  if (source === "generated") return "fictional";
  return "unknown";
}

export function baselineRowToListItem(
  row: CharactersBaselineRow
): AiCreatorCharacterListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    source: row.source ?? "generated",
    characterType: inferCharacterTypeFromSource(row.source),
    triggerWord: row.trigger_word ?? "",
    trainingStatus: row.status ?? "draft",
    previewImageUrl: row.casting_image_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
