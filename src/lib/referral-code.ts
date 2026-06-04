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

export const REFERRAL_SIGNUP_BONUS_REFERRED = 5;
export const REFERRAL_SIGNUP_BONUS_REFERRER = 10;
export const REFERRAL_PURCHASE_BONUS_REFERRER = 20;
export const SITE_URL = "https://influexaicreator.com";
