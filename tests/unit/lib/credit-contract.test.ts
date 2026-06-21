import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ACTIVE_CREDIT_PACK_ENV_KEYS,
  getPackageById,
  getStripePriceEnvKeysForPackage,
  getStripePriceIdForPackage,
  STRIPE_CREDITS_25_ENV,
  STRIPE_CREDITS_50_ENV,
  STRIPE_CREDITS_150_ENV,
  STRIPE_CREDITS_350_ENV,
  STRIPE_CREDITS_800_ENV,
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
    it("active backup packs are 25/50/150/350/800 credits", () => {
      expect(ACTIVE_CREDIT_PACK_ENV_KEYS).toEqual([
        STRIPE_CREDITS_25_ENV,
        STRIPE_CREDITS_50_ENV,
        STRIPE_CREDITS_150_ENV,
        STRIPE_CREDITS_350_ENV,
        STRIPE_CREDITS_800_ENV,
      ]);
      expect(getPackageById("micro")!.credits).toBe(25);
      expect(getPackageById("small")!.credits).toBe(50);
      expect(getPackageById("medium")!.credits).toBe(150);
      expect(getPackageById("large")!.credits).toBe(350);
      expect(getPackageById("xl")!.credits).toBe(800);
    });

    it("each pack uses a single dedicated Stripe env key", () => {
      for (const pkg of [
        getPackageById("micro")!,
        getPackageById("small")!,
        getPackageById("medium")!,
        getPackageById("large")!,
        getPackageById("xl")!,
      ]) {
        expect(getStripePriceEnvKeysForPackage(pkg)).toEqual([pkg.envKey]);
      }
    });

    it("maps Stripe price whitelist to pack credits", () => {
      vi.stubEnv(STRIPE_CREDITS_25_ENV, "price_pack_25");
      vi.stubEnv(STRIPE_CREDITS_50_ENV, "price_pack_50");
      vi.stubEnv(STRIPE_CREDITS_150_ENV, "price_pack_150");
      vi.stubEnv(STRIPE_CREDITS_350_ENV, "price_pack_350");
      vi.stubEnv(STRIPE_CREDITS_800_ENV, "price_pack_800");

      const map = getCreditsByStripePriceId();
      expect(map.price_pack_25).toBe(25);
      expect(map.price_pack_50).toBe(50);
      expect(map.price_pack_150).toBe(150);
      expect(map.price_pack_350).toBe(350);
      expect(map.price_pack_800).toBe(800);
      expect(creditsForStripePriceId("price_pack_25")).toBe(25);
      expect(getStripePriceIdForPackage(getPackageById("micro")!)).toBe(
        "price_pack_25"
      );
    });
  });

  describe("top-up copy", () => {
    it("does not advertise €5 (50 Credits) for the micro top-up pack", () => {
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
