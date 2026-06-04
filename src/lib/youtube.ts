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
