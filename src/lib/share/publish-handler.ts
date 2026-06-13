import type { ShareMediaType, SharePlatform } from "@/lib/canvas/share-platforms";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordCanvasShare } from "@/lib/canvas/analytics-server";

export type SharePublishBody = {
  assetUrl: string;
  caption: string;
  mediaType: ShareMediaType;
  toolId?: string;
};

export type SharePublishResult = {
  success: true;
  postId: string;
  liveUrl: string;
  platform: SharePlatform;
  message: string;
};

function mockLiveUrl(platform: SharePlatform, postId: string): string {
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@creator/video/${postId}`;
    case "instagram":
      return `https://www.instagram.com/reel/${postId}/`;
    case "youtube":
      return `https://youtube.com/shorts/${postId}`;
  }
}

export function validateSharePublishBody(
  body: unknown
): SharePublishBody | { error: string; status: number } {
  if (!body || typeof body !== "object") {
    return { error: "Ungültiger Request-Body", status: 400 };
  }

  const { assetUrl, caption, mediaType, toolId } = body as Record<string, unknown>;

  if (typeof assetUrl !== "string" || !assetUrl.trim()) {
    return { error: "assetUrl erforderlich", status: 400 };
  }
  if (typeof caption !== "string" || !caption.trim()) {
    return { error: "Caption erforderlich", status: 400 };
  }
  if (mediaType !== "image" && mediaType !== "video") {
    return { error: "mediaType muss image oder video sein", status: 400 };
  }

  return {
    assetUrl: assetUrl.trim(),
    caption: caption.trim(),
    mediaType,
    toolId: typeof toolId === "string" ? toolId : undefined,
  };
}

/**
 * Publishes an asset to a social platform.
 * TODO: Wire TikTok Content Posting API, Instagram Graph API, YouTube Data API.
 */
export async function publishAssetToSocial(
  platform: SharePlatform,
  body: SharePublishBody,
  userId: string,
  supabase?: SupabaseClient
): Promise<SharePublishResult> {
  const postId = `${platform.slice(0, 2)}_${Date.now().toString(36)}`;

  // Simulate upload latency for UX feedback during API integration.
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const result: SharePublishResult = {
    success: true,
    postId,
    liveUrl: mockLiveUrl(platform, postId),
    platform,
    message: `${body.mediaType === "video" ? "Video" : "Bild"} an ${platform} übermittelt.`,
  };

  if (supabase) {
    try {
      await recordCanvasShare(supabase, userId, {
        platform,
        toolId: body.toolId,
        caption: body.caption,
        liveUrl: result.liveUrl,
        postId: result.postId,
      });
    } catch {
      // Non-blocking — publish still succeeds for the creator UI.
    }
  }

  return result;
}
