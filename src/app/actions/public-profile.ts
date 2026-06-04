"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isValidUsername, normalizeUsername } from "@/lib/creator-profile";

const MAX_BIO = 160;
const MAX_PINS = 3;

export type PublicProfileSettings = {
  isPublic: boolean;
  username: string | null;
  bio: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
  fullName: string | null;
  creatorNiche: string | null;
  subscriberCount: string | null;
};

export type GenerationRow = {
  id: string;
  type: string;
  prompt: string;
  created_at: string;
  is_pinned: boolean;
};

export async function getPublicProfileSettings(): Promise<
  PublicProfileSettings | { error: string }
> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "is_public, username, bio, youtube_url, tiktok_url, instagram_url, full_name, creator_niche, subscriber_count"
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return { error: "Profil nicht gefunden." };

  return {
    isPublic: data.is_public ?? false,
    username: data.username,
    bio: data.bio,
    youtubeUrl: data.youtube_url,
    tiktokUrl: data.tiktok_url,
    instagramUrl: data.instagram_url,
    fullName: data.full_name,
    creatorNiche: data.creator_niche,
    subscriberCount: data.subscriber_count,
  };
}

export async function checkUsernameAvailable(
  username: string
): Promise<{ available: boolean; error?: string }> {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return { available: false, error: "Ungültiger Username." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { available: false, error: "Nicht eingeloggt." };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  if (existing && existing.id !== user.id) {
    return { available: false };
  }
  return { available: true };
}

export async function savePublicProfile(input: {
  isPublic: boolean;
  username: string;
  bio: string;
  youtubeUrl: string;
  tiktokUrl: string;
  instagramUrl: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const username = normalizeUsername(input.username);
  const bio = input.bio.trim().slice(0, MAX_BIO);

  if (input.isPublic) {
    if (!username) {
      return {
        success: false,
        error: "Username ist erforderlich für ein öffentliches Profil.",
      };
    }
    if (!isValidUsername(username)) {
      return {
        success: false,
        error:
          "Username: 3–30 Zeichen, nur Kleinbuchstaben, Zahlen und Unterstrich.",
      };
    }

    const avail = await checkUsernameAvailable(username);
    if (!avail.available) {
      return {
        success: false,
        error: avail.error ?? "Username ist bereits vergeben.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_public: input.isPublic,
      username: username || null,
      bio: bio || null,
      youtube_url: input.youtubeUrl.trim() || null,
      tiktok_url: input.tiktokUrl.trim() || null,
      instagram_url: input.instagramUrl.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Username ist bereits vergeben." };
    }
    console.error("savePublicProfile:", error.message);
    return { success: false, error: "Speichern fehlgeschlagen." };
  }

  return { success: true };
}

export async function listMyGenerationsForShowcase(): Promise<GenerationRow[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("generations")
    .select("id, type, prompt, created_at, is_pinned")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []) as GenerationRow[];
}

export async function setGenerationPinned(
  generationId: string,
  pinned: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  if (pinned) {
    const { count } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_pinned", true);

    const { data: current } = await supabase
      .from("generations")
      .select("is_pinned")
      .eq("id", generationId)
      .eq("user_id", user.id)
      .single();

    const alreadyPinned = current?.is_pinned;
    if (!alreadyPinned && (count ?? 0) >= MAX_PINS) {
      return { success: false, error: "Maximal 3 Showcase-Einträge erlaubt." };
    }
  }

  const { error } = await supabase
    .from("generations")
    .update({ is_pinned: pinned })
    .eq("id", generationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Pin konnte nicht gespeichert werden." };
  }
  return { success: true };
}

export type PublicCreatorView = {
  username: string;
  fullName: string | null;
  isBeta: boolean;
  bio: string | null;
  creatorNiche: string | null;
  subscriberCount: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
  createdAt: string;
  generationCount: number;
  pinned: { id: string; type: string; prompt: string }[];
};

export async function fetchPublicCreatorByUsername(
  username: string
): Promise<PublicCreatorView | null> {
  const normalized = normalizeUsername(username);
  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch {
    const client = await createServerSupabaseClient();
    supabase = client as ReturnType<typeof createServiceSupabaseClient>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, creator_niche, subscriber_count, youtube_url, tiktok_url, instagram_url, created_at, is_public, is_beta"
    )
    .eq("username", normalized)
    .eq("is_public", true)
    .maybeSingle();

  if (!profile?.username) return null;

  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const { data: pinned } = await supabase
    .from("generations")
    .select("id, type, prompt")
    .eq("user_id", profile.id)
    .eq("is_pinned", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return {
    username: profile.username,
    fullName: profile.full_name,
    isBeta: profile.is_beta ?? false,
    bio: profile.bio,
    creatorNiche: profile.creator_niche,
    subscriberCount: profile.subscriber_count,
    youtubeUrl: profile.youtube_url,
    tiktokUrl: profile.tiktok_url,
    instagramUrl: profile.instagram_url,
    createdAt: profile.created_at,
    generationCount: count ?? 0,
    pinned: pinned ?? [],
  };
}

export async function listPublicProfileUsernames(): Promise<string[]> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("is_public", true)
      .not("username", "is", null);
    return (data ?? []).map((r) => r.username as string).filter(Boolean);
  } catch {
    return [];
  }
}
