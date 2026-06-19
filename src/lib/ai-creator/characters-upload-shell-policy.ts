/** AI Creator upload/training shell status (uses existing characters.status text column). */

export const AI_CREATOR_UPLOAD_SHELL_SOURCE_STATUS = "handoff_ready";

export const AI_CREATOR_UPLOAD_SHELL_STATUS = "upload_pending";

export const CHARACTER_UPLOAD_SHELL_BLOCKED_MESSAGE =
  "Dieser Character kann derzeit nicht für die Upload-/Training-Vorbereitung freigegeben werden.";

export const CHARACTER_UPLOAD_SHELL_ALREADY_READY_MESSAGE =
  "Upload-/Training-Vorbereitung ist bereits aktiv.";

export function isCharacterUploadShellPendingStatus(
  status: string | null | undefined
): boolean {
  return (status ?? "draft") === AI_CREATOR_UPLOAD_SHELL_STATUS;
}

export function isCharacterUploadShellEligibleStatus(
  status: string | null | undefined
): boolean {
  return (status ?? "draft") === AI_CREATOR_UPLOAD_SHELL_SOURCE_STATUS;
}
