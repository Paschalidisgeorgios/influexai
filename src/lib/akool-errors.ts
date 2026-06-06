import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

/** User-facing copy when face-swap / detect returns no usable face landmarks. */
export const FACE_SWAP_NO_FACE_TARGET =
  "Kein Gesicht im Zielbild erkannt. Bitte ein Foto mit klar sichtbarem Gesicht verwenden.";

export const FACE_SWAP_NO_FACE_SOURCE =
  "Kein Gesicht im Quellfoto erkannt. Bitte ein anderes Gesichtsfoto verwenden.";

export const FACE_SWAP_NO_FACE_IN_VIDEO =
  "Kein Gesicht im Video erkannt. Bitte ein Video mit klar sichtbarem Gesicht verwenden.";

const PYTHON_SHAPE_RE =
  /'NoneType' object has no attribute 'shape'|nonetype.*shape|attribute ['"]shape['"]/i;

const FACE_DETECT_RE =
  /no face|face not found|face detect|landmark|insightface|cannot detect/i;

export function mapAkoolErrorMessage(
  raw: string | undefined | null,
  context: "targetFace" | "sourceMedia" | "general" = "general"
): string {
  const msg = (raw ?? "").trim();
  if (!msg) {
    return context === "targetFace"
      ? FACE_SWAP_NO_FACE_TARGET
      : context === "sourceMedia"
        ? FACE_SWAP_NO_FACE_IN_VIDEO
        : "Face Swap fehlgeschlagen. Bitte andere Bilder verwenden.";
  }

  if (PYTHON_SHAPE_RE.test(msg) || FACE_DETECT_RE.test(msg)) {
    if (context === "targetFace") return FACE_SWAP_NO_FACE_TARGET;
    if (context === "sourceMedia") return FACE_SWAP_NO_FACE_IN_VIDEO;
    return FACE_SWAP_NO_FACE_TARGET;
  }

  if (/authentication|token|unauthorized|api.key|invalid.*key/i.test(msg)) {
    return "InfluexAI LiveSwap™ ist gerade nicht verfügbar. Bitte später erneut versuchen.";
  }

  if (/url|invalid.*link|download|fetch|accessible/i.test(msg)) {
    return "Medien konnten nicht geladen werden. Bitte erneut hochladen.";
  }

  const trimmed = msg.length > 200 ? `${msg.slice(0, 200)}…` : msg;
  return sanitizeUserMessage(trimmed);
}

export class AkoolFaceswapError extends Error {
  constructor(
    message: string,
    readonly userMessage: string
  ) {
    super(message);
    this.name = "AkoolFaceswapError";
  }
}
