import { getAkoolToken } from "@/lib/akool";

const AKOOL_OPENAPI = "https://openapi.akool.com/api/open";

export const LIVE_AVATAR_CREDITS_PER_MINUTE = 1;
export const LIVE_AVATAR_LOW_CREDITS_WARNING = 10;
export const LIVE_AVATAR_DEFAULT_DURATION_SEC = 600;

type AkoolEnvelope<T> = {
  code: number;
  msg: string;
  data?: T;
  token?: string;
};

export type AkoolAgoraCredentials = {
  agora_app_id: string;
  agora_channel: string;
  agora_token: string;
  agora_uid: number;
};

export type LiveAvatarSession = {
  sessionId: string;
  credentials: AkoolAgoraCredentials;
  streamType?: string;
};

export type StreamingAvatarItem = {
  avatar_id: string;
  name: string;
  thumbnail?: string;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getAkoolTokenCached(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  const token = await getAkoolToken();
  if (!token) {
    throw new Error("Akool authentication failed");
  }
  tokenCache = {
    token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };
  return token;
}

async function akoolBearerHeaders(): Promise<HeadersInit> {
  const token = await getAkoolTokenCached();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function parseAgoraCredentials(
  raw: Record<string, unknown> | undefined
): AkoolAgoraCredentials {
  const cred = (raw?.credentials ?? raw) as Record<string, unknown>;
  const appId = String(cred.agora_app_id ?? "");
  const channel = String(cred.agora_channel ?? "");
  const agoraToken = String(cred.agora_token ?? "");
  const uid = Number(cred.agora_uid ?? 0);
  if (!appId || !channel || !agoraToken || !Number.isFinite(uid)) {
    throw new Error("Agora credentials incomplete from Akool session");
  }
  return {
    agora_app_id: appId,
    agora_channel: channel,
    agora_token: agoraToken,
    agora_uid: uid,
  };
}

function pickAvatarList(data: unknown): StreamingAvatarItem[] {
  if (!data) return [];
  const root = data as Record<string, unknown>;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(root.list)
      ? root.list
      : Array.isArray(root.result)
        ? root.result
        : Array.isArray(root.avatars)
          ? root.avatars
          : [];

  const mapped: StreamingAvatarItem[] = [];
  for (const item of list) {
    const row = item as Record<string, unknown>;
    const avatar_id = String(row.avatar_id ?? row._id ?? row.id ?? "").trim();
    if (!avatar_id) continue;
    mapped.push({
      avatar_id,
      name: String(row.name ?? row.avatar_name ?? avatar_id),
      thumbnail: String(
        row.thumbnail ?? row.thumbnail_url ?? row.url ?? row.cover ?? ""
      ) || undefined,
    });
  }
  return mapped;
}

export async function listStreamingAvatars(): Promise<StreamingAvatarItem[]> {
  const headers = await akoolBearerHeaders();

  const urls = [
    `${AKOOL_OPENAPI}/v3/liveAvatar/avatar/list?page=1&size=100`,
    `${AKOOL_OPENAPI}/v4/liveAvatar/avatar/list?platform=open&page=1&size=100`,
    `${AKOOL_OPENAPI}/v3/avatar/list?type=2&page=1&size=100`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { method: "GET", headers });
      const json = (await response.json()) as AkoolEnvelope<unknown>;
      if (json.code === 1000) {
        const avatars = pickAvatarList(json.data);
        if (avatars.length > 0) return avatars;
      }
    } catch {
      /* try next endpoint */
    }
  }

  const fallbackId = process.env.AKOOL_DEFAULT_AVATAR_ID?.trim();
  if (fallbackId) {
    return [{ avatar_id: fallbackId, name: fallbackId }];
  }

  return [];
}

export async function createLiveAvatarSession(params: {
  avatarId: string;
  durationSec?: number;
  language?: string;
}): Promise<LiveAvatarSession> {
  const headers = await akoolBearerHeaders();
  const duration = Math.min(
    params.durationSec ?? LIVE_AVATAR_DEFAULT_DURATION_SEC,
    3600
  );

  const body = {
    avatar_id: params.avatarId,
    duration,
    stream_type: "agora",
    mode_type: 2,
    language: params.language ?? "de",
    scene_mode: "fast_dialogue",
    voice_params: {
      stt_language: params.language ?? "de",
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    },
  };

  const endpoints = [
    `${AKOOL_OPENAPI}/v3/liveAvatar/session/create`,
    `${AKOOL_OPENAPI}/v4/liveAvatar/session/create`,
  ];

  let lastError = "Session creation failed";

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = (await response.json()) as AkoolEnvelope<
        Record<string, unknown>
      >;
      if (json.code === 1000 && json.data) {
        const sessionId = String(json.data._id ?? json.data.session_id ?? "");
        const credentials = parseAgoraCredentials(json.data);
        if (!sessionId) {
          throw new Error("Akool session id missing");
        }
        return {
          sessionId,
          credentials,
          streamType: String(json.data.stream_type ?? "agora"),
        };
      }
      lastError = json.msg || lastError;
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }

  throw new Error(lastError);
}

export async function closeLiveAvatarSession(sessionId: string): Promise<void> {
  const headers = await akoolBearerHeaders();
  const endpoints = [
    `${AKOOL_OPENAPI}/v4/liveAvatar/session/close`,
    `${AKOOL_OPENAPI}/v3/liveAvatar/session/close`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          _id: sessionId,
          id: sessionId,
        }),
      });
      const json = (await response.json()) as AkoolEnvelope<unknown>;
      if (json.code === 1000) return;
    } catch {
      /* try next */
    }
  }
}
