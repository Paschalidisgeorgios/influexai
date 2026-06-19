#!/usr/bin/env node
/**
 * Read-only Stripe checkout env report — no secret values printed.
 * Usage: node scripts/check-stripe-checkout-env.mjs [--file .env.local]
 */
import fs from "fs";
import path from "path";
import {
  hasInvalidCheckoutPriceIds,
  priceIdEnvStatus,
} from "./lib/stripe-price-id-env.mjs";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const PRODUCTION_REF =
  process.env.PRODUCTION_SUPABASE_PROJECT_REF?.trim() || "hszjafdelcydnppyolkm";

function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) vars[key] = value;
  }
  return vars;
}

function keyKind(value, prefix) {
  if (!value) return "missing";
  if (value.startsWith(`${prefix}test_`)) return `${prefix}test_`;
  if (value.startsWith(`${prefix}live_`)) return `${prefix}live_`;
  return "other";
}

const fileArg = process.argv.includes("--file")
  ? process.argv[process.argv.indexOf("--file") + 1]
  : ".env.local";

const targetPath = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(targetPath)) {
  console.error(`File not found: ${targetPath}`);
  process.exit(1);
}

const vars = parseEnvFile(fs.readFileSync(targetPath, "utf8"));
const supabaseRef =
  vars.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ??
  null;

const subscriptionKeys = [
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_YEARLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_YEARLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_YEARLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_YEARLY",
];

const creditKeys = [
  "STRIPE_CREDITS_25",
  "STRIPE_CREDITS_50",
  "STRIPE_CREDITS_150",
  "STRIPE_CREDITS_350",
  "STRIPE_CREDITS_800",
];

const creditPack25 = priceIdEnvStatus(vars.STRIPE_CREDITS_25 ?? vars.STRIPE_CREDITS_50);
const subscriptionPriceIds = Object.fromEntries(
  subscriptionKeys.map((key) => [key, priceIdEnvStatus(vars[key])])
);
const creditPackPriceIds = Object.fromEntries(
  creditKeys.map((key) => [key, priceIdEnvStatus(vars[key])])
);

const report = {
  file: path.basename(targetPath),
  supabaseRef,
  isStagingRef: supabaseRef === STAGING_REF,
  isProductionRef: supabaseRef === PRODUCTION_REF,
  vercelEnv: vars.VERCEL_ENV ?? "(unset)",
  stripeMode: vars.STRIPE_MODE ?? "(unset)",
  providersDisabled: vars.PROVIDERS_DISABLED ?? "(unset)",
  stripeSecretKind: keyKind(vars.STRIPE_SECRET_KEY, "sk_"),
  stripePublishableKind: keyKind(vars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, "pk_"),
  safeCheckoutOverride: vars.ALLOW_SAFE_DEV_STRIPE_TEST_CHECKOUT === "true",
  creditPack25Source: vars.STRIPE_CREDITS_25
    ? "STRIPE_CREDITS_25"
    : vars.STRIPE_CREDITS_50
      ? "STRIPE_CREDITS_50_legacy"
      : "none",
  creditPack25,
  subscriptionPriceIds,
  creditPackPriceIds,
  checkoutPriceIdsReady: !hasInvalidCheckoutPriceIds({
    creditPack25,
    subscriptionPriceIds,
    creditPackPriceIds,
  }),
};

console.log(JSON.stringify(report, null, 2));

if (
  report.stripeSecretKind === "sk_live_" ||
  report.stripePublishableKind === "pk_live_" ||
  report.isProductionRef
) {
  process.exit(1);
}

if (!report.checkoutPriceIdsReady) {
  console.error(
    "\n[check-stripe-checkout-env] FAIL — missing or placeholder Stripe price IDs."
  );
  process.exit(1);
}

console.log("\n[check-stripe-checkout-env] OK — checkout price IDs look configured.");
