import type { ShareMediaType, SharePlatform } from "./share-platforms";
import { getSharePlatform } from "./share-platforms";

export type SharePublishRequest = {
  assetUrl: string;
  caption: string;
  mediaType: ShareMediaType;
  toolId?: string;
};

export type SharePublishResponse = {
  success: true;
  postId: string;
  liveUrl: string;
  platform: SharePlatform;
  message?: string;
};

export type SharePublishError = {
  error: string;
};

export async function publishAssetToPlatform(
  platform: SharePlatform,
  payload: SharePublishRequest
): Promise<SharePublishResponse> {
  const config = getSharePlatform(platform);
  const res = await fetch(config.apiRoute, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, platform }),
  });

  const data = (await res.json().catch(() => ({}))) as
    | SharePublishResponse
    | SharePublishError;

  if (!res.ok) {
    throw new Error(
      "error" in data && data.error ? data.error : "Veröffentlichung fehlgeschlagen"
    );
  }

  return data as SharePublishResponse;
}
