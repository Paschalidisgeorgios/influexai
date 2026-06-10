/** Shared KI-Influencer API shapes (client + server). */

export type KiInfluencerErrorCode =
  | "insufficient_credits"
  | "table_missing"
  | "generation_failed";

export type KiInfluencerApiErrorBody = {
  success?: boolean;
  error?: string;
  detail?: string;
  credits?: number;
  required?: number;
};

export type TrainingSetStartResponse = KiInfluencerApiErrorBody & {
  success: true;
  characterId: string;
  characterSetId: string;
  total: number;
  creditsUsed: number;
  creditsLeft?: number;
};

export type TrainingSetImageResponse = KiInfluencerApiErrorBody & {
  success: true;
  characterId: string;
  index: number;
  total: number;
  generationId: string;
  imageUrl: string;
  done: boolean;
  status: string;
};

export function isTrainingSetStartResponse(
  data: KiInfluencerApiErrorBody
): data is TrainingSetStartResponse {
  return (
    data.success === true &&
    typeof (data as TrainingSetStartResponse).characterSetId === "string"
  );
}

export function isTrainingSetImageResponse(
  data: KiInfluencerApiErrorBody
): data is TrainingSetImageResponse {
  return (
    data.success === true &&
    typeof (data as TrainingSetImageResponse).generationId === "string"
  );
}
