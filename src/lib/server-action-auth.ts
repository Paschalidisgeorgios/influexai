import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Ensures the caller's session matches the target user (prevents server-action IDOR). */
export async function assertSessionUserId(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht eingeloggt." };
  }
  if (user.id !== userId) {
    return { ok: false, error: "Zugriff verweigert." };
  }
  return { ok: true };
}
