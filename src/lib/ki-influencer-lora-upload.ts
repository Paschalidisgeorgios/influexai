import type { SupabaseClient } from "@supabase/supabase-js";
import { fal } from "@fal-ai/client";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { downloadStorageObject, GENERATED_ASSETS_BUCKET } from "@/lib/generation-assets";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import { getOwnedGeneration } from "@/lib/generation-assets";
import { LORA_STORAGE_BUCKET } from "@/lib/lora-config";
import { buildImagesZip } from "@/lib/lora-zip";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

/** Build fal.storage ZIP from owned gallery generation IDs (source image preferred). */
export async function buildLoraZipFromGenerationIds(
  supabase: SupabaseClient,
  userId: string,
  generationIds: string[],
  sessionId: string
): Promise<{
  zipUrl: string;
  thumbnailPath: string;
  imageCount: number;
}> {
  if (generationIds.length < 10) {
    throw new Error("Mindestens 10 Trainingsbilder erforderlich.");
  }

  configureFalClient();
  if (!getFalKey()) {
    throw new Error("LoRA-Training ist nicht konfiguriert.");
  }

  const service = createServiceSupabaseClient();
  const zipInputs: { filename: string; buffer: Buffer }[] = [];
  let thumbnailPath = "";

  for (let i = 0; i < generationIds.length; i++) {
    const row = await getOwnedGeneration(supabase, generationIds[i], userId);
    if (!row) {
      throw new Error(`Trainingsbild nicht gefunden: ${generationIds[i]}`);
    }
    const asset = row.asset ?? parseGenerationAssetResult(row.result);
    const storagePath =
      asset?.sourcePath ?? asset?.finalPath ?? asset?.previewPath;
    if (!storagePath) {
      throw new Error(`Keine Bilddatei für Generierung ${generationIds[i]}`);
    }

    const { data, contentType } = await downloadStorageObject(storagePath);
    const buffer = Buffer.from(await data.arrayBuffer());
    const ext = extFromContentType(contentType);
    const filename = `image_${String(i + 1).padStart(3, "0")}.${ext}`;
    const loraStoragePath = `${userId}/${sessionId}/${filename}`;

    const { error: uploadErr } = await service.storage
      .from(LORA_STORAGE_BUCKET)
      .upload(loraStoragePath, buffer, {
        contentType: contentType || "image/jpeg",
        upsert: true,
      });
    if (uploadErr) {
      throw new Error(`Upload fehlgeschlagen: ${uploadErr.message}`);
    }

    if (i === 0) thumbnailPath = loraStoragePath;
    zipInputs.push({ filename, buffer });
  }

  const zipBuffer = await buildImagesZip(zipInputs);
  const zipBlob = new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" });
  const zipFile = new File([zipBlob], `ki-influencer-${sessionId}.zip`, {
    type: "application/zip",
  });
  const zipUrl = await fal.storage.upload(zipFile);

  const zipStoragePath = `${userId}/${sessionId}/training.zip`;
  await service.storage.from(LORA_STORAGE_BUCKET).upload(zipStoragePath, zipBuffer, {
    contentType: "application/zip",
    upsert: true,
  });

  return { zipUrl, thumbnailPath, imageCount: zipInputs.length };
}

export function generationStoragePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(GENERATED_ASSETS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
