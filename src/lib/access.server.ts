import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hasActivePlan, type AccessUser, type PlanTier } from "@/lib/access";
import { getAgencyWorkspaceAccess } from "@/lib/agency-access.server";
import { hasEnoughCredits } from "@/lib/credits";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GatedFeature } from "@/lib/plan-gating";

export type FeatureAccessResult =
  | { ok: true; userId: string; profile: AccessUser }
  | { ok: false; status: 401 | 403; error: string; requiredPlan?: PlanTier };

export type KiToolAccessGranted = {
  ok: true;
  userId: string;
  profile: AccessUser;
  isAdmin: boolean;
  supabase: SupabaseClient;
};

export type KiToolAccessDenied = {
  ok: false;
  status: 401 | 403 | 402;
  body: Record<string, unknown>;
};

const NO_PLAN_ERROR = "Wähle einen Plan um zu starten.";
const NO_CREDITS_ERROR = "Nicht genug Credits.";

type AuthAccessDenied = {
  ok: false;
  status: 401 | 403;
  body: Record<string, unknown>;
};

async function resolveAuthenticatedAccess(): Promise<
  KiToolAccessGranted | AuthAccessDenied
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      status: 401,
      body: { success: false, error: "Nicht eingeloggt." },
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

  const isAdmin = isPlatformAdminServer({
    email: user.email,
    is_admin: accessUser.is_admin,
    role: accessUser.role,
  });

  if (isAdmin) {
    return {
      ok: true,
      userId: user.id,
      profile: {
        ...accessUser,
        plan: accessUser.plan ?? "business",
        role: accessUser.role ?? "admin",
        is_admin: true,
      },
      isAdmin: true,
      supabase,
    };
  }

  if (!hasActivePlan(accessUser)) {
    const agencyAccess = await getAgencyWorkspaceAccess(user.id);
    if (!agencyAccess.hasActiveTenantMembership) {
      return {
        ok: false,
        status: 403,
        body: featureAccessErrorBody({
          ok: false,
          status: 403,
          error: NO_PLAN_ERROR,
          requiredPlan: "starter",
        }),
      };
    }
  }

  return {
    ok: true,
    userId: user.id,
    profile: accessUser,
    isAdmin: false,
    supabase,
  };
}

export async function requireActivePlan(): Promise<FeatureAccessResult> {
  const access = await resolveAuthenticatedAccess();
  if (!access.ok) {
    if (access.status === 401) {
      return { ok: false, status: 401, error: "Nicht eingeloggt." };
    }
    return {
      ok: false,
      status: 403,
      error: NO_PLAN_ERROR,
      requiredPlan: "starter",
    };
  }

  return {
    ok: true,
    userId: access.userId,
    profile: access.profile,
  };
}

/** @deprecated Tier ignored — any active plan grants access. */
export async function requireFeatureAccess(
  requiredPlan?: PlanTier
): Promise<FeatureAccessResult> {
  void requiredPlan;
  return requireActivePlan();
}

export async function requireGatedFeature(
  feature: GatedFeature
): Promise<FeatureAccessResult> {
  void feature;
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
  feature: GatedFeature
): Promise<NextResponse | null> {
  void feature;
  return assertActivePlan();
}

/** Auth + plan (+ admin bypass) + credits for KI API routes and actions. */
export async function requireKiToolAccess(
  creditAmount: number
): Promise<KiToolAccessGranted | KiToolAccessDenied> {
  const access = await resolveAuthenticatedAccess();
  if (!access.ok) {
    return access;
  }

  if (access.isAdmin || creditAmount <= 0) {
    return access;
  }

  const creditCheck = await hasEnoughCredits(
    access.supabase,
    access.userId,
    creditAmount
  );
  if (!creditCheck.ok) {
    return {
      ok: false,
      status: 402,
      body: {
        success: false,
        error: NO_CREDITS_ERROR,
        credits: creditCheck.credits,
        required: creditAmount,
      },
    };
  }

  return access;
}

/** Returns NextResponse on denial, or granted access context for KI routes. */
export async function assertKiToolAccess(
  creditAmount: number
): Promise<NextResponse | KiToolAccessGranted> {
  const result = await requireKiToolAccess(creditAmount);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }
  return result;
}

export type KiToolActionAccessDenied = {
  ok: false;
  error: string;
  credits?: number;
  required?: number;
};

/** Server-action variant of assertKiToolAccess. */
export async function requireKiToolAccessForAction(
  creditAmount: number
): Promise<KiToolAccessGranted | KiToolActionAccessDenied> {
  const result = await requireKiToolAccess(creditAmount);
  if (!result.ok) {
    const denied: KiToolActionAccessDenied = {
      ok: false,
      error: String(result.body.error ?? "Zugriff verweigert."),
    };
    if (typeof result.body.credits === "number") {
      denied.credits = result.body.credits;
    }
    if (typeof result.body.required === "number") {
      denied.required = result.body.required;
    }
    return denied;
  }
  return result;
}
