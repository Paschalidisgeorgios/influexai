import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AGENCY_WORKSPACE_PREFIXES,
  agencyWorkspaceAccessFromRows,
  isAgencyWorkspacePath,
  isDashboardSettingsPath,
  resolveAgencyWorkspaceTarget,
  type AgencyWorkspaceAccess,
} from "@/lib/agency-access";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { type Tenant } from "@/lib/tenant";

export {
  AGENCY_WORKSPACE_PREFIXES,
  isAgencyWorkspacePath,
  isDashboardSettingsPath,
  resolveAgencyWorkspaceTarget,
  type AgencyWorkspaceAccess,
};

const TENANT_SELECT =
  "id, name, slug, custom_domain, logo_url, primary_color, secondary_color, plan, max_seats, credits_pool, is_active, deactivated_at, owner_id, stripe_subscription_id";

/** Read-only agency workspace access (owner tenant or paid agency_plan awaiting setup). */
export async function getAgencyWorkspaceAccess(
  userId: string,
  serviceClient?: SupabaseClient
): Promise<AgencyWorkspaceAccess> {
  const service = serviceClient ?? createServiceSupabaseClient();

  const { data: profile } = await service
    .from("profiles")
    .select("agency_plan")
    .eq("id", userId)
    .maybeSingle();

  const { data: tenantRow } = await service
    .from("tenants")
    .select(TENANT_SELECT)
    .eq("owner_id", userId)
    .maybeSingle();

  return agencyWorkspaceAccessFromRows(
    profile?.agency_plan,
    tenantRow as Tenant | null
  );
}

export type AgencyOnlyDashboardDecision =
  | { action: "allow" }
  | { action: "redirect"; target: string };

/** Platform-plan-less users: agency workspace vs pricing vs agency redirect. */
export async function resolveAgencyOnlyDashboardAccess(
  userId: string,
  pathname: string,
  serviceClient?: SupabaseClient
): Promise<AgencyOnlyDashboardDecision> {
  if (isDashboardSettingsPath(pathname)) {
    return { action: "allow" };
  }

  const access = await getAgencyWorkspaceAccess(userId, serviceClient);

  if (!access.hasAgencyWorkspaceAccess) {
    return { action: "redirect", target: "/pricing" };
  }

  if (isAgencyWorkspacePath(pathname)) {
    return { action: "allow" };
  }

  return {
    action: "redirect",
    target: resolveAgencyWorkspaceTarget(access),
  };
}
