/** Shared edit policy for AI Creator character drafts (client + server safe). */

export const EDITABLE_CHARACTER_STATUSES = new Set(["draft"]);

export const CHARACTER_EDIT_BLOCKED_MESSAGE =
  "Dieser Character ist bereits in einem Workflow und kann hier nicht bearbeitet werden.";

export function isCharacterEditableStatus(status: string | null | undefined): boolean {
  return EDITABLE_CHARACTER_STATUSES.has(status ?? "draft");
}
