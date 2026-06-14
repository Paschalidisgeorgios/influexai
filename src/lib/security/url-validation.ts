/** Returns true for https URLs that are not localhost/private/link-local. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    if (hostname.startsWith("10.")) return false;
    if (hostname.startsWith("192.168.")) return false;
    if (hostname.startsWith("169.254.")) return false;

    const parts = hostname.split(".");
    if (parts[0] === "172" && parts.length === 4) {
      const second = Number.parseInt(parts[1] ?? "", 10);
      if (second >= 16 && second <= 31) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/** Validates http(s) user-supplied URLs; returns an error message or null if OK/skipped. */
export function unsafeExternalUrlMessage(
  value: string,
  label = "Bild-/Video-URL"
): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }
  if (!isSafeExternalUrl(trimmed)) {
    return `Ungültige ${label}.`;
  }
  return null;
}

export function firstUnsafeExternalUrlMessage(
  fields: Array<{ value: string; label?: string }>
): string | null {
  for (const field of fields) {
    const message = unsafeExternalUrlMessage(field.value, field.label);
    if (message) return message;
  }
  return null;
}
