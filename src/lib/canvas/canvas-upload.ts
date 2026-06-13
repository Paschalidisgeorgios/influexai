"use client";

import { createClient } from "@/lib/supabase/client";
import { uploadFileToFal } from "@/lib/upload-media-fal";

/** Matches `GENERATED_ASSETS_BUCKET` in `@/lib/generation-assets` (server-side uploads). */
const GENERATED_ASSETS_BUCKET = "generated-assets";
const AVATAR_ASSETS_BUCKET = "avatar-assets";

export type CanvasUploadTarget =
  | "fal"
  | "generated-assets"
  | "avatar-assets"
  | "lora-training";

export interface CanvasUploadResult {
  url: string;
  key?: string;
  fileName: string;
  sizeBytes: number;
}

function fileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,6}$/.test(fromName)) return fromName;
  const mime = file.type.split("/")[1];
  if (mime === "jpeg") return "jpg";
  return mime ?? "bin";
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Nicht eingeloggt — bitte anmelden.");
  }
  return user.id;
}

/** Client-side mirror of avatar-studio/page.tsx Supabase upload pattern. */
async function uploadToSupabasePublicBucket(
  file: File,
  bucket: string,
  storagePath: string
): Promise<CanvasUploadResult> {
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (uploadError) {
    throw new Error(uploadError.message);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return {
    url: data.publicUrl,
    key: storagePath,
    fileName: file.name,
    sizeBytes: file.size,
  };
}

export async function uploadCanvasFile(
  file: File,
  target: CanvasUploadTarget = "fal"
): Promise<CanvasUploadResult> {
  switch (target) {
    case "fal": {
      const url = await uploadFileToFal(file);
      return {
        url,
        fileName: file.name,
        sizeBytes: file.size,
      };
    }
    case "generated-assets": {
      const userId = await requireUserId();
      const ext = fileExtension(file);
      const ts = Date.now();
      const storagePath = `${userId}/canvas/${ts}-upload.${ext}`;
      return uploadToSupabasePublicBucket(
        file,
        GENERATED_ASSETS_BUCKET,
        storagePath
      );
    }
    case "avatar-assets": {
      const userId = await requireUserId();
      const ext = fileExtension(file);
      const ts = Date.now();
      const typeLabel = file.type.startsWith("video/") ? "driving" : "source";
      const storagePath = `${userId}/avatar-studio/${ts}-${typeLabel}.${ext}`;
      return uploadToSupabasePublicBucket(
        file,
        AVATAR_ASSETS_BUCKET,
        storagePath
      );
    }
    case "lora-training":
      throw new Error(
        "lora-training uploads use a dedicated multi-image flow — see sub-wave 2c"
      );
    default: {
      const exhaustive: never = target;
      throw new Error(`Unknown upload target: ${String(exhaustive)}`);
    }
  }
}

export async function uploadCanvasFiles(
  files: File[],
  target: CanvasUploadTarget = "fal"
): Promise<CanvasUploadResult[]> {
  return Promise.all(files.map((file) => uploadCanvasFile(file, target)));
}
