const MAX_TARGET_FACE_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_VIDEO_BYTES = 50 * 1024 * 1024;

const ALLOWED_FACE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_SOURCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type FaceswapMode = "image" | "video";

export function validateTargetFaceFile(file: File | null): string | null {
  if (!file || !(file instanceof File)) {
    return "Ziel-Gesicht fehlt. Bitte ein Porträtfoto hochladen.";
  }
  if (file.size === 0) {
    return "Die Gesichtsdatei ist leer.";
  }
  if (file.size > MAX_TARGET_FACE_BYTES) {
    return "Das Gesichtsfoto darf maximal 10 MB groß sein.";
  }
  if (!ALLOWED_FACE_TYPES.has(file.type)) {
    return "Gesichtsfoto: nur JPEG, PNG oder WebP (kein base64 im Formular — Datei direkt hochladen).";
  }
  return null;
}

export function validateSourceFile(
  file: File | null,
  mode: FaceswapMode
): string | null {
  if (!file || !(file instanceof File)) {
    return mode === "video"
      ? "Quell-Video fehlt."
      : "Quellbild fehlt.";
  }
  if (file.size === 0) {
    return "Die Quelldatei ist leer.";
  }
  if (mode === "video") {
    if (file.size > MAX_SOURCE_VIDEO_BYTES) {
      return "Video darf maximal 50 MB groß sein.";
    }
    if (!ALLOWED_VIDEO_TYPES.has(file.type) && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      return "Video: nur MP4, WebM oder MOV.";
    }
    return null;
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return "Quellbild darf maximal 10 MB groß sein.";
  }
  if (!ALLOWED_SOURCE_IMAGE_TYPES.has(file.type)) {
    return "Quellbild: nur JPEG, PNG oder WebP.";
  }
  return null;
}

/** Akool needs HTTPS URLs reachable from the public internet (no localhost). */
export function assertPublicMediaUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") {
    throw new Error("Upload fehlgeschlagen — keine öffentliche URL erhalten.");
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) {
    throw new Error(
      "Base64-URLs werden von Akool nicht unterstützt. Bitte erneut hochladen."
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Ungültige Medien-URL nach Upload.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Medien-URL muss HTTPS sein (öffentlich erreichbar).");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local")
  ) {
    throw new Error(
      "Medien müssen öffentlich erreichbar sein (kein localhost)."
    );
  }
  return trimmed;
}
