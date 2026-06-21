#!/usr/bin/env node
/** Secret-safe full Stripe pricing env audit — never logs values or full price IDs. */
import { createHash } from "crypto";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { priceIdEnvStatus } from "./lib/stripe-price-id-env.mjs";
import {
  ALL_REQUIRED_STRIPE_PRICE_KEYS,
  REQUIRED_AGENCY_PRICE_KEYS,
  REQUIRED_CREDIT_PRICE_KEYS,
  REQUIRED_SUBSCRIPTION_PRICE_KEYS,
} from "./lib/production-live-env.mjs";

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  return parse(readFileSync(path));
}

const merged = parseEnvFile(resolve(process.cwd(), ".env.local"));
for (const [key, value] of Object.entries(
  parseEnvFile(resolve(process.cwd(), ".env.production.local"))
)) {
  if (String(value ?? "").trim() !== "") merged[key] = value;
}

function classifyPriceKey(key) {
  const raw = merged[key];
  const present = Boolean(String(raw ?? "").trim());
  const status = priceIdEnvStatus(raw);
  const prefix_class =
    status === "price_id_set"
      ? "price_live_like"
      : status === "missing"
        ? "missing"
        : "invalid";
  return {
    key_present: present,
    prefix_class,
    pass: status === "price_id_set",
    price_fingerprint: present
      ? createHash("sha256").update(String(raw).trim()).digest("hex").slice(0, 8)
      : null,
  };
}

function auditGroup(keys) {
  return Object.fromEntries(
    keys.map((key) => {
      const row = classifyPriceKey(key);
      return [
        key,
        {
          key_present: row.key_present,
          prefix_class: row.prefix_class,
          pass: row.pass,
        },
      ];
    })
  );
}

const subscription_audit = auditGroup(REQUIRED_SUBSCRIPTION_PRICE_KEYS);
const credit_audit = auditGroup(REQUIRED_CREDIT_PRICE_KEYS);
const agency_audit = auditGroup(REQUIRED_AGENCY_PRICE_KEYS);

const fingerprintToKeys = new Map();
for (const key of ALL_REQUIRED_STRIPE_PRICE_KEYS) {
  const fp = classifyPriceKey(key).price_fingerprint;
  if (!fp) continue;
  if (!fingerprintToKeys.has(fp)) fingerprintToKeys.set(fp, []);
  fingerprintToKeys.get(fp).push(key);
}

const duplicate_groups = [...fingerprintToKeys.entries()]
  .filter(([, keys]) => keys.length > 1)
  .map(([fingerprint_prefix, keys]) => ({
    fingerprint_prefix,
    keys,
    duplicate_group: true,
  }));

for (const group of duplicate_groups) {
  for (const key of group.keys) {
    if (subscription_audit[key]) subscription_audit[key].duplicate_group = true;
    if (credit_audit[key]) credit_audit[key].duplicate_group = true;
    if (agency_audit[key]) agency_audit[key].duplicate_group = true;
  }
}

const allPass = ALL_REQUIRED_STRIPE_PRICE_KEYS.every(
  (key) => classifyPriceKey(key).pass
);

console.log(
  JSON.stringify(
    {
      phase: "live-2j-full-stripe-pricing-env-check",
      ok: allPass,
      launch_risk_duplicate_price_ids: duplicate_groups.length > 0,
      duplicate_price_id_groups: duplicate_groups,
      platform_subscriptions: subscription_audit,
      payg_credit_packs: credit_audit,
      agency_white_label: agency_audit,
      secrets_logged: false,
    },
    null,
    2
  )
);

process.exit(allPass ? 0 : 1);
