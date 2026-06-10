import type { SupabaseClient } from "@supabase/supabase-js";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import {
  GENERATED_ASSETS_BUCKET,
  getOwnedGeneration,
} from "@/lib/generation-assets";
import { isImageGenerationType } from "@/lib/gallery-media";

const MAX_REFERENCE_IMAGES = 14;

export function getReferenceImageLimit(): number {
  return MAX_REFERENCE_IMAGES;
}

function storagePathToPublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(GENERATED_ASSETS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Resolve owned gallery generation IDs to public Supabase Storage URLs (source preferred). */
export async function resolveReferenceImageUrls(
  supabase: SupabaseClient,
  userId: string,
  referenceImageIds: string[]
): Promise<string[]> {
  const uniqueIds = [...new Set(referenceImageIds.map((id) => id.trim()).filter(Boolean))];

  if (uniqueIds.length === 0) {
    throw new Error("Mindestens ein Referenzbild erforderlich.");
  }
  if (uniqueIds.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`Maximal ${MAX_REFERENCE_IMAGES} Referenzbilder erlaubt.`);
  }

  const urls: string[] = [];

  for (const generationId of uniqueIds) {
    const row = await getOwnedGeneration(supabase, generationId, userId);
    if (!row) {
      throw new Error(`Referenzbild nicht gefunden: ${generationId}`);
    }
    if (!isImageGenerationType(row.type)) {
      throw new Error("Referenz muss ein Bild aus der Gallery sein.");
    }

    const asset = row.asset ?? parseGenerationAssetResult(row.result);
    const storagePath =
      asset?.sourcePath ?? asset?.finalPath ?? asset?.previewPath ?? asset?.upscaledPath;

    if (!storagePath) {
      throw new Error(`Referenzbild ohne Datei: ${generationId}`);
    }

    urls.push(storagePathToPublicUrl(supabase, storagePath));
  }

  return urls;
}
