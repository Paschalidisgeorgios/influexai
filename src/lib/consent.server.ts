import { NextResponse } from "next/server";

export const KI_INFLUENCER_UPLOAD_CONSENT_MESSAGE =
  "Bitte bestätige, dass du die Rechte und Zustimmung für diese Referenzbilder hast.";

export const CHARACTER_STUDIO_CONSENT_MESSAGE =
  "Bitte bestätige, dass du die Rechte und Zustimmung für die verwendeten Personen/Referenzen hast.";

const CONSENT_FIELD_NAMES = [
  "consentAccepted",
  "consentConfirmed",
  "consent_confirmed",
  "rightsConfirmed",
  "identityConsent",
  "hasConsent",
] as const;

/** True only for boolean true or string "true" (case-insensitive). */
export function parseConsentFlag(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

export function readConsentFromFormData(
  formData: FormData,
  options?: { requireRightsConfirmed?: boolean }
): boolean {
  const hasPrimaryConsent = CONSENT_FIELD_NAMES.some((key) =>
    parseConsentFlag(formData.get(key))
  );
  if (!hasPrimaryConsent) return false;
  if (options?.requireRightsConfirmed) {
    return parseConsentFlag(formData.get("rightsConfirmed"));
  }
  return true;
}

/** Identity upload chain: requires consentAccepted AND rightsConfirmed explicitly. */
export function readIdentityUploadConsentFromFormData(formData: FormData): boolean {
  return (
    parseConsentFlag(formData.get("consentAccepted")) &&
    parseConsentFlag(formData.get("rightsConfirmed"))
  );
}

/** Identity upload chain: requires consentAccepted AND rightsConfirmed explicitly. */
export function readIdentityUploadConsentFromJson(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return (
    parseConsentFlag(record.consentAccepted) &&
    parseConsentFlag(record.rightsConfirmed)
  );
}

export function readConsentFromJson(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return CONSENT_FIELD_NAMES.some((key) => parseConsentFlag(record[key]));
}

export function consentRequiredResponse(
  message: string,
  options?: { includeSuccess?: boolean }
) {
  return NextResponse.json(
    {
      ...(options?.includeSuccess === false ? {} : { success: false }),
      error: message,
      code: "CONSENT_REQUIRED",
    },
    { status: 400 }
  );
}
