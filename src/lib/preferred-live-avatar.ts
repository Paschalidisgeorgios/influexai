import type { SupabaseClient } from "@supabase/supabase-js";
import type { StreamingAvatarItem } from "@/lib/akool-live-avatar";

const CUSTOM_AVATAR_NAME = /custom|clone|ki-ich|personal|my\s/i;

/**
 * Prefer the user's custom Akool avatar when they have used KI-Ich,
 * otherwise the configured default or the first available avatar.
 */
export async function resolvePreferredLiveAvatarId(
  supabase: SupabaseClient,
  userId: string,
  avatars: StreamingAvatarItem[]
): Promise<string | undefined> {
  if (!avatars.length) return undefined;

  const envDefault = process.env.AKOOL_DEFAULT_AVATAR_ID?.trim();
  if (envDefault && avatars.some((a) => a.avatar_id === envDefault)) {
    return envDefault;
  }

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "ki-ich");

  const hasKiIch = (count ?? 0) > 0;
  if (hasKiIch) {
    const named = avatars.find((a) => CUSTOM_AVATAR_NAME.test(a.name));
    if (named) return named.avatar_id;
    if (avatars.length > 1) {
      return avatars[avatars.length - 1].avatar_id;
    }
  }

  return avatars[0]?.avatar_id;
}
