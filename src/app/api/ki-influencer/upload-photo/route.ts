import { NextRequest, NextResponse } from "next/server";
import { assertGatedFeature } from "@/lib/access.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  LORA_MAX_FILE_BYTES,
  LORA_STORAGE_BUCKET,
} from "@/lib/lora-config";
import {
  consentRequiredResponse,
  KI_INFLUENCER_UPLOAD_CONSENT_MESSAGE,
  readIdentityUploadConsentFromFormData,
} from "@/lib/consent.server";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 30;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Ungültige Formulardaten." },
      { status: 400 }
    );
  }

  if (!readIdentityUploadConsentFromFormData(formData)) {
    return consentRequiredResponse(KI_INFLUENCER_UPLOAD_CONSENT_MESSAGE);
  }

  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const indexRaw = formData.get("index");
  const index =
    typeof indexRaw === "string"
      ? Number.parseInt(indexRaw, 10)
      : typeof indexRaw === "number"
        ? indexRaw
        : NaN;
  const file = formData.get("image");

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "sessionId erforderlich." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(index) || index < 0) {
    return NextResponse.json(
      { success: false, error: "index erforderlich." },
      { status: 400 }
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Bilddatei fehlt." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { success: false, error: "Nur JPG, PNG oder WEBP." },
      { status: 400 }
    );
  }
  if (file.size > LORA_MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, error: "Datei überschreitet 10 MB." },
      { status: 400 }
    );
  }

  console.log("[ki-influencer] upload-photo", "running", {
    sessionId,
    index,
    size: file.size,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extForMime(file.type);
  const filename = `image_${String(index + 1).padStart(3, "0")}.${ext}`;
  const storagePath = `${user.id}/${sessionId}/${filename}`;

  const service = createServiceSupabaseClient();
  const { error: uploadErr } = await service.storage
    .from(LORA_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    console.log("[ki-influencer] upload-photo", "error", uploadErr.message);
    return NextResponse.json(
      { success: false, error: "Speichern fehlgeschlagen." },
      { status: 500 }
    );
  }

  console.log("[ki-influencer] upload-photo", "ok", { storagePath, index });

  return NextResponse.json({
    success: true,
    sessionId,
    index,
    storagePath,
    filename,
  });
}
