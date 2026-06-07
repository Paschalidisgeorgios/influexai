import "server-only";

import {
  isEmailInAdminAllowlist,
  parseAdminEmailAllowlist,
} from "@/lib/admin-allowlist";

export function getAdminEmailAllowlist(): readonly string[] {
  return parseAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
}

export function isAdminAllowlistEmail(
  email: string | null | undefined
): boolean {
  return isEmailInAdminAllowlist(email, getAdminEmailAllowlist());
}
