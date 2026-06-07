import type { AccessUser } from "@/lib/access";

/**
 * Platform admin panel access only.
 * Agency tenant_role (owner/admin/member), subscription plan, and billing do NOT grant /admin.
 */
export function checkPlatformAdmin(
  user: AccessUser,
  isAllowlistedEmail: (email: string | null | undefined) => boolean
): boolean {
  if (user.is_admin === true) return true;

  const role = (user.role ?? "user").trim().toLowerCase();
  if (role === "admin") return true;
  if (role === "owner") return false;

  return isAllowlistedEmail(user.email);
}
