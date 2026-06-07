import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";
import { hasActivePlan, type AccessUser, type PlanTier } from "@/lib/access";
import type { GatedFeature } from "@/lib/plan-gating";

export type FeatureAccessResult =
  | { ok: true; userId: string; profile: AccessUser }
  | { ok: false; status: 401 | 403; error: string; requiredPlan?: PlanTier };

const NO_PLAN_ERROR = "Wähle einen Plan um zu starten.";

export async function requireActivePlan(): Promise<FeatureAccessResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Nicht eingeloggt." };
  }

  if (isPlatformAdminServer({ email: user.email })) {
    return {
      ok: true,
      userId: user.id,
      profile: {
        plan: "business",
        role: "admin",
        is_admin: true,
        email: user.email,
      },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, role, is_admin")
    .eq("id", user.id)
    .single();

  const accessUser: AccessUser = {
    ...(profile ?? { plan: "free", role: "user" }),
    email: user.email,
  };

  if (!hasActivePlan(accessUser)) {
    return {
      ok: false,
      status: 403,
      error: NO_PLAN_ERROR,
      requiredPlan: "starter",
    };
  }

  return { ok: true, userId: user.id, profile: accessUser };
}

/** @deprecated Tier ignored — any active plan grants access. */
export async function requireFeatureAccess(
  _requiredPlan: PlanTier
): Promise<FeatureAccessResult> {
  return requireActivePlan();
}

export async function requireGatedFeature(
  _feature: GatedFeature
): Promise<FeatureAccessResult> {
  return requireActivePlan();
}

export function featureAccessErrorBody(
  result: Extract<FeatureAccessResult, { ok: false }>
) {
  return {
    error: result.error,
    code: "PLAN_REQUIRED" as const,
    required_plan: result.requiredPlan ?? ("starter" as PlanTier),
  };
}

/** Returns a 401/403 NextResponse, or null when access is granted. */
export async function assertActivePlan(): Promise<NextResponse | null> {
  const access = await requireActivePlan();
  if (!access.ok) {
    return NextResponse.json(featureAccessErrorBody(access), {
      status: access.status,
    });
  }
  return null;
}

/** Returns a 401/403 NextResponse, or null when access is granted. */
export async function assertGatedFeature(
  _feature: GatedFeature
): Promise<NextResponse | null> {
  return assertActivePlan();
}
