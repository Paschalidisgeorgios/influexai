import type { CharactersBaselineRow } from "@/lib/ai-creator/characters-list.server";
import {
  CHARACTER_DELETE_BLOCKED_MESSAGE,
  DELETABLE_CHARACTER_STATUSES,
} from "@/lib/ai-creator/characters-delete-policy";

export {
  CHARACTER_DELETE_BLOCKED_MESSAGE,
  DELETABLE_CHARACTER_STATUSES,
  isCharacterDeletableStatus,
} from "@/lib/ai-creator/characters-delete-policy";

export function isCharacterDeletable(row: Pick<CharactersBaselineRow, "status" | "lora_ref">): boolean {
  const status = row.status ?? "draft";
  if (!DELETABLE_CHARACTER_STATUSES.has(status)) return false;
  if (row.lora_ref?.trim()) return false;
  return true;
}

export function assertCharacterDeletable(
  row: Pick<CharactersBaselineRow, "status" | "lora_ref">
): { ok: true } | { ok: false; error: string } {
  if (row.lora_ref?.trim()) {
    return { ok: false, error: CHARACTER_DELETE_BLOCKED_MESSAGE };
  }

  const status = row.status ?? "draft";
  if (!DELETABLE_CHARACTER_STATUSES.has(status)) {
    return { ok: false, error: CHARACTER_DELETE_BLOCKED_MESSAGE };
  }

  return { ok: true };
}
