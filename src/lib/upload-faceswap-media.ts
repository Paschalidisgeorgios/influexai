import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { uploadFileToFal } from "@/lib/upload-media-fal";
import { assertPublicMediaUrl } from "@/lib/faceswap-media";

const FACESWAP_BUCKET = "faceswap-uploads";

export { FACESWAP_BUCKET };

/**
 * Upload face-swap media to a public HTTPS URL for Akool.
 * Prefer FAL CDN; fall back to Supabase Storage when FAL is unavailable.
 */
export async function uploadFaceswapMedia(
  file: File,
  userId: string
): Promise<string> {
  try {
    const falUrl = await uploadFileToFal(file);
    return assertPublicMediaUrl(falUrl);
  } catch (falErr) {
    console.warn("[faceswap] FAL upload failed, trying Supabase:", falErr);
    return uploadFaceswapToSupabase(file, userId);
  }
}

async function uploadFaceswapToSupabase(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createServiceSupabaseClient();
  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    file.type.split("/")[1] ||
    "bin";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(FACESWAP_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Speicher-Upload fehlgeschlagen: ${error.message}. Bucket „${FACESWAP_BUCKET}“ vorhanden?`
    );
  }

  const { data } = supabase.storage.from(FACESWAP_BUCKET).getPublicUrl(path);
  return assertPublicMediaUrl(data.publicUrl);
}
