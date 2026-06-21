#!/usr/bin/env node
/**
 * LIVE-2L — Read-only Stripe Live plausibility audit for pay-as-you-go credit packs.
 * Never logs secret keys or full price IDs.
 */
import { createHash } from "crypto";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import Stripe from "stripe";
import { REQUIRED_CREDIT_PRICE_KEYS } from "./lib/production-live-env.mjs";

const EXPECTED_EUR_CENTS = {
  STRIPE_CREDITS_25: 500,
  STRIPE_CREDITS_70: 1200,
  STRIPE_CREDITS_160: 2500,
  STRIPE_CREDITS_320: 4500,
};

const EXPECTED_PRODUCT_NAMES = {
  STRIPE_CREDITS_25: "small",
  STRIPE_CREDITS_70: "medium",
  STRIPE_CREDITS_160: "large",
  STRIPE_CREDITS_320: "xl",
};

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path));
}

function maskPriceId(id) {
  const v = String(id ?? "").trim();
  if (!v.startsWith("price_")) return "(invalid)";
  if (v.length <= 8) return "price_...";
  return `price_...${v.slice(-4)}`;
}

function fingerprint(value) {
  return createHash("sha256").update(String(value).trim()).digest("hex").slice(0, 8);
}

const merged = parseEnvFile(resolve(process.cwd(), ".env.local"));
for (const [key, value] of Object.entries(
  parseEnvFile(resolve(process.cwd(), ".env.production.local"))
)) {
  if (String(value ?? "").trim() !== "") merged[key] = value;
}

const stripeSecret = String(merged.STRIPE_SECRET_KEY ?? "").trim();
const stripeMode = String(merged.STRIPE_MODE ?? "").trim().toLowerCase();

const blockers = [];
if (!stripeSecret.startsWith("sk_live_")) blockers.push("stripe_secret_not_live");
if (stripeMode !== "live") blockers.push("stripe_mode_not_live");

async function retrievePrice(stripe, priceId) {
  try {
    return await stripe.prices.retrieve(priceId, { expand: ["product"] });
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

function productInfo(product) {
  if (!product || typeof product === "string") return { name: null, description: null };
  return {
    name: product.name ?? null,
    description: product.description ?? null,
    metadata: product.metadata ?? {},
  };
}

function productNameMatches(key, productName) {
  const expected = EXPECTED_PRODUCT_NAMES[key];
  if (!expected || !productName) return false;
  return String(productName).trim().toLowerCase() === expected;
}

async function main() {
  if (blockers.length) {
    console.log(
      JSON.stringify(
        {
          phase: "live-2l-stripe-credit-plausibility-audit",
          ok: false,
          blockers,
          stripe_secret_kind: stripeSecret.startsWith("sk_live_")
            ? "sk_live_"
            : stripeSecret.startsWith("sk_test_")
              ? "sk_test_"
              : "other",
          stripe_mode: stripeMode || "(unset)",
          secrets_logged: false,
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecret);
  const localPriceIds = Object.fromEntries(
    REQUIRED_CREDIT_PRICE_KEYS.map((key) => [key, String(merged[key] ?? "").trim()])
  );

  const fpToKeys = new Map();
  for (const [key, id] of Object.entries(localPriceIds)) {
    if (!id) continue;
    const fp = fingerprint(id);
    if (!fpToKeys.has(fp)) fpToKeys.set(fp, []);
    fpToKeys.get(fp).push(key);
  }

  const duplicate_groups = [...fpToKeys.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([fp, keys]) => ({ fingerprint_prefix: fp, keys }));

  const pack_audits = {};
  let plausibilityPass = true;

  for (const key of REQUIRED_CREDIT_PRICE_KEYS) {
    const priceId = localPriceIds[key];
    if (!priceId) {
      pack_audits[key] = { env_key_present: false, pass: false };
      plausibilityPass = false;
      continue;
    }
    const price = await retrievePrice(stripe, priceId);
    if (price.error) {
      pack_audits[key] = {
        env_key_present: true,
        price_id_masked: maskPriceId(priceId),
        stripe_retrieve_error: price.error.slice(0, 120),
        pass: false,
      };
      plausibilityPass = false;
      continue;
    }
    const info = productInfo(price.product);
    const expectedCents = EXPECTED_EUR_CENTS[key];
    const amountOk = price.unit_amount === expectedCents;
    const productOk = productNameMatches(key, info.name);
    const typeOk = price.type === "one_time" && !price.recurring;
    const pass =
      price.active &&
      price.currency === "eur" &&
      typeOk &&
      amountOk &&
      productOk;

    if (!pass) plausibilityPass = false;

    pack_audits[key] = {
      env_key_present: true,
      price_id_masked: maskPriceId(priceId),
      fingerprint_prefix: fingerprint(priceId),
      active: price.active,
      currency: price.currency,
      unit_amount_eur: price.unit_amount != null ? price.unit_amount / 100 : null,
      expected_unit_amount_eur: expectedCents / 100,
      amount_matches_expected: amountOk,
      type: price.type,
      is_one_time: typeOk,
      product_name: info.name,
      expected_product_name: EXPECTED_PRODUCT_NAMES[key],
      product_name_matches: productOk,
      pass,
    };
  }

  const duplicateConfirmed = duplicate_groups.length > 0;

  console.log(
    JSON.stringify(
      {
        phase: "live-2l-stripe-credit-plausibility-audit",
        ok: plausibilityPass && !duplicateConfirmed,
        read_only: true,
        stripe_mutations: false,
        checkout_sessions_created: false,
        stripe_secret_kind: "sk_live_",
        stripe_mode: stripeMode,
        duplicate_groups,
        duplicate_confirmed: duplicateConfirmed,
        local_credit_pack_audits: pack_audits,
        secrets_logged: false,
      },
      null,
      2
    )
  );

  process.exit(plausibilityPass && !duplicateConfirmed ? 0 : 2);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err?.message ?? String(err) }));
  process.exit(1);
});
