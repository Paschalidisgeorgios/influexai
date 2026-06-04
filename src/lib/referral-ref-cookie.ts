export const REFERRAL_REF_COOKIE = "influexai_ref";
export const REFERRAL_REF_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isReferralUserId(value: string): boolean {
  return UUID_RE.test(value.trim());
}
