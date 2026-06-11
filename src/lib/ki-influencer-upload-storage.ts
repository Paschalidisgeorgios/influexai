import "server-only";

import { fal } from "@fal-ai/client";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { LORA_STORAGE_BUCKET } from "@/lib/lora-config";
import { buildImagesZip } from "@/lib/lora-zip";

const IMAGE_NAME_RE = /^image_\d{3}\.(jpg|jpeg|png|webp)$/i;

export async function buildTrainingZipFromStorageSession(params: {
  userId: string;
  sessionId: string;
}): Promise<{ zipUrl: string; imageCount: number; thumbnailPath: string | null }> {
  if (!getFalKey()) {
    throw new Error("LoRA training is not configured.");
  }

  const service = createServiceSupabaseClient();
  const prefix = `${params.userId}/${params.sessionId}`;

  const { data: listed, error: listErr } = await service.storage
    .from(LORA_STORAGE_BUCKET)
    .list(prefix, { limit: 100, sortBy: { column: "name", order: "asc" } });

  if (listErr) {
    throw new Error(listErr.message);
  }

  const imageFiles = (listed ?? []).filter(
    (f) => f.name && IMAGE_NAME_RE.test(f.name)
  );

  if (imageFiles.length < 10) {
    throw new Error(
      `Nur ${imageFiles.length} Fotos in Storage gefunden — mindestens 10 erforderlich.`
    );
  }

  const zipInputs: { filename: string; buffer: Buffer }[] = [];
  let thumbnailPath: string | null = null;

  for (let i = 0; i < imageFiles.length; i++) {
    const name = imageFiles[i]!.name!;
    const storagePath = `${prefix}/${name}`;
    const { data: blob, error: dlErr } = await service.storage
      .from(LORA_STORAGE_BUCKET)
      .download(storagePath);

    if (dlErr || !blob) {
      throw new Error(`Download fehlgeschlagen: ${name}`);
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    if (i === 0) thumbnailPath = storagePath;
    zipInputs.push({ filename: name, buffer });
  }

  const zipBuffer = await buildImagesZip(zipInputs);

  configureFalClient();
  const zipBlob = new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" });
  const zipFile = new File([zipBlob], `lora-${params.sessionId}.zip`, {
    type: "application/zip",
  });
  const zipUrl = await fal.storage.upload(zipFile);

  const zipStoragePath = `${prefix}/training.zip`;
  await service.storage.from(LORA_STORAGE_BUCKET).upload(zipStoragePath, zipBuffer, {
    contentType: "application/zip",
    upsert: true,
  });

  return { zipUrl, imageCount: imageFiles.length, thumbnailPath };
}
