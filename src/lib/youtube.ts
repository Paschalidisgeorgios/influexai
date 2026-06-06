/** Extract YouTube video ID from common URL formats (no API call). */
export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const shorts = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];

      const embed = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) return embed[1];

      const live = parsed.pathname.match(/^\/live\/([^/?]+)/);
      if (live) return live[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export type TrendVideo = { title: string; description: string; views: number };

export async function fetchTrendingVideos(
  query: string,
  region: string = "DE"
): Promise<TrendVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY fehlt");

  const publishedAfter = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "viewCount");
  searchUrl.searchParams.set("maxResults", "10");
  searchUrl.searchParams.set("regionCode", region);
  searchUrl.searchParams.set("relevanceLanguage", region === "DE" ? "de" : "en");
  searchUrl.searchParams.set("publishedAfter", publishedAfter);
  searchUrl.searchParams.set("key", key);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    throw new Error(`YouTube search fehlgeschlagen: ${searchRes.status}`);
  }
  const searchData = (await searchRes.json()) as {
    items?: { id?: { videoId?: string } }[];
  };
  const ids: string[] = (searchData.items ?? [])
    .map((it) => it.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "snippet,statistics");
  videosUrl.searchParams.set("id", ids.join(","));
  videosUrl.searchParams.set("key", key);

  const videosRes = await fetch(videosUrl.toString());
  if (!videosRes.ok) {
    throw new Error(`YouTube videos fehlgeschlagen: ${videosRes.status}`);
  }
  const videosData = (await videosRes.json()) as {
    items?: {
      snippet?: { title?: string; description?: string };
      statistics?: { viewCount?: string };
    }[];
  };

  return (videosData.items ?? []).map((v) => ({
    title: v.snippet?.title ?? "",
    description: (v.snippet?.description ?? "").slice(0, 500),
    views: Number(v.statistics?.viewCount ?? 0),
  }));
}
