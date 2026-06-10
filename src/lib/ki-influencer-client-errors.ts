import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";

export const KI_INFLUENCER_ERROR_MESSAGES = {
  insufficient_credits: "Nicht genug Credits — bitte aufladen",
  table_missing: "Datenbank-Setup unvollständig — Migration ausführen",
  generation_failed: "Generierung fehlgeschlagen, bitte erneut versuchen",
} as const;

export type KiInfluencerApiErrorBody = {
  error?: string;
  detail?: string;
  credits?: number;
  required?: number;
};

export function kiInfluencerUserMessage(data: KiInfluencerApiErrorBody): string {
  const code = data.error as keyof typeof KI_INFLUENCER_ERROR_MESSAGES;
  if (code && code in KI_INFLUENCER_ERROR_MESSAGES) {
    return KI_INFLUENCER_ERROR_MESSAGES[code];
  }
  return data.detail ?? data.error ?? KI_INFLUENCER_ERROR_MESSAGES.generation_failed;
}

export function handleKiInfluencerApiError(
  status: number,
  data: KiInfluencerApiErrorBody,
  fallbackRequired?: number
): boolean {
  const creditStatus = data.error === "insufficient_credits" ? 402 : status;
  return handleApiInsufficientCredits(creditStatus, data, fallbackRequired);
}
