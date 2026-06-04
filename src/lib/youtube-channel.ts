/**
 * YouTube channel URL parsing + Data API v3 (requires YOUTUBE_API_KEY).
 */

export type YouTubeChannelStats = {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
};

export type YouTubeChannelVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  viewCount: number;
};

export type YouTubeChannelBundle = {
  channel: YouTubeChannelStats;
  topVideos: YouTubeChannelVideo[];
  recentVideos: YouTubeChannelVideo[];
  computedPostingFrequency: string;
  computedAvgViews: number;
};

function getApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key || null;
}

export function parseYouTubeChannelInput(raw: string): {
  type: "id" | "handle" | "legacy_slug";
  value: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^UC[\w-]{20,}$/i.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.slice(1) };
  }

  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    const host = parsed.hostname.replace(/^www\./, "");
    if (
      host !== "youtube.com" &&
      host !== "m.youtube.com" &&
      host !== "music.youtube.com"
    ) {
      return null;
    }

    const channelMatch = parsed.pathname.match(/^\/channel\/([^/?]+)/i);
    if (channelMatch) return { type: "id", value: channelMatch[1] };

    const handleMatch = parsed.pathname.match(/^\/@([^/?]+)/i);
    if (handleMatch) return { type: "handle", value: handleMatch[1] };

    const userMatch = parsed.pathname.match(/^\/user\/([^/?]+)/i);
    if (userMatch) return { type: "legacy_slug", value: userMatch[1] };

    const cMatch = parsed.pathname.match(/^\/c\/([^/?]+)/i);
    if (cMatch) return { type: "legacy_slug", value: cMatch[1] };
  } catch {
    return null;
  }

  if (/^[\w.-]{2,}$/.test(trimmed)) {
    return { type: "handle", value: trimmed };
  }

  return null;
}

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("YOUTUBE_API_KEY fehlt");

  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function resolveChannelId(
  parsed: { type: "id" | "handle" | "legacy_slug"; value: string }
): Promise<string | null> {
  if (parsed.type === "id") return parsed.value;

  if (parsed.type === "handle") {
    const data = await ytFetch<{
      items?: Array<{ id?: string }>;
    }>("channels", {
      part: "id",
      forHandle: parsed.value,
    });
    return data.items?.[0]?.id ?? null;
  }

  const search = await ytFetch<{
    items?: Array<{ id?: { channelId?: string } }>;
  }>("search", {
    part: "snippet",
    type: "channel",
    q: parsed.value,
    maxResults: "5",
  });

  const match = search.items?.find(
    (i) =>
      i.id?.channelId &&
      (i as { snippet?: { customUrl?: string } }).snippet?.customUrl
        ?.toLowerCase()
        .includes(parsed.value.toLowerCase())
  );
  return match?.id?.channelId ?? search.items?.[0]?.id?.channelId ?? null;
}

async function fetchChannelStats(channelId: string): Promise<YouTubeChannelStats> {
  const data = await ytFetch<{
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        description?: string;
        thumbnails?: { high?: { url?: string }; default?: { url?: string } };
      };
      statistics?: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
      };
    }>;
  }>("channels", {
    part: "statistics,snippet",
    id: channelId,
  });

  const item = data.items?.[0];
  if (!item?.snippet?.title) {
    throw new Error("Kanal nicht gefunden.");
  }

  const thumbs = item.snippet.thumbnails;
  return {
    channelId,
    title: item.snippet.title,
    description: (item.snippet.description ?? "").slice(0, 2000),
    thumbnailUrl: thumbs?.high?.url ?? thumbs?.default?.url ?? null,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
    totalViews: Number(item.statistics?.viewCount ?? 0),
    videoCount: Number(item.statistics?.videoCount ?? 0),
  };
}

async function searchChannelVideos(
  channelId: string,
  order: "viewCount" | "date",
  maxResults: number
): Promise<string[]> {
  const data = await ytFetch<{
    items?: Array<{ id?: { videoId?: string } }>;
  }>("search", {
    part: "snippet",
    channelId,
    type: "video",
    order,
    maxResults: String(maxResults),
  });

  return (data.items ?? [])
    .map((i) => i.id?.videoId)
    .filter((id): id is string => !!id);
}

async function fetchVideoDetails(
  videoIds: string[]
): Promise<YouTubeChannelVideo[]> {
  if (videoIds.length === 0) return [];

  const unique = [...new Set(videoIds)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) {
    chunks.push(unique.slice(i, i + 50));
  }

  const videos: YouTubeChannelVideo[] = [];

  for (const chunk of chunks) {
    const data = await ytFetch<{
      items?: Array<{
        id?: string;
        snippet?: {
          title?: string;
          publishedAt?: string;
          thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
        };
        statistics?: { viewCount?: string };
      }>;
    }>("videos", {
      part: "statistics,snippet",
      id: chunk.join(","),
    });

    for (const item of data.items ?? []) {
      if (!item.id || !item.snippet?.title) continue;
      const thumbs = item.snippet.thumbnails;
      videos.push({
        videoId: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt ?? "",
        thumbnailUrl: thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
        viewCount: Number(item.statistics?.viewCount ?? 0),
      });
    }
  }

  return videos;
}

function computePostingFrequency(recent: YouTubeChannelVideo[]): string {
  if (recent.length < 2) return "Unbekannt (zu wenige Videos)";

  const dates = recent
    .map((v) => new Date(v.publishedAt).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a);

  if (dates.length < 2) return "Unbekannt";

  let totalGap = 0;
  for (let i = 0; i < dates.length - 1; i++) {
    totalGap += dates[i] - dates[i + 1];
  }
  const avgDays = totalGap / (dates.length - 1) / 86400000;

  if (avgDays < 1.5) return "Täglich (~1 Video/Tag)";
  if (avgDays < 4) return `Alle ${Math.round(avgDays)} Tage`;
  if (avgDays < 10) return `~${Math.round(avgDays)} Tage zwischen Uploads`;
  if (avgDays < 20) return "1–2× pro Woche";
  return "Seltener als wöchentlich";
}

export async function fetchYouTubeChannelBundle(
  channelInput: string
): Promise<YouTubeChannelBundle> {
  const parsed = parseYouTubeChannelInput(channelInput);
  if (!parsed) {
    throw new Error("Ungültige YouTube-Kanal-URL oder @handle.");
  }

  const channelId = await resolveChannelId(parsed);
  if (!channelId) {
    throw new Error("Kanal konnte nicht gefunden werden.");
  }

  const channel = await fetchChannelStats(channelId);

  const [topIds, recentIds] = await Promise.all([
    searchChannelVideos(channelId, "viewCount", 50),
    searchChannelVideos(channelId, "date", 20),
  ]);

  const allIds = [...new Set([...topIds, ...recentIds])];
  const allVideos = await fetchVideoDetails(allIds);
  const byId = new Map(allVideos.map((v) => [v.videoId, v]));

  const topVideos = topIds
    .map((id) => byId.get(id))
    .filter((v): v is YouTubeChannelVideo => !!v)
    .sort((a, b) => b.viewCount - a.viewCount);

  const recentVideos = recentIds
    .map((id) => byId.get(id))
    .filter((v): v is YouTubeChannelVideo => !!v)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  const computedAvgViews =
    topVideos.length > 0
      ? Math.round(
          topVideos.reduce((s, v) => s + v.viewCount, 0) / topVideos.length
        )
      : 0;

  return {
    channel,
    topVideos,
    recentVideos,
    computedPostingFrequency: computePostingFrequency(recentVideos),
    computedAvgViews,
  };
}
