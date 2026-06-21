import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getPackageById } from "@/lib/credit-packages";
import {
  containsStalePricingCopy,
  formatMonthlyCreditsLabel,
  getCreditPackDisplay,
  getSubscriptionPlanDisplay,
  isDynamicCreditToolDisplay,
  listCreditPackDisplays,
  listSubscriptionPlanDisplays,
  shouldShowStripeTestModeNotice,
} from "@/lib/pricing-surface";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { getPlanCreditsLabel } from "@/lib/subscription-plan-features";
import {
  CHECKOUT_USER_MESSAGES,
  resolveCheckoutErrorMessage,
} from "@/lib/checkout-messages";
import { getCreditDisplayMeta } from "@/lib/tools/credit-display";

const PRICING_COMPONENT_PATHS = [
  "src/components/pricing/CreditPacksSection.tsx",
  "src/components/pricing/PricingPlans.tsx",
  "src/components/dashboard/core/StudioCreditsSection.tsx",
  "src/app/pricing/page.tsx",
];

describe("pricing surface", () => {
  it("subscription plan display matches subscription-plans.ts", () => {
    const starter = getSubscriptionPlanDisplay("starter");
    expect(starter.monthlyPriceEur).toBe(SUBSCRIPTION_PLANS.starter.monthlyPriceEur);
    expect(starter.monthlyCredits).toBe(50);
    expect(starter.creditsLabel).toBe("50 Credits / Monat");

    const business = getSubscriptionPlanDisplay("business");
    expect(business.monthlyCredits).toBe(2500);
    expect(business.monthlyPriceEur).toBe(199);
  });

  it("lists all paid plans from SSOT", () => {
    const plans = listSubscriptionPlanDisplays("monthly");
    expect(plans).toHaveLength(4);
    expect(plans.map((p) => p.monthlyCredits)).toEqual([50, 300, 800, 2500]);
  });

  it("micro credit pack shows 25 credits", () => {
    const micro = getPackageById("micro");
    expect(micro?.credits).toBe(25);
    const display = getCreditPackDisplay(micro!);
    expect(display.credits).toBe(25);
    expect(display.creditsLabel).toBe("25 Credits");
    expect(display.priceLabel).toBe("€5,00");
  });

  it("credit pack displays match credit-packages.ts pricing UI tiers", () => {
    const displays = listCreditPackDisplays();
    expect(displays.map((d) => d.credits)).toEqual([25, 70, 160, 320]);
    expect(displays.map((d) => d.priceEur)).toEqual([5, 12, 25, 45]);
  });

  it("plan feature credits label derives from subscription plans", () => {
    expect(getPlanCreditsLabel("starter")).toBe(
      formatMonthlyCreditsLabel(SUBSCRIPTION_PLANS.starter.monthlyCredits)
    );
    expect(getPlanCreditsLabel("creator")).toContain("300");
  });

  it("detects stale €4,99 and €5/50 copy", () => {
    expect(containsStalePricingCopy("Top-up ab €4,99")).toBe(true);
    expect(containsStalePricingCopy("€5 (50 Credits)")).toBe(true);
    expect(containsStalePricingCopy("€5 (25 Credits)")).toBe(false);
  });

  it("active pricing components do not contain stale top-up copy", () => {
    for (const relPath of PRICING_COMPONENT_PATHS) {
      const content = readFileSync(join(process.cwd(), relPath), "utf8");
      expect(content, relPath).not.toMatch(/€4[,.]99/);
      expect(content, relPath).not.toMatch(/€5\s*\(\s*50\s*Credits?\s*\)/i);
    }
  });

  it("dynamic video tools are marked dynamic in credit display", () => {
    expect(isDynamicCreditToolDisplay("img-to-video")).toBe(true);
    expect(isDynamicCreditToolDisplay("text-to-video")).toBe(true);
    expect(getCreditDisplayMeta("img-to-video").label).not.toMatch(/^\d+ Credits$/);
  });

  it("maps plan-required checkout API code to user message", () => {
    const message = resolveCheckoutErrorMessage(
      { code: "PLAN_REQUIRED_FOR_CREDITS", error: "ignored" },
      403
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.planRequired);
    expect(message).toMatch(/Plan erforderlich/i);
  });

  it("runtime blocked message contains no secret material", () => {
    const message = resolveCheckoutErrorMessage(
      {
        code: "STRIPE_RUNTIME_CONFIG_BLOCKED",
        error: "STRIPE_MODE=test widerspricht dem konfigurierten Live Secret Key.",
      },
      503
    );
    expect(message).toBe(CHECKOUT_USER_MESSAGES.stripeRuntimeBlocked);
    expect(message).not.toMatch(/sk_(live|test)_/);
  });

  describe("stripe test mode notice visibility", () => {
    beforeEach(() => vi.unstubAllEnvs());
    afterEach(() => vi.unstubAllEnvs());

    it("shows in development with NEXT_PUBLIC_STRIPE_MODE=test", () => {
      vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "development");
      vi.stubEnv("NEXT_PUBLIC_STRIPE_MODE", "test");
      expect(shouldShowStripeTestModeNotice()).toBe(true);
    });

    it("hides on production", () => {
      vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_STRIPE_MODE", "test");
      expect(shouldShowStripeTestModeNotice()).toBe(false);
    });
  });
});

describe("pricing i18n top-up suffix", () => {
  it("locale extra_credits_suffix does not advertise 50-credit small pack", () => {
    const messagesDir = join(process.cwd(), "messages");
    const files = readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const doc = JSON.parse(readFileSync(join(messagesDir, file), "utf8")) as {
        landingPage?: { pricing?: { extra_credits_suffix?: string } };
      };
      const suffix = doc.landingPage?.pricing?.extra_credits_suffix;
      if (!suffix) continue;
      expect(suffix, file).not.toMatch(/€5\s*\(\s*50/i);
    }
  });
});

describe("credits dashboard UX copy", () => {
  it("references plan-required copy and credit-display SSOT", () => {
    const content = readFileSync(
      join(process.cwd(), "src/components/dashboard/core/StudioCreditsSection.tsx"),
      "utf8"
    );
    expect(content).toContain("CHECKOUT_USER_MESSAGES.planRequired");
    expect(content).toContain("getCreditDisplayLabel");
  });
});
