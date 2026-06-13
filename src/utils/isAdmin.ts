import type { AccessUser } from "@/lib/access";
import {
  isAdminEmail,
  isCreditExemptEmail,
  isPlatformAdmin,
} from "@/lib/access";

/** Canonical platform owner email (case-insensitive match). */
export const PLATFORM_OWNER_EMAIL = "paschalidisgeorgios38@gmail.com";

export function normalizeUserEmail(email?: string | null): string {
  return email?.trim().toLowerCase() ?? "";
}

/** Exact match for the primary platform owner account. */
export function isPlatformOwnerEmail(email?: string | null): boolean {
  return normalizeUserEmail(email) === normalizeUserEmail(PLATFORM_OWNER_EMAIL);
}

/**
 * Client-safe admin check for UI bypass (credits, plan gates, badges).
 * Server routes must use `isPlatformAdminServer` / `isCreditExemptUser`.
 */
export function isAdmin(user: AccessUser | null | undefined): boolean {
  if (!user) return false;
  return isPlatformAdmin(user);
}

/** Admin from session email only (allowlist + owner email). */
export function isAdminFromEmail(email?: string | null): boolean {
  return isCreditExemptEmail(email) || isPlatformOwnerEmail(email);
}

export { isAdminEmail, isCreditExemptEmail, isPlatformAdmin };
