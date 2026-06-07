export type PlanTier =
  | "free"
  | "starter"
  | "creator"
  | "pro"
  | "business";

/** Hard-coded admin emails — credit bypass + plan access (server must verify via auth session). */
export const ADMIN_EMAILS = ["paschalidisgeorgios38@gmail.com"] as const;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase());
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
 * Platform admin panel access only.
 * Agency tenant_role (owner/admin/member) is stored separately and must NOT grant /admin.
 */
export function isPlatformAdmin(user: AccessUser): boolean {
  if (isAdminEmail(user.email)) return true;
  if (user.is_admin === true) return true;
  const role = (user.role ?? "user").toLowerCase();
  return role === "admin";
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

/**
 * Zwei-Stufen-Zugang: Admin/Owner oder aktiver Plan → true.
 * `requiredPlan` wird ignoriert (kein Tier-Gating mehr).
 */
export function canUseFeature(
  user: AccessUser,
  _requiredPlan?: PlanTier
): boolean {
  return hasActivePlan(user);
}
