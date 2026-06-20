/**
 * Mirrors src/lib/admin-allowlist.ts + credit-exempt profile rules for smoke scripts.
 */
const DEFAULT_ADMIN_EMAIL_ALLOWLIST = [
  "paschalidisgeorgios38@gmail.com",
  "paschalidis.georgio38@gmail.com",
];

export function parseAdminEmailAllowlist(raw) {
  const entries = raw?.trim()
    ? raw
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    : [...DEFAULT_ADMIN_EMAIL_ALLOWLIST];
  return [...new Set(entries)];
}

export function isEmailInAdminAllowlist(email, allowlist) {
  if (!email?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  return allowlist.some((entry) => entry === normalized);
}

export function isCreditExemptProfile(email, profile, envAllowlistRaw) {
  if (profile?.is_admin === true) {
    return { exempt: true, reason: "is_admin" };
  }
  const role = (profile?.role ?? "user").trim().toLowerCase();
  if (role === "admin") {
    return { exempt: true, reason: "admin_role" };
  }
  const allowlist = parseAdminEmailAllowlist(envAllowlistRaw);
  if (isEmailInAdminAllowlist(email, allowlist)) {
    return { exempt: true, reason: "email_allowlist" };
  }
  return { exempt: false, reason: null };
}
