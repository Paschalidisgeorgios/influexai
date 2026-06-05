import {
  getAkoolToken,
  getAkoolApiKey,
  getAkoolVideoResult,
  mapAkoolVideoStatus,
  type AkoolVideoJob,
} from "@/lib/akool";

const AKOOL_V3 = "https://openapi.akool.com/api/open/v3";

export const UGC_VIDEO_CREDIT_COST = 5;

export type UgcAvatar = {
  avatar_id: string;
  name: string;
  thumbnail?: string;
  url?: string;
  gender?: string;
  voice_id?: string;
  from: number;
};

export type AkoolVoiceItem = {
  voice_id: string;
  name: string;
  gender?: string;
  language?: string;
  locale?: string;
  preview?: string;
};

type AkoolEnvelope<T> = {
  code: number;
  msg: string;
  data?: T;
};

async function bearerHeaders(): Promise<HeadersInit> {
  const token = await getAkoolToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  const apiKey = getAkoolApiKey();
  if (apiKey) {
    return { "x-api-key": apiKey, "Content-Type": "application/json" };
  }
  throw new Error("Akool authentication failed");
}

function parseAvatarList(data: unknown): UgcAvatar[] {
  const root = data as Record<string, unknown> | unknown[] | null;
  const list = Array.isArray(root)
    ? root
    : Array.isArray((root as Record<string, unknown>)?.list)
      ? ((root as Record<string, unknown>).list as unknown[])
      : [];

  const mapped: UgcAvatar[] = [];
  for (const item of list) {
    const row = item as Record<string, unknown>;
    const avatar_id = String(row.avatar_id ?? "").trim();
    if (!avatar_id) continue;
    mapped.push({
      avatar_id,
      name: String(row.name ?? avatar_id),
      thumbnail: String(
        row.thumbnailUrl ?? row.thumbnail ?? row.url ?? ""
      ) || undefined,
      url: String(row.url ?? "") || undefined,
      gender: String(row.gender ?? "") || undefined,
      voice_id: String(row.voice_id ?? "") || undefined,
      from: Number(row.from ?? 2),
    });
  }
  return mapped;
}

/** UGC / talking avatars from Akool catalog (type=1, official). */
export async function listUgcAvatars(
  page = 1,
  size = 60
): Promise<UgcAvatar[]> {
  const headers = await bearerHeaders();
  const url = `${AKOOL_V3}/avatar/list?from=2&type=1&page=${page}&size=${size}`;
  const response = await fetch(url, { method: "GET", headers });
  const json = (await response.json()) as AkoolEnvelope<unknown>;
  if (json.code !== 1000) {
    throw new Error(json.msg || "Avatar-Liste nicht verfügbar");
  }
  return parseAvatarList(json.data);
}

export async function listAkoolVoices(
  page = 1,
  size = 40
): Promise<AkoolVoiceItem[]> {
  const apiKey = getAkoolApiKey();
  const headers: HeadersInit = apiKey
    ? { "x-api-key": apiKey }
    : await bearerHeaders();

  const url = `${AKOOL_V3}/voice/list?page=${page}&size=${size}`;
  const response = await fetch(url, { method: "GET", headers });
  const json = (await response.json()) as AkoolEnvelope<unknown>;
  if (json.code !== 1000) {
    throw new Error(json.msg || "Stimmen-Liste nicht verfügbar");
  }

  const list = Array.isArray(json.data) ? json.data : [];
  const voices: AkoolVoiceItem[] = [];
  for (const item of list) {
    const row = item as Record<string, unknown>;
    const voice_id = String(row.voice_id ?? "").trim();
    if (!voice_id) continue;
    voices.push({
      voice_id,
      name: String(row.name ?? voice_id),
      gender: String(row.gender ?? "") || undefined,
      language: String(row.language ?? "") || undefined,
      locale: String(row.locale ?? "") || undefined,
      preview: String(row.preview ?? row.origin_preview ?? "") || undefined,
    });
  }
  return voices;
}

export type CreateUgcVideoParams = {
  avatar: Pick<UgcAvatar, "avatar_id" | "from">;
  script: string;
  voiceId: string;
  aspectRatio?: "9:16" | "16:9";
  /** Pre-rendered audio URL (ElevenLabs path); takes precedence over TTS fields */
  audioUrl?: string;
};

/**
 * Creates a UGC-style talking avatar video via Akool talkingavatar/create.
 * Note: openapi …/video/avatar returns 404; official endpoint is talkingavatar/create.
 */
export async function createUgcTalkingAvatarVideo(
  params: CreateUgcVideoParams
): Promise<AkoolVideoJob> {
  const headers = await bearerHeaders();
  const vertical = params.aspectRatio !== "16:9";
  const width = vertical ? 1080 : 1920;
  const height = vertical ? 1920 : 1080;
  const avatarSize = vertical ? 1080 : 960;

  const elements: Record<string, unknown>[] = [
    {
      type: "avatar",
      avatar_id: params.avatar.avatar_id,
      scale_x: 1,
      scale_y: 1,
      width: avatarSize,
      height: avatarSize,
      offset_x: width / 2,
      offset_y: height / 2,
    },
  ];

  if (params.audioUrl) {
    elements.push({ type: "audio", url: params.audioUrl });
  } else {
    elements.push({
      type: "audio",
      input_text: params.script,
      voice_id: params.voiceId,
    });
  }

  const response = await fetch(`${AKOOL_V3}/talkingavatar/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      width,
      height,
      avatar_from: params.avatar.from,
      elements,
      webhookUrl: "",
    }),
  });

  const json = (await response.json()) as AkoolEnvelope<AkoolVideoJob>;
  if (json.code !== 1000 || !json.data?._id) {
    throw new Error(json.msg || "UGC-Video konnte nicht gestartet werden");
  }
  return json.data;
}

export { getAkoolVideoResult, mapAkoolVideoStatus };
