/** Client-safe agency workspace path helpers (no DB access). */

export const AGENCY_WORKSPACE_PREFIXES = [
  "/dashboard/agency",
  "/dashboard/white-label",
] as const;

/** Account settings — reachable without a platform plan (e.g. delete account). */
export const DASHBOARD_SETTINGS_PREFIX = "/dashboard/settings";

export type AgencyWorkspaceAccess = {
  hasAgencyWorkspaceAccess: boolean;
  hasActiveTenant: boolean;
  hasAgencyPlanOnly: boolean;
  /** Active tenant member or owner — may use KI tools with profile credits (no platform plan). */
  hasActiveTenantMembership: boolean;
};

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "/dashboard";
  return path.replace(/\/+$/, "") || "/dashboard";
}

export function isAgencyWorkspacePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return AGENCY_WORKSPACE_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function isDashboardSettingsPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    normalized === DASHBOARD_SETTINGS_PREFIX ||
    normalized.startsWith(`${DASHBOARD_SETTINGS_PREFIX}/`)
  );
}

export function resolveAgencyWorkspaceTarget(
  access: AgencyWorkspaceAccess
): string {
  if (access.hasActiveTenant) {
    return "/dashboard/agency";
  }
  if (access.hasAgencyPlanOnly || access.hasAgencyWorkspaceAccess) {
    return "/dashboard/white-label";
  }
  return "/pricing";
}

const TENANT_GRACE_DAYS = 7;

function tenantInGracePeriod(tenant: {
  is_active: boolean;
  deactivated_at: string | null;
}): boolean {
  if (tenant.is_active) return false;
  if (!tenant.deactivated_at) return false;
  const end = new Date(tenant.deactivated_at);
  end.setDate(end.getDate() + TENANT_GRACE_DAYS);
  return end > new Date();
}

export function isTenantAccessibleForAgency(tenant: {
  is_active: boolean;
  deactivated_at: string | null;
}): boolean {
  return tenant.is_active || tenantInGracePeriod(tenant);
}

/** Build agency access from profile/tenant rows (login client or tests). */
export function agencyWorkspaceAccessFromRows(
  agencyPlan: string | null | undefined,
  tenant: { is_active: boolean; deactivated_at: string | null } | null | undefined
): AgencyWorkspaceAccess {
  const hasAgencyPlan = Boolean(agencyPlan);
  const hasActiveTenant = Boolean(tenant && isTenantAccessibleForAgency(tenant));
  const hasAgencyWorkspaceAccess = hasActiveTenant || hasAgencyPlan;

  return {
    hasAgencyWorkspaceAccess,
    hasActiveTenant,
    hasAgencyPlanOnly: hasAgencyPlan && !hasActiveTenant,
    hasActiveTenantMembership: hasActiveTenant,
  };
}

/** Client-safe: profile linked to an accessible tenant (member or owner). */
export function hasActiveTenantMembershipFromRows(
  tenantId: string | null | undefined,
  tenant: { is_active: boolean; deactivated_at: string | null } | null | undefined
): boolean {
  if (!tenantId || !tenant) return false;
  return isTenantAccessibleForAgency(tenant);
}
