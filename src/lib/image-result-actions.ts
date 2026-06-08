export async function copyTextToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  try {
    await navigator.clipboard.writeText(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function openImageInNewTab(url: string): void {
  const trimmed = url.trim();
  if (!trimmed) return;
  window.open(trimmed, "_blank", "noopener,noreferrer");
}

export function openVideoInNewTab(url: string): void {
  openImageInNewTab(url);
}

export function videoDownloadUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("/api/generated-video/")) {
    return trimmed;
  }
  if (trimmed.includes("download=1")) {
    return trimmed;
  }
  return `${trimmed}${trimmed.includes("?") ? "&" : "?"}download=1`;
}

export async function downloadVideoFromUrl(
  url: string,
  filename = "influexai-video.mp4"
): Promise<{ ok: true } | { ok: false; error: string }> {
  return downloadImageFromUrl(videoDownloadUrl(url), filename);
}

export async function downloadImageFromUrl(
  url: string,
  filename = "influexai-bild.jpg"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, error: "Keine Bild-URL vorhanden." };
  }

  try {
    const res = await fetch(trimmed, { credentials: "same-origin" });
    if (!res.ok) {
      return { ok: false, error: "Download fehlgeschlagen." };
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    return { ok: true };
  } catch {
    openImageInNewTab(trimmed);
    return { ok: true };
  }
}

export function galleryImageHref(): string {
  return "/dashboard/gallery?filter=image";
}

export function downloadTextAsFile(
  text: string,
  filename = "influexai-text.txt"
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const blob = new Blob([trimmed], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
  return true;
}
