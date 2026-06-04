const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function normalizeReferralCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Welcome bonus for invited user (signup with ?ref=). */
export const REFERRAL_SIGNUP_BONUS_REFERRED = 10;
/** Bonus for referrer when invitee signs up. */
export const REFERRAL_SIGNUP_BONUS_REFERRER = 20;
export const REFERRAL_PURCHASE_BONUS_REFERRER = 20;
export const SITE_URL = "https://influexaicreator.com";

export const REFERRAL_TX_LABEL = "Referral Bonus";
