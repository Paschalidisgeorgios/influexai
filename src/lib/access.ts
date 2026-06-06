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

const RANK: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  creator: 2,
  pro: 3,
  business: 4,
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

/** Plan gate: admin/owner bypass; otherwise compare plan rank. */
export function canUseFeature(user: AccessUser, requiredPlan: PlanTier): boolean {
  if (isPrivilegedAccessUser(user)) return true;
  if (requiredPlan === "free") return true;
  return RANK[normalizePlan(user.plan)] >= RANK[requiredPlan];
}
