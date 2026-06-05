import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseGenerationAssetResult,
  type GenerationAssetResult,
} from "@/lib/generation-asset-types";
import type { LiveCreatorCharacter } from "@/lib/live-creator-config";

export async function resolveUserKiIchCharacter(
  supabase: SupabaseClient,
  userId: string
): Promise<LiveCreatorCharacter | null> {
  const { data } = await supabase
    .from("generations")
    .select("id, result")
    .eq("user_id", userId)
    .eq("type", "ki-ich")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) return null;

  const asset = parseGenerationAssetResult(data.result);
  if (!asset) return null;

  const variant = asset.finalPath && asset.downloadPaid ? "final" : "preview";
  return {
    id: `ki-ich-${data.id}`,
    name: "Mein KI-Ich",
    imageUrl: `/api/generated-image/${data.id}?variant=${variant}`,
    kind: "ki-ich",
  };
}

export function generationAssetFromRow(
  row: { id: string; result: unknown }
): GenerationAssetResult | null {
  return parseGenerationAssetResult(row.result);
}
