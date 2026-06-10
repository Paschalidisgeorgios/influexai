import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnthropicMessage, parseClaudeJson } from "@/lib/anthropic";

const EXTRACT_MODEL = "claude-sonnet-4-5-20250929";

export type CreatorProfile = {
  nische?: string;
  zielgruppe?: string;
  tonalitaet?: string;
  plattformen?: string[];
  produkte?: string[];
  notizen?: Record<string, unknown>;
};

const EXTRACT_SYSTEM = `Extrahiere NUR explizit vom Nutzer genannte, dauerhafte Fakten als JSON-Partial.
Felder: nische, zielgruppe, tonalitaet, plattformen (string[]), produkte (string[]).
Wenn nichts Neues genannt wurde: {}.
Antworte NUR JSON ohne Markdown.`;

export async function getCreatorProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<CreatorProfile | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select("nische, zielgruppe, tonalitaet, plattformen, produkte, notizen")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[creatorMemory] get:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    nische: data.nische ?? undefined,
    zielgruppe: data.zielgruppe ?? undefined,
    tonalitaet: data.tonalitaet ?? undefined,
    plattformen: data.plattformen ?? undefined,
    produkte: data.produkte ?? undefined,
    notizen: (data.notizen as Record<string, unknown>) ?? undefined,
  };
}

function mergeArrays(existing?: string[], incoming?: string[]): string[] | undefined {
  if (!incoming?.length) return existing;
  const base = existing ?? [];
  const merged = [...base];
  for (const item of incoming) {
    const trimmed = item.trim();
    if (trimmed && !merged.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      merged.push(trimmed);
    }
  }
  return merged;
}

export async function updateCreatorProfile(
  supabase: SupabaseClient,
  userId: string,
  partial: Partial<CreatorProfile>
): Promise<void> {
  const existing = (await getCreatorProfile(supabase, userId)) ?? {};

  const merged: CreatorProfile = {
    nische: partial.nische?.trim() || existing.nische,
    zielgruppe: partial.zielgruppe?.trim() || existing.zielgruppe,
    tonalitaet: partial.tonalitaet?.trim() || existing.tonalitaet,
    plattformen: mergeArrays(existing.plattformen, partial.plattformen),
    produkte: mergeArrays(existing.produkte, partial.produkte),
    notizen: {
      ...(existing.notizen ?? {}),
      ...(partial.notizen ?? {}),
    },
  };

  const hasData =
    merged.nische ||
    merged.zielgruppe ||
    merged.tonalitaet ||
    (merged.plattformen?.length ?? 0) > 0 ||
    (merged.produkte?.length ?? 0) > 0 ||
    Object.keys(merged.notizen ?? {}).length > 0;

  if (!hasData && !partial.nische && !partial.zielgruppe) return;

  const { error } = await supabase.from("creator_profiles").upsert({
    user_id: userId,
    nische: merged.nische ?? null,
    zielgruppe: merged.zielgruppe ?? null,
    tonalitaet: merged.tonalitaet ?? null,
    plattformen: merged.plattformen ?? [],
    produkte: merged.produkte ?? [],
    notizen: merged.notizen ?? {},
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[creatorMemory] update:", error.message);
  }
}

export async function resetCreatorProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("creator_profiles")
    .delete()
    .eq("user_id", userId);
  if (error) console.error("[creatorMemory] reset:", error.message);
}

export function formatCreatorProfileForPrompt(
  profile: CreatorProfile | null
): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.nische) parts.push(`Nische: ${profile.nische}`);
  if (profile.zielgruppe) parts.push(`Zielgruppe: ${profile.zielgruppe}`);
  if (profile.tonalitaet) parts.push(`Tonalität: ${profile.tonalitaet}`);
  if (profile.plattformen?.length)
    parts.push(`Plattformen: ${profile.plattformen.join(", ")}`);
  if (profile.produkte?.length)
    parts.push(`Produkte: ${profile.produkte.join(", ")}`);
  if (!parts.length) return "";
  return `Das weißt du über diesen Creator:\n${parts.join("\n")}`;
}

export async function extractCreatorFactsFromChat(
  userMessage: string,
  assistantReply: string
): Promise<Partial<CreatorProfile>> {
  const user = `Nutzer:\n${userMessage.slice(-1500)}\n\nAssistent:\n${assistantReply.slice(-1500)}`;

  const result = await createAnthropicMessage({
    model: EXTRACT_MODEL,
    maxTokens: 300,
    system: EXTRACT_SYSTEM,
    user,
  });

  if (!result.ok) return {};

  try {
    const parsed = parseClaudeJson<Partial<CreatorProfile>>(result.text);
    return parsed ?? {};
  } catch {
    return {};
  }
}
