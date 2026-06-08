import "server-only";

import { isAdminAllowlistEmail } from "@/lib/admin-allowlist.server";
import { getAgencyWorkspaceAccess } from "@/lib/agency-access.server";
import {
  logAuthRedirect,
  resolvePostAuthRedirect as resolvePostAuthRedirectBase,
  type PostAuthProfile,
} from "@/lib/auth-redirect";

export { logAuthRedirect };

/** Server-side post-auth redirect (env allowlist + plan + agency gating). */
export async function resolvePostAuthRedirect(
  profile: PostAuthProfile,
  requestedPath?: string | null
): Promise<string> {
  const agencyAccess = profile.id
    ? await getAgencyWorkspaceAccess(profile.id)
    : null;

  return resolvePostAuthRedirectBase(
    profile,
    requestedPath,
    isAdminAllowlistEmail,
    agencyAccess
  );
}
