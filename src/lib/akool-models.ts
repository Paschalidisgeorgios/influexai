import { getAkoolApiKey, akoolGet, akoolPost, akoolApiKeyHeaders } from "@/lib/akool";
const AKOOL_V4_BASE = "https://openapi.akool.com/api/open/v4";
const MODEL_LIST_IMAGE_TO_VIDEO = 1501;
const MODEL_LIST_TEXT_TO_VIDEO = 1502;
const CACHE_TTL_MS = 60 * 60 * 1000;

export type AkoolResolutionOption = {
  value: string;
  label: string;
  unit_credit: number;
  durationList?: number[];
};

export type AkoolImageToVideoModel = {
  value: string;
  label: string;
  provider: string;
  providerLabel: string;
  description?: string;
  durationList: number[];
  resolutionList: AkoolResolutionOption[];
  supportedLastFrame: boolean;
  isPro: boolean;
  sort: number;
};

type AkoolModelListResponse = {
  code: number;
  msg: string;
  data?: RawAkoolModel[];
};

type RawResolution = {
  value: string;
  label: string;
  unit_credit?: number;
  durationList?: number[];
};

type RawAkoolModel = {
  sort?: number;
  provider?: string;
  label?: string;
  value?: string;
  description?: string;
  resolutionList?: RawResolution[];
  isPro?: boolean;
  durationList?: number[];
  supportedLastFrame?: boolean;
};

type Image2VideoCreateResponse = {
  code: number;
  msg: string;
  data?: {
    _id?: string;
    jobId?: string;
    status?: number;
  };
  jobId?: string;
};

type Image2VideoInfoResponse = {
  code: number;
  msg: string;
  data?: {
    _id?: string;
    status?: number;
    video_url?: string;
    videoUrl?: string;
    result?: Array<{
      _id?: string;
      status?: number;
      video_url?: string;
    }>;
  };
};

type Image2VideoResultsResponse = {
  code: number;
  msg: string;
  data?: {
    result?: Array<{
      _id?: string;
      status?: number;
      video_url?: string;
    }>;
  };
};

let modelsCache: { fetchedAt: number; models: AkoolImageToVideoModel[] } | null =
  null;

const DEFAULT_UNIT_CREDIT: Record<string, number> = {
  "480p": 3,
  "720p": 4,
  "768p": 4,
  "768P": 4,
  "1080p": 5,
  "1080P": 5,
  "4k": 6,
  "1280x720": 4,
  "720x1280": 4,
};

const PROVIDER_LABELS: Record<string, string> = {
  akool: "Akool",
  seedance: "Seedance",
  kwaivgi: "Kling",
  kling: "Kling",
  minimax: "Minimax",
  vidu: "Vidu",
  openai: "OpenAI",
};

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, distorted, low quality, watermark, text, logo, static, worst quality";

