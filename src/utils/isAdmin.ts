import type { AccessUser } from "@/lib/access";
import {
  isAdminEmail,
  isCreditExemptEmail,
  isPlatformAdmin,
} from "@/lib/access";

export function normalizeUserEmail(email?: string | null): string {
  return email?.trim().toLowerCase() ?? "";
}

/**
 * Client-safe admin check for UI bypass (credits, plan gates, badges).
 * Server routes must use `isPlatformAdminServer` / `isCreditExemptUser`.
 */
export function isAdmin(user: AccessUser | null | undefined): boolean {
  if (!user) return false;
  return isPlatformAdmin(user);
}

/** Admin from session email only (DEFAULT_ADMIN_ALLOWLIST via isCreditExemptEmail). */
export function isAdminFromEmail(email?: string | null): boolean {
  return isCreditExemptEmail(email);
}

export { isAdminEmail, isCreditExemptEmail, isPlatformAdmin };
