/** Human-readable labels for `generations` rows in gallery UI. */

export function galleryImageBadgeLabel(
  generationType?: string | null,
  category?: string | null
): string {
  const t = (generationType ?? "").toLowerCase();
  if (t === "image" || t.includes("image-generator")) return "Bild Generator";
  if (t.includes("ki-ich")) return "KI-Ich";
  if (t.includes("produkt") || t.includes("product")) return "Produkt";
  if (category?.trim()) {
    const c = category.trim();
    if (c === "creator") return "Bild Generator";
    return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return "Bild";
}

export function galleryImageRegenerateHref(
  generationType?: string | null,
  category?: string | null
): string {
  const t = (generationType ?? "").toLowerCase();
  if (t === "image" || t.includes("image-generator")) return "/dashboard/image-generator";
  if (t.includes("ki-ich")) return "/dashboard/ki-ich";
  if (t.includes("produkt") || t.includes("product")) return "/dashboard/produkt";
  if (category === "creator") return "/dashboard/image-generator";
  return "/dashboard/image-generator";
}

export function inferGenerationProvider(model?: string | null): string | null {
  if (!model?.trim()) return null;
  const m = model.trim().toLowerCase();
  if (m.startsWith("krea/")) return "krea";
  if (m.startsWith("fal-ai/") || m.includes("flux")) return "fal";
  if (m.startsWith("akool")) return "akool";
  return null;
}
