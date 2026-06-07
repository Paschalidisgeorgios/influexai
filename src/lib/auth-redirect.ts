import { isPlatformAdmin, type AccessUser } from "@/lib/access";

const DEFAULT_USER_DESTINATION = "/dashboard";
const DEFAULT_ADMIN_DESTINATION = "/admin";

/** Paths users may return to after sign-in (never /admin). */
const ALLOWED_POST_AUTH_PREFIXES = [
  "/dashboard",
  "/pricing",
  "/agency",
  "/join",
  "/onboarding",
  "/community",
] as const;

/**
 * Validates post-auth redirect targets. Blocks admin routes and open redirects.
 */
export function sanitizeAuthRedirect(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || trimmed.includes("@")) return null;

  const normalized = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
  if (
    normalized === "/admin" ||
    normalized.startsWith("/admin/") ||
    normalized.startsWith("/dashboard/admin")
  ) {
    return null;
  }

  const allowed = ALLOWED_POST_AUTH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
  if (!allowed && normalized !== "/") return null;

  return trimmed;
}

export type PostAuthProfile = AccessUser & { email?: string | null };

/**
 * After login / email confirmation: admins → /admin (unless safe deep link);
 * normal users → /dashboard (never /admin).
 */
export function resolvePostAuthRedirect(
  profile: PostAuthProfile,
  requestedPath?: string | null
): string {
  const safe = sanitizeAuthRedirect(requestedPath);

  if (isPlatformAdmin(profile)) {
    return safe ?? DEFAULT_ADMIN_DESTINATION;
  }

  return safe ?? DEFAULT_USER_DESTINATION;
}

export function logAuthRedirect(payload: {
  userId: string;
  role?: string | null;
  target: string;
  source: string;
}): void {
  console.log("[auth redirect]", payload);
}
