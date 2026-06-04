import { createHash } from "crypto";

const SITE_URL = "https://influexaicreator.com";

export function getDailySuggestionsUnsubscribeSecret(): string {
  return (
    process.env.DAILY_SUGGESTIONS_UNSUBSCRIBE_SECRET ??
    process.env.NURTURE_UNSUBSCRIBE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "daily-suggestions-unsubscribe-dev"
  );
}

export function dailySuggestionsUnsubscribeToken(userId: string): string {
  return createHash("sha256")
    .update(`daily-suggestions:${userId}:${getDailySuggestionsUnsubscribeSecret()}`)
    .digest("hex");
}

export function dailySuggestionsUnsubscribeUrl(userId: string): string {
  const token = dailySuggestionsUnsubscribeToken(userId);
  return `${SITE_URL}/api/unsubscribe-daily-suggestions?uid=${encodeURIComponent(userId)}&token=${token}`;
}
