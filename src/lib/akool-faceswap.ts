import { getAkoolToken } from "@/lib/akool";
import {
  AkoolFaceswapError,
  FACE_SWAP_NO_FACE_IN_VIDEO,
  FACE_SWAP_NO_FACE_SOURCE,
  FACE_SWAP_NO_FACE_TARGET,
  mapAkoolErrorMessage,
} from "@/lib/akool-errors";

const AKOOL_V3 = "https://openapi.akool.com/api/open/v3";
const AKOOL_V4 = "https://openapi.akool.com/api/open/v4";
const AKOOL_DETECT_LEGACY = "https://sg3.akool.com/detect";
const AKOOL_DETECT_UNIFIED =
  "https://openapi.akool.com/interface/detect-api/detect_faces";

type AkoolResponse<T> = {
  code: number;
  msg: string;
  data?: T;
};

export type FaceswapJob = {
  _id: string;
  url?: string;
  job_id?: string;
};

type LegacyDetectResponse = {
  error_code: number;
  error_msg?: string;
  landmarks_str?: string[];
  face_urls?: string[];
  crop_face_url?: string[];
  crop_urls?: string[];
};

type UnifiedFaceFrame = {
  landmarks_str?: string[];
  face_urls?: string[] | null;
};

type UnifiedDetectResponse = {
  error_code: number;
  error_msg?: string;
  faces_obj?: Record<string, UnifiedFaceFrame>;
};

export type FaceDetectEntry = {
  path: string;
  opts: string;
};

