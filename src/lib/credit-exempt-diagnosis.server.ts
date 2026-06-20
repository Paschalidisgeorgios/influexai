import "server-only";

import { isAdminAllowlistEmail } from "@/lib/admin-allowlist.server";

export type CreditExemptReason =
  | "is_admin"
  | "admin_role"
  | "email_allowlist"
  | null;

/** Profile + email check including ADMIN_EMAIL_ALLOWLIST (server env). */
export function isCreditExemptProfile(input: {
  email: string | null | undefined;
  is_admin?: boolean | null;
  role?: string | null;
}): { exempt: boolean; reason: CreditExemptReason } {
  if (input.is_admin === true) {
    return { exempt: true, reason: "is_admin" };
  }
  const role = (input.role ?? "user").trim().toLowerCase();
  if (role === "admin") {
    return { exempt: true, reason: "admin_role" };
  }
  if (isAdminAllowlistEmail(input.email)) {
    return { exempt: true, reason: "email_allowlist" };
  }
  return { exempt: false, reason: null };
}
