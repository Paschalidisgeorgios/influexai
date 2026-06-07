import "server-only";

import type { AccessUser } from "@/lib/access";
import { isAdminAllowlistEmail } from "@/lib/admin-allowlist.server";
import { checkPlatformAdmin } from "@/lib/platform-admin";

/** Authoritative platform-admin check (reads `ADMIN_EMAIL_ALLOWLIST` env). */
export function isPlatformAdminServer(user: AccessUser): boolean {
  return checkPlatformAdmin(user, isAdminAllowlistEmail);
}