async function detectAuthHeaders(): Promise<HeadersInit> {
  const token = await getAkoolToken();
  if (!token) {
    throw new AkoolFaceswapError(
      "Akool authentication failed",
      "Video-Dienst nicht erreichbar."
    );
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function akoolApiHeaders(): Promise<HeadersInit> {
  return detectAuthHeaders();
}

function pickUnifiedFaceFrame(
  facesObj: Record<string, UnifiedFaceFrame> | undefined
): UnifiedFaceFrame | null {
  if (!facesObj) return null;
  const keys = Object.keys(facesObj).sort((a, b) => Number(a) - Number(b));
  for (const key of keys) {
    const frame = facesObj[key];
    if (frame?.landmarks_str?.[0]) return frame;
  }
  return null;
}

function throwDetectError(
  raw: string | undefined,
  context: "targetFace" | "sourceMedia"
): never {
  const userMessage = mapAkoolErrorMessage(raw, context);
  throw new AkoolFaceswapError(raw ?? "detect failed", userMessage);
}

/**
 * Unified detect (images + videos). Avoids passing video URLs to legacy image-only detect.
 */
async function akoolDetectFaceUnified(
  mediaUrl: string,
  context: "targetFace" | "sourceMedia",
  isVideo: boolean
): Promise<FaceDetectEntry> {
  if (!mediaUrl?.trim()) {
    throw new AkoolFaceswapError(
      "missing media url",
      context === "targetFace"
        ? FACE_SWAP_NO_FACE_TARGET
        : FACE_SWAP_NO_FACE_IN_VIDEO
    );
  }

  const headers = await detectAuthHeaders();
  try {
    const response = await fetch(AKOOL_DETECT_UNIFIED, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: mediaUrl,
        single_face: true,
        return_face_url: true,
        ...(isVideo ? { num_frames: 10 } : {}),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throwDetectError(text, context);
    }

    const data = (await response.json()) as UnifiedDetectResponse;
    if (data.error_code !== 0) {
      throwDetectError(data.error_msg, context);
    }

    const frame = pickUnifiedFaceFrame(data.faces_obj);
    const opts = frame?.landmarks_str?.[0];
    if (!opts) {
      throw new AkoolFaceswapError(
        "no landmarks",
        context === "targetFace"
          ? FACE_SWAP_NO_FACE_TARGET
          : FACE_SWAP_NO_FACE_IN_VIDEO
      );
    }

    const path = frame?.face_urls?.[0] ?? mediaUrl;
    return { path, opts };
  } catch (err) {
    if (err instanceof AkoolFaceswapError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AkoolFaceswapError(
      message,
      mapAkoolErrorMessage(message, context)
    );
  }
}

/** Legacy image-only detect (fallback). */
async function akoolDetectFaceLegacy(
  imageUrl: string,
  context: "targetFace" | "sourceMedia"
): Promise<FaceDetectEntry> {
  const headers = await detectAuthHeaders();
  const response = await fetch(AKOOL_DETECT_LEGACY, {
    method: "POST",
    headers,
    body: JSON.stringify({
      single_face: true,
      image_url: imageUrl,
    }),
  });

  const data = (await response.json()) as LegacyDetectResponse;
  if (data.error_code !== 0) {
    throwDetectError(data.error_msg, context);
  }

  const opts = data.landmarks_str?.[0];
  if (!opts) {
    throw new AkoolFaceswapError(
      "no landmarks",
      context === "targetFace"
        ? FACE_SWAP_NO_FACE_TARGET
        : FACE_SWAP_NO_FACE_SOURCE
    );
  }

  const path =
    data.face_urls?.[0] ??
    data.crop_face_url?.[0] ??
    data.crop_urls?.[0] ??
    imageUrl;

  return { path, opts };
}

async function akoolDetectFace(
  mediaUrl: string,
  context: "targetFace" | "sourceMedia",
  isVideo: boolean
): Promise<FaceDetectEntry> {
  try {
    return await akoolDetectFaceUnified(mediaUrl, context, isVideo);
  } catch (unifiedErr) {
    if (isVideo) throw unifiedErr;
    console.warn("[faceswap] unified detect failed, legacy fallback:", unifiedErr);
    return akoolDetectFaceLegacy(mediaUrl, context);
  }
}

function parseAkoolApiError(
  json: AkoolResponse<unknown>,
  fallback: string
): never {
  const userMessage = mapAkoolErrorMessage(json.msg, "general");
  throw new AkoolFaceswapError(json.msg || fallback, userMessage);
}

/**
 * Recommended: Face Swap Plus (V4) — public HTTPS URLs, single-face mode, no manual detect.
 * source_url = replacement face; target_url = image or video to modify.
 */
export async function createFaceswapPlus(params: {
  sourceFaceUrl: string;
  targetMediaUrl: string;
}): Promise<FaceswapJob> {
  if (!params.sourceFaceUrl?.trim() || !params.targetMediaUrl?.trim()) {
    throw new AkoolFaceswapError(
      "missing urls",
      FACE_SWAP_NO_FACE_TARGET
    );
  }

  const headers = await akoolApiHeaders();
  try {
    const response = await fetch(
      `${AKOOL_V4}/faceswap/faceswapPlusByImage`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_url: params.sourceFaceUrl,
          target_url: params.targetMediaUrl,
          single_face_mode: true,
          face_enhance: true,
          model_style: "realistic",
          webhookUrl: "",
        }),
      }
    );

    const json = (await response.json()) as AkoolResponse<FaceswapJob>;
    if (!response.ok) {
      parseAkoolApiError(json, "Face Swap Plus fehlgeschlagen");
    }
    if (json.code !== 1000 || !json.data?._id) {
      parseAkoolApiError(json, "Face Swap Plus fehlgeschlagen");
    }
    return json.data;
  } catch (err) {
    if (err instanceof AkoolFaceswapError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AkoolFaceswapError(
      message,
      mapAkoolErrorMessage(message, "general")
    );
  }
}

export async function createImageFaceswap(params: {
  modifyImageUrl: string;
  targetFaceUrl: string;
}): Promise<FaceswapJob> {
  const [targetInSource, sourceFace] = await Promise.all([
    akoolDetectFace(params.modifyImageUrl, "sourceMedia", false),
    akoolDetectFace(params.targetFaceUrl, "targetFace", false),
  ]);

  const headers = await akoolApiHeaders();
  try {
    const response = await fetch(
      `${AKOOL_V3}/faceswap/highquality/specifyimage`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          modifyImage: params.modifyImageUrl,
          targetImage: [targetInSource],
          sourceImage: [sourceFace],
          face_enhance: 1,
          webhookUrl: "",
        }),
      }
    );

    const json = (await response.json()) as AkoolResponse<FaceswapJob>;
    if (json.code !== 1000 || !json.data?._id) {
      parseAkoolApiError(json, "Bild Face Swap fehlgeschlagen");
    }
    return json.data;
  } catch (err) {
    if (err instanceof AkoolFaceswapError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AkoolFaceswapError(
      message,
      mapAkoolErrorMessage(message, "general")
    );
  }
}

