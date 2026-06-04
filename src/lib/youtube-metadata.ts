/**
 * Optional YouTube Data API v3 metadata (requires YOUTUBE_API_KEY).
 * Video Remix works without it — URL parsing only uses extractYouTubeVideoId.
 */

export type YouTubeVideoSnippet = {
  title: string;
  description: string;
  channelTitle: string;
};

export async function fetchYouTubeVideoSnippet(
  videoId: string
): Promise<YouTubeVideoSnippet | null> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey || !videoId) return null;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("id", videoId);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error("YouTube API:", res.status, await res.text().then((t) => t.slice(0, 300)));
      return null;
    }

    const data = (await res.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
        };
      }>;
    };

    const snippet = data.items?.[0]?.snippet;
    if (!snippet?.title) return null;

    return {
      title: snippet.title,
      description: (snippet.description ?? "").slice(0, 2000),
      channelTitle: snippet.channelTitle ?? "",
    };
  } catch (e) {
    console.error("fetchYouTubeVideoSnippet:", e);
    return null;
  }
}
