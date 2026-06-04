const AKOOL_BASE_URL = "https://openapi.akool.com/api/open/v3";

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

export async function getAkoolToken(): Promise<string | null> {
  const clientId = process.env.AKOOL_CLIENT_ID;
  const clientSecret = process.env.AKOOL_API_KEY;
  if (!clientId || !clientSecret) return null;

  const response = await fetch(`${AKOOL_BASE_URL}/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  const data = (await response.json()) as AkoolResponse<{ token?: string }> & {
    token?: string;
  };
  return data.data?.token ?? data.token ?? null;
}

export function getAkoolApiKey(): string | undefined {
  return process.env.AKOOL_API_KEY;
}

export async function akoolAuthHeaders(): Promise<HeadersInit> {
  const apiKey = getAkoolApiKey();
  if (apiKey) {
    return { "x-api-key": apiKey, "Content-Type": "application/json" };
  }
  const token = await getAkoolToken();
  if (!token) {
    throw new Error("Akool authentication failed");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createTalkingPhotoVideo(body: {
  talking_photo_url: string;
  audio_url: string;
  resolution?: "720p" | "1080p";
}): Promise<AkoolVideoJob> {
  const headers = await akoolAuthHeaders();
  const response = await fetch(
    `${AKOOL_BASE_URL}/content/video/createbytalkingphoto`,
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
  const url = `${AKOOL_BASE_URL}/content/video/infobymodelid?video_model_id=${encodeURIComponent(videoModelId)}`;
  const response = await fetch(url, { method: "GET", headers });
  const json = (await response.json()) as AkoolResponse<AkoolVideoJob>;
  if (json.code !== 1000 || !json.data) {
    throw new Error(json.msg || "Akool status check failed");
  }
  return json.data;
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
