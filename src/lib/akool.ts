import { getAkoolClientSecret } from "@/lib/akool-env";

export const AKOOL_OPEN_BASE = "https://openapi.akool.com/api/open";

const AKOOL_V3_BASE = `${AKOOL_OPEN_BASE}/v3`;
const AKOOL_V4_BASE = `${AKOOL_OPEN_BASE}/v4`;

export type AkoolVideoStatus = 1 | 2 | 3 | 4;

export type AkoolVideoJob = {
  _id: string;
  video_status: AkoolVideoStatus;
  video?: string;
};

type AkoolResponse<T> = {
  code: number;
  msg: string;
  data?: T;
  token?: string;
};

/** Primary API key — prefers AKOOL_API_KEY, falls back to AKOOL_CLIENT_SECRET. */
export function getAkoolApiKey(): string | undefined {
  const direct = process.env.AKOOL_API_KEY?.trim();
  if (direct) return direct;
  return getAkoolClientSecret();
}

export function isAkoolApiKeyConfigured(): boolean {
  return !!getAkoolApiKey();
}

export function akoolApiKeyHeaders(): HeadersInit {
  const apiKey = getAkoolApiKey();
  if (!apiKey) {
    throw new Error("Akool API key fehlt (AKOOL_API_KEY)");
  }
  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

/** GET against Akool Open API (path like `/v4/aigModel/list`). */
export async function akoolGet<T = unknown>(
  path: string,
  query?: Record<string, string>
): Promise<AkoolResponse<T>> {
  const url = new URL(`${AKOOL_OPEN_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: akoolApiKeyHeaders(),
    cache: "no-store",
  });
  return (await response.json()) as AkoolResponse<T>;
}

/** POST against Akool Open API (path like `/v4/image2video/create`). */
export async function akoolPost<T = unknown>(
  path: string,
  body: unknown
): Promise<AkoolResponse<T>> {
  const response = await fetch(
    `${AKOOL_OPEN_BASE}${path.startsWith("/") ? path : `/${path}`}`,
    {
      method: "POST",
      headers: akoolApiKeyHeaders(),
      body: JSON.stringify(body),
    }
  );
  return (await response.json()) as AkoolResponse<T>;
}

export function extractAkoolJobId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  if (typeof row._id === "string") return row._id;
  if (typeof row.jobId === "string") return row.jobId;
  if (row.data && typeof row.data === "object") {
    return extractAkoolJobId(row.data);
  }
  return null;
}

export function mapAkoolStatusCode(
  status: number | undefined
): "processing" | "completed" | "failed" {
  if (status === 3) return "completed";
  if (status === 4) return "failed";
  return "processing";
}

export function extractResultUrl(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const row = data as Record<string, unknown>;
  const candidates = [
    row.video_url,
    row.videoUrl,
    row.video,
    row.audio_url,
    row.audioUrl,
    row.url,
    row.result_url,
    row.resultUrl,
    row.image_url,
    row.imageUrl,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.startsWith("http")) return value;
  }
  if (Array.isArray(row.result) && row.result[0]) {
    return extractResultUrl(row.result[0]);
  }
  return undefined;
}

/** Legacy OAuth token — fallback for v3 talking photo / UGC routes. */
export async function getAkoolToken(): Promise<string | null> {
  const clientId = process.env.AKOOL_CLIENT_ID?.trim();
  const clientSecret = getAkoolClientSecret();
  if (!clientId || !clientSecret) {
    console.error(
      "[akool] getToken: AKOOL_CLIENT_ID or AKOOL_CLIENT_SECRET missing"
    );
    return null;
  }

  const response = await fetch(`${AKOOL_V3_BASE}/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  const data = (await response.json()) as AkoolResponse<{ token?: string }> & {
    token?: string;
  };
  if (data.code !== 1000) {
    console.error("[akool] getToken failed:", data.code, data.msg);
    return null;
  }
  return data.data?.token ?? data.token ?? null;
}

/** Legacy auth: Bearer token first, then x-api-key. */
export async function akoolAuthHeaders(): Promise<HeadersInit> {
  const token = await getAkoolToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return akoolApiKeyHeaders();
}

export async function createImageToVideoByImageAndSound(body: {
  imageUrl: string;
  prompt: string;
  duration: number;
  cameraMovement: string;
  shotType: string;
  quality: "720p" | "1080p";
}): Promise<AkoolVideoJob> {
  const headers = await akoolAuthHeaders();
  const response = await fetch(
    `${AKOOL_V3_BASE}/content/video/createbyimageandsound`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        imageUrl: body.imageUrl,
        prompt: body.prompt,
        duration: body.duration,
        cameraMovement: body.cameraMovement,
        shotType: body.shotType,
        quality: body.quality,
        webhookUrl: "",
      }),
    }
  );
  const json = (await response.json()) as AkoolResponse<AkoolVideoJob> & {
    jobId?: string;
  };
  const jobId = json.data?._id ?? json.jobId;
  if (json.code !== 1000 || !jobId) {
    throw new Error(json.msg || "Akool image-to-video failed");
  }
  return json.data ?? { _id: jobId, video_status: 1 };
}

export async function createTalkingPhotoVideo(body: {
  talking_photo_url: string;
  audio_url: string;
  resolution?: "720p" | "1080p";
}): Promise<AkoolVideoJob> {
  const headers = await akoolAuthHeaders();
  const response = await fetch(
    `${AKOOL_V3_BASE}/content/video/createbytalkingphoto`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        talking_photo_url: body.talking_photo_url,
        audio_url: body.audio_url,
        resolution: body.resolution ?? "720p",
        webhookUrl: "",
      }),
    }
  );
  const json = (await response.json()) as AkoolResponse<AkoolVideoJob>;
  if (json.code !== 1000 || !json.data?._id) {
    throw new Error(json.msg || "Akool talking photo failed");
  }
  return json.data;
}

export async function getAkoolVideoResult(
  videoModelId: string
): Promise<AkoolVideoJob> {
  const headers = await akoolAuthHeaders();
  const url = `${AKOOL_V3_BASE}/content/video/infobymodelid?video_model_id=${encodeURIComponent(videoModelId)}`;
  const response = await fetch(url, { method: "GET", headers });
  const json = (await response.json()) as AkoolResponse<AkoolVideoJob>;
  if (json.code !== 1000 || !json.data) {
    throw new Error(json.msg || "Akool status check failed");
  }
  return json.data;
}

/** 1=queueing, 2=processing, 3=completed, 4=failed */
export function mapAkoolVideoStatus(videoStatus: AkoolVideoStatus): {
  status: "processing" | "completed" | "failed";
  progress: number;
} {
  switch (videoStatus) {
    case 3:
      return { status: "completed", progress: 100 };
    case 4:
      return { status: "failed", progress: 0 };
    case 2:
      return { status: "processing", progress: 55 };
    default:
      return { status: "processing", progress: 15 };
  }
}

export async function waitForAkoolVideo(
  videoModelId: string,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await getAkoolVideoResult(videoModelId);
    if (job.video_status === 3 && job.video) {
      return job.video;
    }
    if (job.video_status === 4) {
      throw new Error("Video-Generierung fehlgeschlagen");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Zeitüberschreitung bei der Video-Generierung");
}

export { AKOOL_V3_BASE, AKOOL_V4_BASE };
