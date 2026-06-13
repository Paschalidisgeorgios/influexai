import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

export type OAuthProvider = "google";

export function buildOAuthCallbackUrl(redirectPath?: string | null): string {
  if (typeof window === "undefined") return "/auth/callback";
  const safe = sanitizeAuthRedirect(redirectPath);
  const next = safe ? `?next=${encodeURIComponent(safe)}` : "";
  return `${window.location.origin}/auth/callback${next}`;
}

export async function signInWithOAuthProvider(
  supabase: SupabaseClient,
  provider: OAuthProvider,
  redirectPath?: string | null
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: buildOAuthCallbackUrl(redirectPath),
    },
  });
}
