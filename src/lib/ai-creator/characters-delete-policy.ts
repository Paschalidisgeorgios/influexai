/** Shared delete policy for AI Creator characters (client + server safe). */

export const DELETABLE_CHARACTER_STATUSES = new Set(["draft", "failed"]);

export const CHARACTER_DELETE_BLOCKED_MESSAGE =
  "Dieser Character ist bereits in einem Workflow und kann hier nicht gelöscht werden.";

export function isCharacterDeletableStatus(status: string | null | undefined): boolean {
  return DELETABLE_CHARACTER_STATUSES.has(status ?? "draft");
}
