import type { KiInfluencerApiErrorBody } from "@/lib/ki-influencer-types";

export const KI_INFLUENCER_TIMEOUT_MESSAGE =
  "Server-Timeout — bitte erneut versuchen.";

export function isJsonResponse(res: Response): boolean {
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
}

export type KiInfluencerParsedResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
  nonJson: boolean;
};

/** Safe JSON parse — returns a friendly error when Vercel returns HTML. */
export async function parseKiInfluencerJsonResponse<
  T extends KiInfluencerApiErrorBody = KiInfluencerApiErrorBody,
>(res: Response): Promise<KiInfluencerParsedResponse<T>> {
  if (!isJsonResponse(res)) {
    return {
      ok: false,
      status: res.status,
      nonJson: true,
      data: {
        success: false,
        error: KI_INFLUENCER_TIMEOUT_MESSAGE,
        detail: KI_INFLUENCER_TIMEOUT_MESSAGE,
      } as T,
    };
  }

  try {
    const data = (await res.json()) as T;
    return { ok: res.ok, status: res.status, nonJson: false, data };
  } catch {
    return {
      ok: false,
      status: res.status,
      nonJson: true,
      data: {
        success: false,
        error: KI_INFLUENCER_TIMEOUT_MESSAGE,
        detail: KI_INFLUENCER_TIMEOUT_MESSAGE,
      } as T,
    };
  }
}
