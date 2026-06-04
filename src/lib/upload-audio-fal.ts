import { fal } from "@fal-ai/client";
import { configureFalClient } from "@/lib/fal-image";

export function parseAudioDataUrl(dataUrl: string): {
  buffer: Buffer;
  mimeType: string;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Ungültiges Audio-Format");
  }
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { buffer, mimeType };
}

export async function uploadAudioDataUrlToFal(
  audioDataUrl: string
): Promise<string> {
  configureFalClient();
  const { buffer, mimeType } = parseAudioDataUrl(audioDataUrl);
  const ext = mimeType.includes("webm") ? "webm" : "mp3";
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const file = new File([blob], `speech.${ext}`, { type: mimeType });
  return fal.storage.upload(file);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = blob.type || "audio/webm";
  return `data:${mimeType};base64,${base64}`;
}