/** V3 video swap — detect faces in video via unified API, not legacy image_url on MP4. */
export async function createVideoFaceswap(params: {
  modifyVideoUrl: string;
  targetFaceUrl: string;
}): Promise<FaceswapJob> {
  const [targetInVideo, sourceFace] = await Promise.all([
    akoolDetectFace(params.modifyVideoUrl, "sourceMedia", true),
    akoolDetectFace(params.targetFaceUrl, "targetFace", false),
  ]);

  const headers = await akoolApiHeaders();
  try {
    const response = await fetch(
      `${AKOOL_V3}/faceswap/highquality/specifyvideo`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          modifyVideo: params.modifyVideoUrl,
          targetImage: [targetInVideo],
          sourceImage: [sourceFace],
          face_enhance: 1,
          webhookUrl: "",
        }),
      }
    );

    const json = (await response.json()) as AkoolResponse<FaceswapJob>;
    if (json.code !== 1000 || !json.data?._id) {
      parseAkoolApiError(json, "Video Face Swap fehlgeschlagen");
    }
    return json.data;
  } catch (err) {
    if (err instanceof AkoolFaceswapError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AkoolFaceswapError(
      message,
      mapAkoolErrorMessage(message, "general")
    );
  }
}

export async function getFaceswapResults(
  jobId: string
): Promise<FaceswapResultItem | null> {
  if (!jobId?.trim()) {
    throw new AkoolFaceswapError("missing job id", "Ungültige Job-ID");
  }

  const headers = await akoolApiHeaders();
  const url = `${AKOOL_V3}/faceswap/result/listbyids?_ids=${encodeURIComponent(jobId)}`;
  const response = await fetch(url, { method: "GET", headers });
  const json = (await response.json()) as AkoolResponse<{
    result?: FaceswapResultItem[];
  }>;

  if (json.code !== 1000) {
    throw new AkoolFaceswapError(
      json.msg || "status failed",
      mapAkoolErrorMessage(json.msg, "general")
    );
  }

  return json.data?.result?.[0] ?? null;
}

export type FaceswapResultItem = {
  faceswap_status: number;
  url?: string;
  createdAt?: string;
};

export function mapFaceswapStatus(status: number): {
  status: "processing" | "completed" | "failed";
  progress: number;
} {
  switch (status) {
    case 3:
      return { status: "completed", progress: 100 };
    case 4:
      return { status: "failed", progress: 0 };
    case 2:
      return { status: "processing", progress: 60 };
    default:
      return { status: "processing", progress: 20 };
  }
}

/** V4 first; V3 + unified detect as fallback. */
export async function startFaceswapJob(params: {
  mode: "image" | "video";
  sourceMediaUrl: string;
  targetFaceUrl: string;
}): Promise<FaceswapJob> {
  try {
    return await createFaceswapPlus({
      sourceFaceUrl: params.targetFaceUrl,
      targetMediaUrl: params.sourceMediaUrl,
    });
  } catch (plusErr) {
    console.warn("[faceswap] V4 Plus failed, trying V3:", plusErr);
    if (params.mode === "video") {
      return createVideoFaceswap({
        modifyVideoUrl: params.sourceMediaUrl,
        targetFaceUrl: params.targetFaceUrl,
      });
    }
    return createImageFaceswap({
      modifyImageUrl: params.sourceMediaUrl,
      targetFaceUrl: params.targetFaceUrl,
    });
  }
}
