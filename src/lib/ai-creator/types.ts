/** AI Creator / LoRA persona workflow — shared types */

export type CharacterType = "self" | "fictional";

export type TrainingStatus =
  | "draft"
  | "references_ready"
  | "consent_missing"
  | "ready_to_train"
  | "training"
  | "ready"
  | "failed";

export type AiCreatorDraft = {
  id?: string;
  name: string;
  characterType: CharacterType | null;
  triggerWord: string;
  niche: string;
  style: string;
  tone: string;
  platforms: string[];
  targetAudience: string;
  description: string;
  consentConfirmed: boolean;
  /** Persisted URLs (storage or demo paths) */
  referenceImageUrls: string[];
  trainingStatus: TrainingStatus;
  loraUrl?: string | null;
  previewImageUrl?: string | null;
};

export type AiCreatorSeed = {
  prompt?: string;
  mode?: CharacterType | null;
};

export const ACCEPTED_REFERENCE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const REFERENCE_RECOMMENDED_COUNT = 20;
export const REFERENCE_MIN_HINT = 3;
