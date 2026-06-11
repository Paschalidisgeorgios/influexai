import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseRelationMissingError } from "@/lib/ki-influencer-supabase-errors";

/** Columns on `characters` after migration 060. */
const CHARACTERS_PROBE =
  "id, user_id, name, description, source, lora_id, status, created_at, updated_at";

/** Columns on `creator_profiles` after migration 062. */
const CREATOR_PROFILES_PROBE =
  "user_id, nische, zielgruppe, tonalitaet, plattformen, updated_at";

export type KiInfluencerSchemaStatus = {
  ready: boolean;
  missing: string[];
};

async function probeTable(
  supabase: SupabaseClient,
  table: string,
  columns: string
): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .select(columns, { head: true, count: "exact" });

  if (!error) return true;
  if (isSupabaseRelationMissingError(error)) return false;

  console.warn(`[ki-influencer] ${table} schema probe:`, error.message);
  return true;
}

export async function checkKiInfluencerWizardSchema(
  supabase: SupabaseClient
): Promise<KiInfluencerSchemaStatus> {
  const missing: string[] = [];

  const charactersOk = await probeTable(
    supabase,
    "characters",
    CHARACTERS_PROBE
  );
  if (!charactersOk) missing.push("characters");

  const creatorProfilesOk = await probeTable(
    supabase,
    "creator_profiles",
    CREATOR_PROFILES_PROBE
  );
  if (!creatorProfilesOk) missing.push("creator_profiles");

  return { ready: missing.length === 0, missing };
}
