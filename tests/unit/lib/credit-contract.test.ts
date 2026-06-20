import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  getPackageById,
  getStripePriceEnvKeysForPackage,
  getStripePriceIdForPackage,
  STRIPE_CREDITS_25_ENV,
  STRIPE_CREDITS_50_LEGACY_ENV,
} from "@/lib/credit-packages";
import {
  creditsForStripePriceId,
  getCreditsByStripePriceId,
} from "@/lib/stripe-credit-prices";
import {
  getCreditAffordanceAmount,
  getCreditDisplayLabel,
  getCreditDisplayMeta,
} from "@/lib/tools/credit-display";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { sumCampaignPlanCredits } from "@/lib/agent/credits";
import type { CampaignPlanStep } from "@/lib/agent/campaignPlanner";

const MESSAGES_DIR = join(process.cwd(), "messages");

function readJsonMessages(): Record<string, string>[] {
  const files = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = readFileSync(join(MESSAGES_DIR, file), "utf8");
    return JSON.parse(raw) as Record<string, string>;
  });
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStrings(v, out);
    }
  }
  return out;
}

describe("credit contract", () => {
  describe("credit packs", () => {
    it("Small pack grants 25 credits, not 50", () => {
      const small = getPackageById("small");
      expect(small).toBeDefined();
      expect(small!.credits).toBe(25);
      expect(small!.envKey).toBe(STRIPE_CREDITS_25_ENV);
    });

    it("prefers STRIPE_CREDITS_25 over legacy STRIPE_CREDITS_50", () => {
      const small = getPackageById("small")!;
      expect(getStripePriceEnvKeysForPackage(small)).toEqual([
        STRIPE_CREDITS_25_ENV,
        STRIPE_CREDITS_50_LEGACY_ENV,
      ]);
    });

    it("maps Stripe price whitelist to 25 credits for Small pack", () => {
      const small = getPackageById("small")!;
      vi.stubEnv(STRIPE_CREDITS_25_ENV, "price_small_25");
      vi.stubEnv(STRIPE_CREDITS_50_LEGACY_ENV, "price_small_legacy");

      const map = getCreditsByStripePriceId();
      expect(map.price_small_25).toBe(25);
      expect(creditsForStripePriceId("price_small_25")).toBe(25);
      expect(getStripePriceIdForPackage(small)).toBe("price_small_25");
    });

    it("falls back to STRIPE_CREDITS_50 when STRIPE_CREDITS_25 is unset", () => {
      const small = getPackageById("small")!;
      vi.unstubAllEnvs();
      vi.stubEnv(STRIPE_CREDITS_50_LEGACY_ENV, "price_small_legacy_only");

      expect(getStripePriceIdForPackage(small)).toBe("price_small_legacy_only");
      expect(creditsForStripePriceId("price_small_legacy_only")).toBe(25);
    });
  });

  describe("top-up copy", () => {
    it("does not advertise €5 (50 Credits) for the small top-up pack", () => {
      const suffixes = readJsonMessages()
        .map((doc) => {
          const pricing = (doc as { landingPage?: { pricing?: { extra_credits_suffix?: string } } })
            .landingPage?.pricing;
          return pricing?.extra_credits_suffix;
        })
        .filter(Boolean) as string[];

      expect(suffixes.length).toBeGreaterThan(0);
      for (const suffix of suffixes) {
        expect(suffix).not.toMatch(/€5 \(50 credits?\)/i);
        expect(suffix).not.toMatch(/€5 \(50 Credits?\)/);
        expect(suffix).not.toMatch(/50 créditos\)/i);
        expect(suffix).not.toMatch(/50 kredi\)/i);
      }
    });
  });

  describe("tool display vs active API deduction", () => {
    it("Viral Hook display matches API cost", () => {
      expect(getCreditAffordanceAmount("viral-hook")).toBe(
        VIRAL_HOOK_EXTRACTOR_CREDIT_COST
      );
      expect(getCreditDisplayLabel("viral-hook")).toBe("1 Credit");
    });

    it("Trend Script display matches API cost", () => {
      expect(getCreditAffordanceAmount("trend-script")).toBe(
        TREND_SCRIPT_TOOL_CREDIT_COST
      );
      expect(getCreditDisplayLabel("trend-script")).toBe("3 Credits");
    });

    it("Content Calendar display matches API cost", () => {
      expect(getCreditAffordanceAmount("content-calendar")).toBe(
        CONTENT_KALENDER_TOOL_CREDIT_COST
      );
      expect(getCreditDisplayLabel("content-calendar")).toBe("2 Credits");
    });

    it("TTS and Ecommerce Ads match fixed API costs", () => {
      expect(getCreditAffordanceAmount("tts")).toBe(3);
      expect(getCreditAffordanceAmount("ecommerce-ads")).toBe(15);
    });

    it("Generate Image standard shows 5 Credits pro Bild (not ambiguous range)", () => {
      expect(getCreditDisplayLabel("image-gen")).toBe("5 Credits pro Bild");
      expect(getCreditDisplayLabel("image-gen", { highRes: true })).toBe(
        "8 Credits pro Bild"
      );
      expect(getCreditAffordanceAmount("image-gen")).toBe(5);
    });

    it("dynamic video tools are not shown as a single misleading fixed number", () => {
      const imgToVideo = getCreditDisplayMeta("img-to-video");
      expect(imgToVideo.isDynamic).toBe(true);
      expect(imgToVideo.label).not.toMatch(/^\d+ Credits$/);

      const textToVideo = getCreditDisplayMeta("text-to-video");
      expect(textToVideo.isDynamic).toBe(true);
    });

    it("campaign autopilot sums aligned tool costs", () => {
      const steps: CampaignPlanStep[] = [
        {
          reihenfolge: 1,
          tool: "trend-script",
          input: {},
          begruendung: "Script",
        },
        {
          reihenfolge: 2,
          tool: "viral-hook",
          input: {},
          begruendung: "Hook",
        },
        {
          reihenfolge: 3,
          tool: "content-kalender",
          input: {},
          begruendung: "Kalender",
        },
      ];
      expect(sumCampaignPlanCredits(steps)).toBe(
        TREND_SCRIPT_TOOL_CREDIT_COST +
          VIRAL_HOOK_EXTRACTOR_CREDIT_COST +
          CONTENT_KALENDER_TOOL_CREDIT_COST
      );
    });
  });

  describe("product copy hygiene", () => {
    it("active locale files do not contain stale €4.99 top-up claims", () => {
      const stalePatterns = [/€4\.99/i, /€4,99/i, /4\.99 €/i, /4,99 €/i];
      const localeStrings = readJsonMessages().flatMap((doc) =>
        collectStrings(doc)
      );

      for (const text of localeStrings) {
        for (const pattern of stalePatterns) {
          expect(text).not.toMatch(pattern);
        }
      }
    });
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
});
