import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import type { KiInfluencerApiErrorBody } from "@/lib/ki-influencer-types";

export const KI_INFLUENCER_ERROR_MESSAGES = {
  insufficient_credits: "Nicht genug Credits — bitte aufladen",
  table_missing: "Datenbank-Setup unvollständig — Migration ausführen",
  generation_failed: "Generierung fehlgeschlagen, bitte erneut versuchen",
} as const;

export type { KiInfluencerApiErrorBody } from "@/lib/ki-influencer-types";

function stringFromUnknown(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["message", "detail", "error", "msg"]) {
      const nested = stringFromUnknown(record[key]);
      if (nested) return nested;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

/** Normalize API error bodies — never returns non-strings. */
export function apiBodyToErrorMessage(
  data: KiInfluencerApiErrorBody | null | undefined
): string {
  if (!data) return KI_INFLUENCER_ERROR_MESSAGES.generation_failed;

  const code =
    typeof data.error === "string" ? data.error : stringFromUnknown(data.error);
  if (code && code in KI_INFLUENCER_ERROR_MESSAGES) {
    return KI_INFLUENCER_ERROR_MESSAGES[
      code as keyof typeof KI_INFLUENCER_ERROR_MESSAGES
    ];
  }

  const detail =
    typeof data.detail === "string"
      ? data.detail.trim()
      : stringFromUnknown(data.detail);
  if (detail) return detail;

  if (code) return code;

  return KI_INFLUENCER_ERROR_MESSAGES.generation_failed;
}

export function kiInfluencerUserMessage(data: KiInfluencerApiErrorBody): string {
  return apiBodyToErrorMessage(data);
}

/** Known API codes → message; Error.message; JSON fallback. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message?.trim();
    if (msg && msg !== "[object Object]") return msg;
  }

  if (typeof err === "string" && err.trim()) return err.trim();

  if (err && typeof err === "object") {
    const asApi = err as KiInfluencerApiErrorBody;
    if ("error" in asApi || "detail" in asApi) {
      return apiBodyToErrorMessage(asApi);
    }
    const extracted = stringFromUnknown(err);
    if (extracted) return extracted;
  }

  return KI_INFLUENCER_ERROR_MESSAGES.generation_failed;
}

export function handleKiInfluencerApiError(
  status: number,
  data: KiInfluencerApiErrorBody,
  fallbackRequired?: number
): boolean {
  const creditStatus = data.error === "insufficient_credits" ? 402 : status;
  return handleApiInsufficientCredits(creditStatus, data, fallbackRequired);
}

/** Treat 200 + success:false or missing success as failure. */
export function isKiInfluencerApiFailure(
  ok: boolean,
  data: KiInfluencerApiErrorBody
): boolean {
  if (!ok) return true;
  if (data.success === false) return true;
  return false;
}
