import type { AiCreatorDraft, TrainingStatus } from "./types";

export type StatusBadge = {
  id: TrainingStatus;
  labelDe: string;
  labelEn: string;
  tone: "muted" | "warn" | "active" | "success" | "error";
};

export const TRAINING_STATUS_BADGES: StatusBadge[] = [
  { id: "draft", labelDe: "Entwurf", labelEn: "Draft", tone: "muted" },
  {
    id: "references_ready",
    labelDe: "Referenzen bereit",
    labelEn: "References ready",
    tone: "active",
  },
  {
    id: "consent_missing",
    labelDe: "Consent fehlt",
    labelEn: "Consent missing",
    tone: "warn",
  },
  {
    id: "ready_to_train",
    labelDe: "Training vorbereitet",
    labelEn: "Training prepared",
    tone: "active",
  },
  {
    id: "training",
    labelDe: "Training läuft",
    labelEn: "Training running",
    tone: "active",
  },
  { id: "ready", labelDe: "Bereit", labelEn: "Ready", tone: "success" },
  { id: "failed", labelDe: "Fehlgeschlagen", labelEn: "Failed", tone: "error" },
];

export function badgeForStatus(
  status: TrainingStatus,
  lang: "de" | "en"
): { label: string; tone: StatusBadge["tone"] } {
  const row = TRAINING_STATUS_BADGES.find((b) => b.id === status) ?? TRAINING_STATUS_BADGES[0];
  return {
    label: lang === "de" ? row.labelDe : row.labelEn,
    tone: row.tone,
  };
}

export function deriveTrainingStatus(draft: Pick<
  AiCreatorDraft,
  "characterType" | "consentConfirmed" | "referenceImageUrls" | "name" | "trainingStatus"
>): TrainingStatus {
  if (draft.trainingStatus === "ready" || draft.trainingStatus === "failed") {
    return draft.trainingStatus;
  }
  if (draft.trainingStatus === "training") return "training";
  if (draft.trainingStatus === "ready_to_train") return "ready_to_train";

  const hasRefs = draft.referenceImageUrls.length >= 1;
  const hasName = draft.name.trim().length > 0;

  if (draft.characterType === "self") {
    if (hasRefs && !draft.consentConfirmed) return "consent_missing";
    if (hasRefs && draft.consentConfirmed && hasName) return "references_ready";
  }

  if (draft.characterType === "fictional" && hasName && draft.referenceImageUrls.length > 0) {
    return "references_ready";
  }

  return "draft";
}

export function mapDbStatus(raw: string | null | undefined): TrainingStatus {
  switch (raw) {
    case "ready":
      return "ready";
    case "training":
      return "training";
    case "failed":
      return "failed";
    case "ready_to_train":
    case "upload_ready":
      return "ready_to_train";
    default:
      return "draft";
  }
}

export function mapStatusToDb(status: TrainingStatus): string {
  switch (status) {
    case "ready":
      return "ready";
    case "training":
      return "training";
    case "failed":
      return "failed";
    case "ready_to_train":
    case "references_ready":
      return "ready_to_train";
    case "consent_missing":
    case "draft":
    default:
      return "draft";
  }
}
