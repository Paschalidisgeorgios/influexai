/** Simplified hub status labels for AI Creator character list */

export type HubCharacterPhase =
  | "draft"
  | "preparing"
  | "training"
  | "ready"
  | "failed";

export const HUB_PHASE_LABELS: Record<HubCharacterPhase, string> = {
  draft: "Entwurf",
  preparing: "Vorbereitung",
  training: "Training",
  ready: "Bereit",
  failed: "Fehlgeschlagen",
};

export const HUB_PHASE_TONE: Record<
  HubCharacterPhase,
  "muted" | "active" | "success" | "error"
> = {
  draft: "muted",
  preparing: "active",
  training: "active",
  ready: "success",
  failed: "error",
};

export function mapCharacterStatusToHubPhase(raw: string | null | undefined): HubCharacterPhase {
  switch (raw) {
    case "ready":
      return "ready";
    case "training":
      return "training";
    case "failed":
      return "failed";
    case "casting":
    case "casting_confirmed":
    case "upload_ready":
    case "training_set":
    case "training_set_ready":
    case "ready_to_train":
    case "references_ready":
      return "preparing";
    default:
      return "draft";
  }
}

export function characterTypeLabel(
  characterType: string | null | undefined,
  source: string | null | undefined
): string {
  if (characterType === "self") return "Eigener Character";
  if (characterType === "fictional") return "Fiktive Persona";
  if (source === "uploaded") return "Upload-basiert";
  if (source === "generated") return "Generiert";
  return "Character";
}