export function getProviderLabel(provider: string): string {
  const key = provider.trim().toLowerCase();
  return PROVIDER_LABELS[key] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

function resolveUnitCredit(res: RawResolution, isPro: boolean): number {
  if (typeof res.unit_credit === "number" && res.unit_credit > 0) {
    return res.unit_credit;
  }
  const base = DEFAULT_UNIT_CREDIT[res.value] ?? DEFAULT_UNIT_CREDIT[res.label] ?? 5;
  return isPro ? Math.ceil(base * 1.25) : base;
}

function normalizeResolutionList(
  raw: RawAkoolModel
): AkoolResolutionOption[] {
  const isPro = raw.isPro === true;
  const fromApi = (raw.resolutionList ?? []).map((res) => ({
    value: res.value,
    label: res.label || res.value,
    unit_credit: resolveUnitCredit(res, isPro),
    durationList: res.durationList?.length ? [...res.durationList] : undefined,
  }));

  if (fromApi.length > 0) return fromApi;

  return [
    {
      value: "720p",
      label: "720p",
      unit_credit: isPro ? 6 : 4,
    },
  ];
}

function normalizeDurationList(
  raw: RawAkoolModel,
  resolutions: AkoolResolutionOption[]
): number[] {
  const topLevel = raw.durationList ?? [];
  if (topLevel.length > 0) return [...topLevel].sort((a, b) => a - b);

  const nested = resolutions.flatMap((r) => r.durationList ?? []);
  if (nested.length > 0) {
    return [...new Set(nested)].sort((a, b) => a - b);
  }

  return [5];
}

function parseModel(raw: RawAkoolModel): AkoolImageToVideoModel | null {
  if (!raw.value?.trim() || !raw.label?.trim()) return null;

  const resolutionList = normalizeResolutionList(raw);
  const durationList = normalizeDurationList(raw, resolutionList);
  const provider = (raw.provider ?? "akool").trim().toLowerCase();

  return {
    value: raw.value.trim(),
    label: raw.label.trim(),
    provider,
    providerLabel: getProviderLabel(provider),
    description: raw.description?.trim(),
    durationList,
    resolutionList,
    supportedLastFrame: raw.supportedLastFrame === true,
    isPro: raw.isPro === true,
    sort: typeof raw.sort === "number" ? raw.sort : 0,
  };
}

export function calculateAkoolModelCredits(
  model: AkoolImageToVideoModel,
  resolution: string,
  duration: number
): number {
  const res =
    model.resolutionList.find(
      (item) => item.value.toLowerCase() === resolution.toLowerCase()
    ) ?? model.resolutionList[0];

  if (!res) return 0;
  return Math.max(1, Math.round(res.unit_credit * duration));
}

export function getDurationsForModel(
  model: AkoolImageToVideoModel,
  resolution?: string
): number[] {
  if (resolution) {
    const res = model.resolutionList.find(
      (item) => item.value.toLowerCase() === resolution.toLowerCase()
    );
    if (res?.durationList?.length) {
      return [...res.durationList].sort((a, b) => a - b);
    }
  }
  return model.durationList;
}

export async function getAkoolImageToVideoModels(options?: {
  forceRefresh?: boolean;
}): Promise<AkoolImageToVideoModel[]> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    modelsCache &&
    now - modelsCache.fetchedAt < CACHE_TTL_MS
  ) {
    return modelsCache.models;
  }

  const apiKey = getAkoolApiKey();
  if (!apiKey) {
    throw new Error("Akool API key fehlt (AKOOL_API_KEY)");
  }

  const json = await akoolGet<RawAkoolModel[]>(
    "/v4/aigModel/list",
    { "types[]": String(MODEL_LIST_IMAGE_TO_VIDEO) }
  );
  if (json.code !== 1000 || !Array.isArray(json.data)) {
    throw new Error(json.msg || "Akool Modellliste konnte nicht geladen werden");
  }

  const models = json.data
    .map(parseModel)
    .filter((model): model is AkoolImageToVideoModel => model !== null)
    .filter(
      (model) => model.durationList.length > 0 && model.resolutionList.length > 0
    )
    .sort((a, b) => b.sort - a.sort);

  modelsCache = { fetchedAt: now, models };
  return models;
}

let textModelsCache: {
  fetchedAt: number;
  models: AkoolImageToVideoModel[];
} | null = null;

export async function getAkoolTextToVideoModels(options?: {
  forceRefresh?: boolean;
}): Promise<AkoolImageToVideoModel[]> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    textModelsCache &&
    now - textModelsCache.fetchedAt < CACHE_TTL_MS
  ) {
    return textModelsCache.models;
  }

  if (!getAkoolApiKey()) {
    throw new Error("Akool API key fehlt (AKOOL_API_KEY)");
  }

  const json = await akoolGet<RawAkoolModel[]>(
    "/v4/aigModel/list",
    { "types[]": String(MODEL_LIST_TEXT_TO_VIDEO) }
  );

  if (json.code !== 1000 || !Array.isArray(json.data)) {
    throw new Error(json.msg || "Text-to-Video Modelle konnten nicht geladen werden");
  }

  const models = json.data
    .map(parseModel)
    .filter((model): model is AkoolImageToVideoModel => model !== null)
    .filter(
      (model) => model.durationList.length > 0 && model.resolutionList.length > 0
    )
    .sort((a, b) => b.sort - a.sort);

  textModelsCache = { fetchedAt: now, models };
  return models;
}

export async function findAkoolTextToVideoModel(
  modelId: string
): Promise<AkoolImageToVideoModel | null> {
  const models = await getAkoolTextToVideoModels();
  return (
    models.find(
      (model) => model.value.toLowerCase() === modelId.trim().toLowerCase()
    ) ?? null
  );
}

export async function findAkoolImageToVideoModel(
  modelId: string
): Promise<AkoolImageToVideoModel | null> {
  const models = await getAkoolImageToVideoModels();
  return (
    models.find(
      (model) => model.value.toLowerCase() === modelId.trim().toLowerCase()
    ) ?? null
  );
}

