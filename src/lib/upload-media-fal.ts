import { fal } from "@fal-ai/client";
import { configureFalClient } from "@/lib/fal-image";

export async function uploadFileToFal(file: File): Promise<string> {
  configureFalClient();
  return fal.storage.upload(file);
}

export async function uploadDataUrlImageToFal(dataUrl: string): Promise<string> {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";
  const ext = mimeType.split("/")[1] ?? "jpg";
  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], `upload.${ext}`, { type: mimeType });
  return uploadFileToFal(file);
}
