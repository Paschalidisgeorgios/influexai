import type { User } from "@supabase/supabase-js";

export type ProfileNameFields = {
  username?: string | null;
  full_name?: string | null;
};

function firstWord(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name.trim();
}

/**
 * Dashboard greeting name — priority: username → full_name → OAuth metadata → email → Creator
 */
export function resolveDashboardDisplayName(
  user: User,
  profile: ProfileNameFields | null | undefined
): string {
  const username = profile?.username?.trim();
  if (username) return username;

  const fullName = profile?.full_name?.trim();
  if (fullName) return firstWord(fullName);

  const meta = user.user_metadata as {
    full_name?: string;
    name?: string;
  } | null;

  const oauthFull = meta?.full_name?.trim();
  if (oauthFull) return firstWord(oauthFull);

  const oauthName = meta?.name?.trim();
  if (oauthName) return firstWord(oauthName);

  const email = user.email?.trim();
  if (email) {
    const prefix = email.split("@")[0]?.trim();
    if (prefix) return prefix;
  }

  return "Creator";
}