export async function getDefaultAkoolImageToVideoModel(): Promise<AkoolImageToVideoModel | null> {
  const models = await getAkoolImageToVideoModels();
  return models[0] ?? null;
}

function mapAkoolJobStatus(
  status: number | undefined
): "processing" | "completed" | "failed" {
  if (status === 3) return "completed";
  if (status === 4) return "failed";
  return "processing";
}

async function createViaSourcePrompt(body: {
  model: string;
  image_url: string;
  prompt: string;
  duration: number;
  resolution: string;
  last_frame_url?: string;
}): Promise<string> {
  const response = await fetch(
    `${AKOOL_V4_BASE}/image2Video/createBySourcePrompt`,
    {
      method: "POST",
      headers: akoolApiKeyHeaders(),
      body: JSON.stringify({
        model_name: body.model,
        image_url: body.image_url,
        prompt: body.prompt,
        negative_prompt: DEFAULT_NEGATIVE_PROMPT,
        extend_prompt: true,
        resolution: body.resolution,
        video_length: body.duration,
        last_image_url: body.last_frame_url,
        audio_type: 3,
        webhookurl: "",
      }),
    }
  );

  const json = (await response.json()) as Image2VideoCreateResponse;
  const jobId = json.data?._id ?? json.data?.jobId ?? json.jobId;
  if (json.code !== 1000 || !jobId) {
    throw new Error(json.msg || "Akool Video-Erstellung fehlgeschlagen");
  }
  return jobId;
}

export async function createAkoolImage2VideoJob(body: {
  model: string;
  image_url: string;
  prompt: string;
  duration: number;
  resolution: string;
  last_frame_url?: string;
}): Promise<{ jobId: string }> {
  try {
    const response = await fetch(`${AKOOL_V4_BASE}/image2video/create`, {
      method: "POST",
      headers: akoolApiKeyHeaders(),
      body: JSON.stringify({
        model: body.model,
        image_url: body.image_url,
        prompt: body.prompt,
        duration: body.duration,
        resolution: body.resolution,
        last_frame_url: body.last_frame_url,
      }),
    });

    const json = (await response.json()) as Image2VideoCreateResponse;
    const jobId = json.data?._id ?? json.data?.jobId ?? json.jobId;
    if (json.code === 1000 && jobId) {
      return { jobId };
    }
  } catch {
    /* fallback to documented endpoint */
  }

  const jobId = await createViaSourcePrompt(body);
  return { jobId };
}

async function fetchImage2VideoInfo(jobId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(
      `${AKOOL_V4_BASE}/image2video/info?_id=${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: akoolApiKeyHeaders(),
        signal: controller.signal,
      }
    );
    const json = (await response.json()) as Image2VideoInfoResponse;
    if (json.code !== 1000 || !json.data) return null;

    const row = json.data.result?.[0] ?? json.data;
    const status = mapAkoolJobStatus(row.status ?? json.data.status);
    const videoUrl = row.video_url ?? json.data.video_url ?? json.data.videoUrl;

    return { status, videoUrl: videoUrl ?? undefined };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchImage2VideoResultsByIds(jobId: string) {
  const response = await fetch(`${AKOOL_V4_BASE}/image2Video/resultsByIds`, {
    method: "POST",
    headers: akoolApiKeyHeaders(),
    body: JSON.stringify({ _ids: jobId }),
  });
  const json = (await response.json()) as Image2VideoResultsResponse;
  if (json.code !== 1000) {
    throw new Error(json.msg || "Akool Status-Abfrage fehlgeschlagen");
  }

  const row = json.data?.result?.[0];
  if (!row) {
    return { status: "processing" as const, videoUrl: undefined };
  }

  return {
    status: mapAkoolJobStatus(row.status),
    videoUrl: row.video_url,
  };
}

export async function getAkoolImage2VideoStatus(jobId: string): Promise<{
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
}> {
  const info = await fetchImage2VideoInfo(jobId);
  if (info) return info;
  return fetchImage2VideoResultsByIds(jobId);
}

export function groupAkoolModelsByProvider(
  models: AkoolImageToVideoModel[]
): Record<string, AkoolImageToVideoModel[]> {
  const groups: Record<string, AkoolImageToVideoModel[]> = {};
  for (const model of models) {
    if (!groups[model.providerLabel]) {
      groups[model.providerLabel] = [];
    }
    groups[model.providerLabel].push(model);
  }
  return groups;
}
