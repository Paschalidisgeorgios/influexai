export type PlanTier =
  | "free"
  | "starter"
  | "creator"
  | "pro"
  | "business";

export type AccessUser = {
  plan?: PlanTier | string | null;
  role?: string | null;
  is_admin?: boolean | null;
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

function isPrivilegedAccessUser(user: AccessUser): boolean {
  if (user.is_admin === true) return true;
  const role = (user.role ?? "user").toLowerCase();
  return role === "admin" || role === "owner";
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
