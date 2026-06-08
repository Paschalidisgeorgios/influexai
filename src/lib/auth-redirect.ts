import {
  DEFAULT_ADMIN_EMAIL_ALLOWLIST,
  isEmailInAdminAllowlist,
} from "@/lib/admin-allowlist";
import {
  isAgencyWorkspacePath,
  resolveAgencyWorkspaceTarget,
  type AgencyWorkspaceAccess,
} from "@/lib/agency-access";
import { hasActivePlan, type AccessUser } from "@/lib/access";
import { checkPlatformAdmin } from "@/lib/platform-admin";

const DEFAULT_USER_DESTINATION = "/dashboard";
const DEFAULT_ADMIN_DESTINATION = "/admin";
const NO_PLAN_DESTINATION = "/pricing";

/** Paths users may return to after sign-in (never /admin). */
const ALLOWED_POST_AUTH_PREFIXES = [
  "/dashboard",
  "/pricing",
  "/agency",
  "/join",
  "/onboarding",
  "/community",
] as const;

const BLOCKED_REDIRECT_PREFIXES = ["/auth", "/login", "/signup"] as const;

function normalizeRedirectPath(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? path;
}

/** Dashboard paths require an active plan (admins exempt). */
export function isPlanGatedRedirectPath(path: string): boolean {
  const normalized = normalizeRedirectPath(path);
  return (
    normalized === "/dashboard" || normalized.startsWith("/dashboard/")
  );
}

/**
 * Validates post-auth redirect targets. Blocks admin routes, auth loops, and open redirects.
 */
export function sanitizeAuthRedirect(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || trimmed.includes("@")) return null;

  const normalized = normalizeRedirectPath(trimmed);
  if (
    normalized === "/admin" ||
    normalized.startsWith("/admin/") ||
    normalized.startsWith("/dashboard/admin")
  ) {
    return null;
  }

  if (
    BLOCKED_REDIRECT_PREFIXES.some(
      (prefix) =>
        normalized === prefix || normalized.startsWith(`${prefix}/`)
    )
  ) {
    return null;
  }

  const allowed = ALLOWED_POST_AUTH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
  if (!allowed && normalized !== "/") return null;

  return trimmed;
}

export type PostAuthProfile = AccessUser & {
  email?: string | null;
  id?: string | null;
};

type AllowlistChecker = (email: string | null | undefined) => boolean;

function resolveAgencyWorkspaceRedirect(
  safe: string,
  agencyAccess: AgencyWorkspaceAccess
): string {
  const normalized = normalizeRedirectPath(safe);
  if (
    normalized === "/dashboard/agency" &&
    agencyAccess.hasAgencyPlanOnly
  ) {
    return "/dashboard/white-label";
  }
  return safe;
}

/**
 * After login / email confirmation: admins → /admin; users with plan → requested or /dashboard;
 * agency-only users → agency workspace; others without plan → /pricing.
 */
export function resolvePostAuthRedirect(
  profile: PostAuthProfile,
  requestedPath?: string | null,
  isAllowlistedEmail: AllowlistChecker = (email) =>
    isEmailInAdminAllowlist(email, DEFAULT_ADMIN_EMAIL_ALLOWLIST),
  agencyAccess?: AgencyWorkspaceAccess | null
): string {
  const safe = sanitizeAuthRedirect(requestedPath);

  if (checkPlatformAdmin(profile, isAllowlistedEmail)) {
    return safe ?? DEFAULT_ADMIN_DESTINATION;
  }

  if (hasActivePlan(profile)) {
    if (safe) return safe;
    return DEFAULT_USER_DESTINATION;
  }

  if (safe && isAgencyWorkspacePath(safe)) {
    if (agencyAccess?.hasAgencyWorkspaceAccess) {
      return resolveAgencyWorkspaceRedirect(safe, agencyAccess);
    }
    return NO_PLAN_DESTINATION;
  }

  if (safe && isPlanGatedRedirectPath(safe)) {
    if (agencyAccess?.hasAgencyWorkspaceAccess) {
      return resolveAgencyWorkspaceTarget(agencyAccess);
    }
    return NO_PLAN_DESTINATION;
  }

  if (safe) {
    return safe;
  }

  if (agencyAccess?.hasAgencyWorkspaceAccess) {
    return resolveAgencyWorkspaceTarget(agencyAccess);
  }

  return NO_PLAN_DESTINATION;
}

export function logAuthRedirect(payload: {
  userId: string;
  role?: string | null;
  target: string;
  source: string;
}): void {
  console.log("[auth redirect]", payload);
}
