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
  if (characterType === "self") return "Eigener Character · Upload";
  if (characterType === "fictional") return "Fiktive Persona · Generiert";
  if (characterType === "unknown") return "Character · Quelle unbekannt";
  if (source === "uploaded") return "Eigener Character · Upload";
  if (source === "generated") return "Fiktive Persona · Generiert";
  return "Character";
}

/** Short type label for draft cards in the AI Creator hub */
export function characterTypeShortLabel(
  characterType: string | null | undefined,
  source: string | null | undefined
): string {
  if (characterType === "self" || source === "uploaded") return "Eigener Character";
  if (characterType === "fictional" || source === "generated") return "Fiktive Persona";
  return "Character";
}

/** Self/digital-twin entry — avoids /dashboard/ki-influencer (middleware → ki-ich). */
export const AI_CREATOR_SELF_WORKFLOW_HREF = "/dashboard/ki-ich";

/** Fictional persona / LoRA prep — stable route (ki-influencer redirects via middleware). */
export const AI_CREATOR_FICTIONAL_WORKFLOW_HREF = "/dashboard/lora-training";
