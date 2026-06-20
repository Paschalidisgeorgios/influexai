import { describe, expect, it } from "vitest";
import {
  galleryImageBadgeLabel,
  galleryImageRegenerateHref,
  inferGenerationProvider,
} from "@/lib/gallery-generation-label";

describe("gallery-generation-label", () => {
  it("labels generate-image rows as Bild Generator", () => {
    expect(galleryImageBadgeLabel("image", "creator")).toBe("Bild Generator");
    expect(galleryImageRegenerateHref("image", "creator")).toBe(
      "/dashboard/image-generator"
    );
  });

  it("labels ki-ich separately", () => {
    expect(galleryImageBadgeLabel("ki-ich", null)).toBe("KI-Ich");
    expect(galleryImageRegenerateHref("ki-ich", null)).toBe("/dashboard/ki-ich");
  });

  it("infers provider from model id", () => {
    expect(inferGenerationProvider("krea/v2/large/text-to-image")).toBe("krea");
    expect(inferGenerationProvider("fal-ai/flux/dev")).toBe("fal");
    expect(inferGenerationProvider(null)).toBeNull();
  });
});
