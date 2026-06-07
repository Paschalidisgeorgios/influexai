import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";

/** Server-side platform admin check (allowlist env + profile flags). */
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  return isPlatformAdminServer({
    email: user.email,
    is_admin: profile?.is_admin,
    role: profile?.role,
  });
}

/** Throws when the session is not a platform admin. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminUser())) {
    throw new Error("Unauthorized");
  }
}
