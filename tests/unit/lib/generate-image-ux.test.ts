import { describe, it, expect } from "vitest";
import {
  GENERATE_IMAGE_CREDIT_PILL_LABEL,
  formatGenerateImageCreditsPerImage,
  getGenerateImageCreditCost,
  getGenerateImageCreditPillLabel,
  getGenerateImageCtaLabel,
} from "@/lib/generate-image-ux";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";

describe("generate-image-ux credit copy", () => {
  it("uses 5 Credits pro Bild as default pill label", () => {
    expect(GENERATE_IMAGE_CREDIT_PILL_LABEL).toBe("5 Credits pro Bild");
    expect(getGenerateImageCreditPillLabel(false)).toBe("5 Credits pro Bild");
  });

  it("shows explicit per-image cost for high-res selection", () => {
    expect(getGenerateImageCreditCost(false)).toBe(5);
    expect(getGenerateImageCreditCost(true)).toBe(8);
    expect(getGenerateImageCreditPillLabel(true)).toBe("8 Credits pro Bild");
    expect(formatGenerateImageCreditsPerImage(8)).toBe("8 Credits pro Bild");
  });

  it("builds CTA label from selected quality", () => {
    expect(getGenerateImageCtaLabel(false)).toBe("Bild generieren — 5 Credits");
    expect(getGenerateImageCtaLabel(true)).toBe("Bild generieren — 8 Credits");
  });

  it("aligns credit-display SSOT with runtime pill", () => {
    expect(getCreditDisplayLabel("image-gen")).toBe("5 Credits pro Bild");
    expect(getCreditDisplayLabel("image-gen", { highRes: true })).toBe(
      "8 Credits pro Bild"
    );
  });
});
