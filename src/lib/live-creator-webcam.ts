import { LIVE_CREATOR_FRAME_SIZE } from "@/lib/live-creator-config";

export function toJpegDataUrl(
  canvas: HTMLCanvasElement,
  quality = 0.82
): string {
  return canvas.toDataURL("image/jpeg", quality);
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  size = LIVE_CREATOR_FRAME_SIZE
): string | null {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;

  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  return toJpegDataUrl(canvas);
}

export async function loadImageAsDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;

  const res = await fetch(src, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Charakterbild konnte nicht geladen werden");
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Charakterbild konnte nicht gelesen werden"));
    reader.readAsDataURL(blob);
  });
}

export type FlashheadRealtimeResult = {
  image?: { url?: string; content?: string; content_type?: string };
  video?: { url?: string };
  frame?: { url?: string; content?: string; content_type?: string };
  data?: {
    image?: { url?: string; content?: string; content_type?: string };
    video?: { url?: string };
  };
};

export function extractRealtimeFrameUrl(
  result: FlashheadRealtimeResult
): string | null {
  const img =
    result.image ??
    result.frame ??
    result.data?.image;

  if (img?.url) return img.url;
  if (img?.content) {
    const type = img.content_type ?? "image/jpeg";
    return `data:${type};base64,${img.content}`;
  }

  const videoUrl = result.video?.url ?? result.data?.video?.url;
  return videoUrl ?? null;
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Upload fehlgeschlagen"));
    reader.readAsDataURL(file);
  });
}
