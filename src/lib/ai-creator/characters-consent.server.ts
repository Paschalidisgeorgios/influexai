/** Consent metadata persisted on AI Creator character drafts. */

export const AI_CREATOR_CONSENT_SOURCE = "ai_creator_draft";

/** Bump when consent copy or requirements change materially. */
export const AI_CREATOR_CONSENT_VERSION = "2026-06";

export type PersistedConsentFields = {
  consent_confirmed: true;
  consent_confirmed_at: string;
  consent_source: string;
  consent_version: string;
};

/** Build DB consent columns after request-time validation succeeded. */
export function buildPersistedConsentFields(): PersistedConsentFields {
  return {
    consent_confirmed: true,
    consent_confirmed_at: new Date().toISOString(),
    consent_source: AI_CREATOR_CONSENT_SOURCE,
    consent_version: AI_CREATOR_CONSENT_VERSION,
  };
}
