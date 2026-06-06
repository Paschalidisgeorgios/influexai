import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canUseFeature, type AccessUser, type PlanTier } from "@/lib/access";
import { FEATURE_MIN_PLAN, type GatedFeature } from "@/lib/plan-gating";

export type FeatureAccessResult =
  | { ok: true; userId: string; profile: AccessUser }
  | { ok: false; status: 401 | 403; error: string; requiredPlan?: PlanTier };

export async function requireFeatureAccess(
  requiredPlan: PlanTier
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

export function featureAccessErrorBody(
  result: Extract<FeatureAccessResult, { ok: false }>
) {
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
    return NextResponse.json(featureAccessErrorBody(access), {
      status: access.status,
    });
  }
  return null;
}
