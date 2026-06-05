import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  LORA_MAX_FILE_BYTES,
  LORA_MAX_IMAGES,
  LORA_MIN_IMAGES,
  LORA_STORAGE_BUCKET,
} from "@/lib/lora-config";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { buildImagesZip } from "@/lib/lora-zip";
import { assertGatedFeature } from "@/lib/access";

export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "LoRA training is not configured." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("images").filter((f): f is File => f instanceof File);
  if (files.length < LORA_MIN_IMAGES) {
    return NextResponse.json(
      { error: `Minimum ${LORA_MIN_IMAGES} images required` },
      { status: 400 }
    );
  }
  if (files.length > LORA_MAX_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${LORA_MAX_IMAGES} images allowed` },
      { status: 400 }
    );
  }

  const sessionId = crypto.randomUUID();
  const service = createServiceSupabaseClient();
  const zipInputs: { filename: string; buffer: Buffer }[] = [];
  let thumbnailPath: string | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Invalid format: ${file.name}. Use JPG, PNG or WEBP.` },
        { status: 400 }
      );
    }
    if (file.size > LORA_MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} exceeds 10MB limit` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extForMime(file.type);
    const filename = `image_${String(i + 1).padStart(3, "0")}.${ext}`;
    const storagePath = `${user.id}/${sessionId}/${filename}`;

    const { error: uploadErr } = await service.storage
      .from(LORA_STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error("lora upload storage:", uploadErr.message);
      return NextResponse.json(
        { error: "Upload to storage failed" },
        { status: 500 }
      );
    }

    if (i === 0) {
      thumbnailPath = storagePath;
    }

    zipInputs.push({ filename, buffer });
  }

  const zipBuffer = await buildImagesZip(zipInputs);

  configureFalClient();
  const zipBlob = new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" });
  const zipFile = new File([zipBlob], `lora-${sessionId}.zip`, {
    type: "application/zip",
  });
  const zipUrl = await fal.storage.upload(zipFile);

  const zipStoragePath = `${user.id}/${sessionId}/training.zip`;
  await service.storage.from(LORA_STORAGE_BUCKET).upload(zipStoragePath, zipBuffer, {
    contentType: "application/zip",
    upsert: true,
  });

  return NextResponse.json({
    success: true,
    sessionId,
    zipUrl,
    imageCount: files.length,
    thumbnailPath,
  });
}
