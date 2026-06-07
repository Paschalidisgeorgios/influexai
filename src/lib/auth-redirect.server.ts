import "server-only";

import { isAdminAllowlistEmail } from "@/lib/admin-allowlist.server";
import {
  logAuthRedirect,
  resolvePostAuthRedirect as resolvePostAuthRedirectBase,
  type PostAuthProfile,
} from "@/lib/auth-redirect";

export { logAuthRedirect };

/** Server-side post-auth redirect (env allowlist + plan gating). */
export function resolvePostAuthRedirect(
  profile: PostAuthProfile,
  requestedPath?: string | null
): string {
  return resolvePostAuthRedirectBase(profile, requestedPath, isAdminAllowlistEmail);
}
