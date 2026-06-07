import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";

export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  if (
    !isPlatformAdminServer({
      email: user.email,
      is_admin: profile?.is_admin,
      role: profile?.role,
    })
  ) {
    return { ok: false, error: "Kein Admin-Zugriff." };
  }

  return { ok: true, userId: user.id };
}
