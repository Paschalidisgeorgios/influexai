import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterStatus } from "@/lib/ki-influencer-config";

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  casting_generation_id: string | null;
  casting_image_url: string | null;
  character_set_id: string | null;
  lora_id: string | null;
  lora_ref: string | null;
  trigger_word: string | null;
  status: CharacterStatus;
  created_at: string;
  updated_at: string;
};

export async function getOwnedCharacter(
  supabase: SupabaseClient,
  characterId: string,
  userId: string
): Promise<CharacterRow | null> {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CharacterRow;
}

export async function updateCharacter(
  supabase: SupabaseClient,
  characterId: string,
  userId: string,
  patch: Partial<
    Omit<CharacterRow, "id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<void> {
  const { error } = await supabase
    .from("characters")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", characterId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function listTrainingSetGenerationIds(
  supabase: SupabaseClient,
  userId: string,
  characterSetId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("generations")
    .select("id, result, created_at")
    .eq("user_id", userId)
    .eq("type", "image")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => {
      const r = row.result as Record<string, unknown> | null;
      return r?.character_set_id === characterSetId;
    })
    .map((row) => row.id as string);
}
