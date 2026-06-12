import {
  akoolGet,
  akoolPost,
  extractAkoolJobId,
  extractResultUrl,
  mapAkoolStatusCode,
} from "@/lib/akool";
import type { AkoolJobPollType } from "@/lib/akool-route-handler";

const STATUS_PATHS: Record<
  AkoolJobPollType,
  { getPath: string; postFallback?: string }
> = {
  image2video: {
    getPath: "/v4/image2video/info",
    postFallback: "/v4/image2Video/resultsByIds",
  },
  text2video: {
    getPath: "/v4/text2video/info",
    postFallback: "/v4/text2Video/resultsByIds",
  },
  translation: { getPath: "/v3/videoTranslation/info" },
  lipsync: { getPath: "/v3/lipsync/info" },
  characterSwap: { getPath: "/v4/characterSwap/info" },
  videoEditor: { getPath: "/v3/video/style-transfer/info" },
  ecommerceAds: { getPath: "/v3/product-ad/info" },
};

async function pollViaGet(
  getPath: string,
  jobId: string
): Promise<{ status: "processing" | "completed" | "failed"; resultUrl?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const json = await akoolGet<Record<string, unknown>>(getPath, { _id: jobId });
    clearTimeout(timeout);
    if (json.code !== 1000) return null;
    const payload = (json.data ?? json) as Record<string, unknown>;
    const row =
      Array.isArray(payload.result) && payload.result[0]
        ? (payload.result[0] as Record<string, unknown>)
        : payload;
    const status = mapAkoolStatusCode(
      typeof row.status === "number" ? row.status : undefined
    );
    return { status, resultUrl: extractResultUrl(row) ?? extractResultUrl(payload) };
  } catch {
    return null;
  }
}

async function pollViaPostFallback(
  postPath: string,
  jobId: string
): Promise<{ status: "processing" | "completed" | "failed"; resultUrl?: string }> {
  const json = await akoolPost<{ result?: Array<Record<string, unknown>> }>(
    postPath,
    { _ids: jobId }
  );
  if (json.code !== 1000) {
    throw new Error(json.msg || "Status-Abfrage fehlgeschlagen");
  }
  const row = json.data?.result?.[0];
  if (!row) return { status: "processing" };
  const status = mapAkoolStatusCode(
    typeof row.status === "number" ? row.status : undefined
  );
  return { status, resultUrl: extractResultUrl(row) };
}

export async function pollAkoolJobStatus(
  type: AkoolJobPollType,
  jobId: string
): Promise<{ status: "processing" | "completed" | "failed"; resultUrl?: string }> {
  const config = STATUS_PATHS[type];
  const viaGet = await pollViaGet(config.getPath, jobId);
  if (viaGet) return viaGet;
  if (config.postFallback) {
    return pollViaPostFallback(config.postFallback, jobId);
  }
  throw new Error("Status-Abfrage nicht verfügbar");
}

export async function createAkoolJob(
  postPath: string,
  body: Record<string, unknown>,
  fallbackPath?: string,
  fallbackBody?: Record<string, unknown>
): Promise<string> {
  let json = await akoolPost<Record<string, unknown>>(postPath, body);
  let jobId = extractAkoolJobId(json.data ?? json);
  if ((!json.code || json.code !== 1000 || !jobId) && fallbackPath) {
    json = await akoolPost<Record<string, unknown>>(
      fallbackPath,
      fallbackBody ?? body
    );
    jobId = extractAkoolJobId(json.data ?? json);
  }
  if (json.code !== 1000 || !jobId) {
    throw new Error(json.msg || "Akool Job konnte nicht erstellt werden");
  }
  return jobId;
}

export async function createAkoolSyncResult(
  postPath: string,
  body: Record<string, unknown>
): Promise<string> {
  const json = await akoolPost<Record<string, unknown>>(postPath, body);
  if (json.code !== 1000) {
    throw new Error(json.msg || "Akool Anfrage fehlgeschlagen");
  }
  const url = extractResultUrl(json.data ?? json);
  if (!url) {
    throw new Error("Keine Ergebnis-URL in der Antwort");
  }
  return url;
}
