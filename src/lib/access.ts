import {
  DEFAULT_ADMIN_EMAIL_ALLOWLIST,
  isEmailInAdminAllowlist,
} from "@/lib/admin-allowlist";
import { checkPlatformAdmin } from "@/lib/platform-admin";

export type PlanTier =
  | "free"
  | "starter"
  | "creator"
  | "pro"
  | "business";

/** @deprecated Use DEFAULT_ADMIN_EMAIL_ALLOWLIST or env `ADMIN_EMAIL_ALLOWLIST`. */
export const ADMIN_EMAILS = DEFAULT_ADMIN_EMAIL_ALLOWLIST;

/** Client-safe allowlist check (default emails only — server guards use env). */
export function isAdminEmail(email?: string | null): boolean {
  return isEmailInAdminAllowlist(email, DEFAULT_ADMIN_EMAIL_ALLOWLIST);
}

export type AccessUser = {
  plan?: PlanTier | string | null;
  role?: string | null;
  is_admin?: boolean | null;
  email?: string | null;
};

function normalizePlan(plan: string | null | undefined): PlanTier {
  if (
    plan === "starter" ||
    plan === "creator" ||
    plan === "pro" ||
    plan === "business"
  ) {
    return plan;
  }
  return "free";
}

/**
 * Platform admin for client UI hints only. Server routes must use `isPlatformAdminServer`.
 */
export function isPlatformAdmin(user: AccessUser): boolean {
  return checkPlatformAdmin(user, isAdminEmail);
}

/** @alias isPlatformAdmin */
export function isAdminUser(user: AccessUser): boolean {
  return isPlatformAdmin(user);
}

function isPrivilegedAccessUser(user: AccessUser): boolean {
  return isPlatformAdmin(user);
}

/** Credits are never required or deducted for admin emails. */
export function isCreditExemptEmail(email?: string | null): boolean {
  return isAdminEmail(email);
}

/** Stufe 2: irgendein bezahlter Plan (nicht free). */
export function hasActivePlan(user: AccessUser): boolean {
  if (isPrivilegedAccessUser(user)) return true;
  return normalizePlan(user.plan) !== "free";
}

/** Platform plan or active agency tenant membership (member/owner). */
export function hasKiToolEntitlement(
  user: AccessUser,
  hasActiveTenantMembership = false
): boolean {
  return hasActivePlan(user) || hasActiveTenantMembership;
}

/**
 * Zwei-Stufen-Zugang: Admin/Owner oder aktiver Plan → true.
 * `requiredPlan` wird ignoriert (kein Tier-Gating mehr).
 */
export function canUseFeature(user: AccessUser): boolean {
  return hasActivePlan(user);
}
