export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function generationTypeBadge(
  type: string
): "Script" | "Video" | "Niche" | "Content" {
  const t = type.toLowerCase();
  if (t.includes("script") || t === "produkt" || t.includes("produkt"))
    return "Script";
  if (t.includes("niche") || t.includes("outlier")) return "Niche";
  if (
    t.includes("video") ||
    t.includes("remix") ||
    t.includes("ki-ich") ||
    t === "ki-ich" ||
    t.includes("voice") ||
    t.includes("stimme")
  ) {
    return "Video";
  }
  return "Content";
}

export function badgeColor(
  kind: ReturnType<typeof generationTypeBadge>
): string {
  switch (kind) {
    case "Script":
      return "#B4FF00";
    case "Niche":
      return "#06b6d4";
    case "Video":
      return "#8b5cf6";
    default:
      return "rgba(255,255,255,0.65)";
  }
}

export function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

export function profileInitials(
  fullName: string | null,
  username: string
): string {
  if (fullName?.trim()) {
    return fullName
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return username.slice(0, 2).toUpperCase();
}

export const SITE_URL = "https://influexaicreator.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
