/** Default allowlist when `ADMIN_EMAIL_ALLOWLIST` is unset (server + client UI fallback). */
export const DEFAULT_ADMIN_EMAIL_ALLOWLIST = [
  "paschalidis.georgio38@gmail.com",
] as const;

/** @deprecated Use DEFAULT_ADMIN_EMAIL_ALLOWLIST or env `ADMIN_EMAIL_ALLOWLIST`. */
export const ADMIN_EMAILS = DEFAULT_ADMIN_EMAIL_ALLOWLIST;

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Comma-separated env value → normalized unique emails (exact match only). */
export function parseAdminEmailAllowlist(raw: string | undefined | null): string[] {
  const entries = raw?.trim()
    ? raw.split(",").map((entry) => normalizeAdminEmail(entry)).filter(Boolean)
    : [...DEFAULT_ADMIN_EMAIL_ALLOWLIST];
  return [...new Set(entries)];
}

export function isEmailInAdminAllowlist(
  email: string | null | undefined,
  allowlist: readonly string[]
): boolean {
  if (!email?.trim()) return false;
  const normalized = normalizeAdminEmail(email);
  return allowlist.some((entry) => entry === normalized);
}
