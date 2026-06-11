"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CreatorProfile } from "@/lib/agent/creatorMemory";

export type CreatorProfileState = {
  profile: CreatorProfile | null;
  loading: boolean;
  profileLabel: string | null;
};

function buildProfileLabel(profile: CreatorProfile | null): string | null {
  if (!profile) return null;
  const parts: string[] = [];
  if (profile.nische) parts.push(profile.nische);
  if (profile.plattformen?.[0]) parts.push(profile.plattformen[0]);
  if (profile.tonalitaet) parts.push(profile.tonalitaet);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function useCreatorProfile(): CreatorProfileState & {
  refresh: () => void;
} {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("creator_profiles")
      .select("nische, zielgruppe, tonalitaet, plattformen, produkte, notizen")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile({
      nische: data.nische ?? undefined,
      zielgruppe: data.zielgruppe ?? undefined,
      tonalitaet: data.tonalitaet ?? undefined,
      plattformen: data.plattformen ?? undefined,
      produkte: data.produkte ?? undefined,
      notizen: (data.notizen as Record<string, unknown>) ?? undefined,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    profile,
    loading,
    profileLabel: buildProfileLabel(profile),
    refresh: load,
  };
}
