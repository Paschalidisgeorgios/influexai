import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  parseGenerationAssetResult,
  type GenerationAssetResult,
} from "@/lib/generation-asset-types";
import {
  buildFinalStorageBuffer,
  buildProtectedPreviewBuffer,
  fetchImageBuffer,
} from "@/lib/generated-image-process";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { parseAudioDataUrl } from "@/lib/upload-audio-fal";
import { GenerationSaveError } from "@/lib/generation-save-errors";

export const GENERATED_ASSETS_BUCKET = "generated-assets";

export function previewStoragePath(userId: string, generationId: string): string {
  return `${userId}/${generationId}/preview.jpg`;
}

export function finalStoragePath(userId: string, generationId: string): string {
  return `${userId}/${generationId}/final.jpg`;
}

export function sourceStoragePath(userId: string, generationId: string): string {
  return `${userId}/${generationId}/source.jpg`;
}

export function upscaledStoragePath(userId: string, generationId: string): string {
  return `${userId}/${generationId}/upscaled.jpg`;
}

export function finalVideoStoragePath(
  userId: string,
  generationId: string
): string {
  return `${userId}/${generationId}/final.mp4`;
}

export function audioStoragePath(userId: string, generationId: string): string {
  return `${userId}/${generationId}/final.mp3`;
}

export async function createGenerationRecord(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  result: GenerationAssetResult,
  creditsUsed = 0,
  prompt = "",
  generationId?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("generations")
    .insert({
      ...(generationId ? { id: generationId } : {}),
      user_id: userId,
      type,
      prompt: prompt.slice(0, 500),
      credits_used: creditsUsed,
      result,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("DB INSERT FEHLER:", {
      error: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      table: "generations",
      userId,
      type,
      saveErrorCode: error ? new GenerationSaveError(error).details.code : undefined,
    });
    throw new GenerationSaveError(error);
  }
  return data.id as string;
}

export async function updateGenerationResult(
  supabase: SupabaseClient,
  generationId: string,
  userId: string,
  patch: Partial<GenerationAssetResult> & { credits_used?: number }
): Promise<void> {
  const { credits_used, ...resultPatch } = patch;

  const { data: row, error: fetchErr } = await supabase
    .from("generations")
    .select("result, credits_used")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !row) {
    throw new Error("Generierung nicht gefunden.");
  }

  const current = parseGenerationAssetResult(row.result) ?? { paid: false };
  const next: GenerationAssetResult = { ...current, ...resultPatch };

  const updatePayload: Record<string, unknown> = { result: next };
  if (typeof credits_used === "number") {
    updatePayload.credits_used = credits_used;
  }

  const { error } = await supabase
    .from("generations")
    .update(updatePayload)
    .eq("id", generationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Generierung konnte nicht aktualisiert werden.");
  }
}

export async function uploadToGeneratedAssets(
  storagePath: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const service = createServiceSupabaseClient();
  const { error } = await service.storage
    .from(GENERATED_ASSETS_BUCKET)
    .upload(storagePath, body, {
      contentType,
      upsert: true,
      cacheControl: "private, max-age=3600",
    });

  if (error) {
    throw new Error(`Storage-Upload fehlgeschlagen: ${error.message}`);
  }
}

export async function ingestImageGeneratorAssets(
  userId: string,
  generationId: string,
  sourceUrl: string
): Promise<{ previewPath: string; sourcePath: string; width?: number; height?: number }> {
  const raw = await fetchImageBuffer(sourceUrl);
  const meta = await sharp(raw).metadata();
  const sourcePath = sourceStoragePath(userId, generationId);
  const finalBuf = await buildFinalStorageBuffer(raw);
  await uploadToGeneratedAssets(sourcePath, finalBuf, "image/jpeg");

  const preview = await buildProtectedPreviewBuffer(raw);
  const previewPath = previewStoragePath(userId, generationId);
  await uploadToGeneratedAssets(previewPath, preview, "image/jpeg");

  return {
    previewPath,
    sourcePath,
    width: meta.width,
    height: meta.height,
  };
}

export async function ingestAudioFromDataUrl(
  userId: string,
  generationId: string,
  audioDataUrl: string
): Promise<string> {
  const { buffer, mimeType } = parseAudioDataUrl(audioDataUrl);
  const path = audioStoragePath(userId, generationId);
  await uploadToGeneratedAssets(path, buffer, mimeType || "audio/mpeg");
  return path;
}

export async function ingestPreviewFromUrl(
  userId: string,
  generationId: string,
  sourceUrl: string
): Promise<string> {
  const { previewPath } = await ingestImageGeneratorAssets(
    userId,
    generationId,
    sourceUrl
  );
  return previewPath;
}

export async function ingestUpscaledFromUrl(
  userId: string,
  generationId: string,
  sourceUrl: string
): Promise<string> {
  const raw = await fetchImageBuffer(sourceUrl);
  const buf = await buildFinalStorageBuffer(raw);
  const path = upscaledStoragePath(userId, generationId);
  await uploadToGeneratedAssets(path, buf, "image/jpeg");
  return path;
}

export async function unlockDownloadFromSource(
  userId: string,
  generationId: string
): Promise<string> {
  const service = createServiceSupabaseClient();
  const src = sourceStoragePath(userId, generationId);
  const { data, error } = await service.storage
    .from(GENERATED_ASSETS_BUCKET)
    .download(src);
  if (error || !data) {
    throw new Error("Quelldatei nicht gefunden.");
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  const path = finalStoragePath(userId, generationId);
  await uploadToGeneratedAssets(path, buffer, "image/jpeg");
  return path;
}

export async function ingestFinalImageFromUrl(
  userId: string,
  generationId: string,
  sourceUrl: string
): Promise<string> {
  const raw = await fetchImageBuffer(sourceUrl);
  const finalBuf = await buildFinalStorageBuffer(raw);
  const path = finalStoragePath(userId, generationId);
  await uploadToGeneratedAssets(path, finalBuf, "image/jpeg");
  return path;
}

export async function ingestFinalAssetFromUrl(
  userId: string,
  generationId: string,
  sourceUrl: string,
  kind: "image" | "video" | "audio"
): Promise<{ path: string; mimeType: string }> {
  const res = await fetch(sourceUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Asset konnte nicht geladen werden (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType =
    res.headers.get("content-type") ??
    (kind === "video"
      ? "video/mp4"
      : kind === "audio"
        ? "audio/mpeg"
        : "image/jpeg");
  const path =
    kind === "video"
      ? finalVideoStoragePath(userId, generationId)
      : kind === "audio"
        ? audioStoragePath(userId, generationId)
        : finalStoragePath(userId, generationId);
  await uploadToGeneratedAssets(path, buffer, mimeType);
  return { path, mimeType };
}

export async function downloadStorageObject(
  storagePath: string
): Promise<{ data: Blob; contentType: string }> {
  const service = createServiceSupabaseClient();
  const { data, error } = await service.storage
    .from(GENERATED_ASSETS_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error("Datei nicht gefunden.");
  }

  return {
    data,
    contentType: data.type || "application/octet-stream",
  };
}

export async function getOwnedGeneration(
  supabase: SupabaseClient,
  generationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("generations")
    .select("id, user_id, type, credits_used, result")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return {
    ...data,
    asset: parseGenerationAssetResult(data.result),
  };
}
