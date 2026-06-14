"use client";

import { useEffect, useState } from "react";

export type KiInfluencerCharacterOption = {
  id: string;
  name: string;
  status: string;
  trigger_word: string | null;
  casting_image_url: string | null;
  updated_at: string;
};

type CharactersResponse = {
  success?: boolean;
  characters?: KiInfluencerCharacterOption[];
  error?: string;
};

export function useKiInfluencerCharacters() {
  const [characters, setCharacters] = useState<KiInfluencerCharacterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/ki-influencer/characters");
        const data = (await res.json()) as CharactersResponse;
        if (!res.ok) {
          throw new Error(data.error ?? "Charaktere konnten nicht geladen werden");
        }
        if (!cancelled) {
          setCharacters(Array.isArray(data.characters) ? data.characters : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCharacters([]);
          setError(
            err instanceof Error ? err.message : "Charaktere konnten nicht geladen werden"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { characters, loading, error };
}
