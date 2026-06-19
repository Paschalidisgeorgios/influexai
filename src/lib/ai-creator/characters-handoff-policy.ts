/** AI Creator handoff status constants (uses existing characters.status text column). */

export const AI_CREATOR_HANDOFF_STATUS = "handoff_ready";

export const AI_CREATOR_HANDOFF_SOURCE_STATUS = "draft";

export const CHARACTER_HANDOFF_BLOCKED_MESSAGE =
  "Dieser Character kann derzeit nicht für die Upload-Vorbereitung freigegeben werden.";

export const CHARACTER_HANDOFF_ALREADY_READY_MESSAGE =
  "Dieser Entwurf ist bereits für die Upload-Vorbereitung vorbereitet.";

export function isCharacterHandoffReadyStatus(status: string | null | undefined): boolean {
  return (status ?? "draft") === AI_CREATOR_HANDOFF_STATUS;
}

export function isCharacterHandoffEligibleStatus(status: string | null | undefined): boolean {
  return (status ?? "draft") === AI_CREATOR_HANDOFF_SOURCE_STATUS;
}
