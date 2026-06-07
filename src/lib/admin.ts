import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/admin";

export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  if (!(await isAdminUser())) {
    return { ok: false, error: "Kein Admin-Zugriff." };
  }

  return { ok: true, userId: user.id };
}
