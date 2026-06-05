import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  planMeetsRequirement,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { FEATURE_MIN_PLAN, type GatedFeature } from "@/lib/plan-gating";

export type AccessUser = {
  plan?: string | null;
  role?: string | null;
  is_admin?: boolean | null;
};

export function isPrivilegedAccessUser(user: AccessUser): boolean {
  if (user.is_admin === true) return true;
  const role = (user.role ?? "user").toLowerCase();
  return role === "admin" || role === "owner";
}

/** Plan gate: admin/owner bypass; otherwise compare plan rank. */
export function canUseFeature(
  user: AccessUser,
  requiredPlan: SubscriptionPlanId
): boolean {
  if (isPrivilegedAccessUser(user)) return true;
  if (requiredPlan === "free") return true;
  return planMeetsRequirement(user.plan, requiredPlan);
}

export type FeatureAccessResult =
  | { ok: true; userId: string; profile: AccessUser }
  | { ok: false; status: 401 | 403; error: string; requiredPlan?: SubscriptionPlanId };

export async function requireFeatureAccess(
  requiredPlan: SubscriptionPlanId
): Promise<FeatureAccessResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Nicht eingeloggt." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, role, is_admin")
    .eq("id", user.id)
    .single();

  const accessUser: AccessUser = profile ?? { plan: "free", role: "user" };

  if (!canUseFeature(accessUser, requiredPlan)) {
    return {
      ok: false,
      status: 403,
      error: "Feature gesperrt — Plan-Upgrade erforderlich.",
      requiredPlan,
    };
  }

  return { ok: true, userId: user.id, profile: accessUser };
}

export async function requireGatedFeature(
  feature: GatedFeature
): Promise<FeatureAccessResult> {
  return requireFeatureAccess(FEATURE_MIN_PLAN[feature]);
}

export function featureAccessErrorBody(result: Extract<FeatureAccessResult, { ok: false }>) {
  return {
    error: result.error,
    code: "PLAN_REQUIRED" as const,
    required_plan: result.requiredPlan,
  };
}

/** Returns a 401/403 NextResponse, or null when access is granted. */
export async function assertGatedFeature(
  feature: GatedFeature
): Promise<NextResponse | null> {
  const access = await requireGatedFeature(feature);
  if (!access.ok) {
    return NextResponse.json(featureAccessErrorBody(access), { status: access.status });
  }
  return null;
}
