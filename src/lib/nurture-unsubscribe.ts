import { createHash } from "crypto";

const SITE_URL = "https://influexaicreator.com";

export function getNurtureUnsubscribeSecret(): string {
  return (
    process.env.NURTURE_UNSUBSCRIBE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "nurture-unsubscribe-dev"
  );
}

export function nurtureUnsubscribeToken(userId: string): string {
  return createHash("sha256")
    .update(userId + getNurtureUnsubscribeSecret())
    .digest("hex");
}

export function nurtureUnsubscribeUrl(userId: string): string {
  const token = nurtureUnsubscribeToken(userId);
  return `${SITE_URL}/api/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`;
}
