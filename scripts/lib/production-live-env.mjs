/**
 * Production live launch env audit + Vercel Production maps (never logs values).
 */
import {
  STAGING_REF,
  PROD_REF,
  maskRef,
  supabaseJwtRef,
} from "./supabase-env-audit.mjs";
import { priceIdEnvStatus } from "./stripe-price-id-env.mjs";
import { collectStripeEnvKeys } from "./sync-vercel-preview-env.mjs";

export const LIVE_CONFIRM_VALUE = "I_UNDERSTAND_THIS_GOES_LIVE";
export const LIVE_ENV_SYNC_CONFIRM_VALUE =
  "I_UNDERSTAND_THIS_UPDATES_VERCEL_PRODUCTION_ENV";
export const LIVE_DEPLOY_CONFIRM_VALUE = "I_UNDERSTAND_THIS_DEPLOYS_TO_PRODUCTION";

export function isLaunchCheckOnly(env) {
  return ["true", "1", "yes"].includes(
    String(env.LAUNCH_CHECK_ONLY ?? "").trim().toLowerCase()
  );
}

export function auditEnvSyncGate(env) {
  const blockers = [];
  if (env.LIVE_ENV_SYNC_CONFIRM?.trim() !== LIVE_ENV_SYNC_CONFIRM_VALUE) {
    blockers.push("live_env_sync_confirm_missing");
  }
  return {
    pass: blockers.length === 0,
    blockers,
    required_command: `$env:LIVE_ENV_SYNC_CONFIRM='${LIVE_ENV_SYNC_CONFIRM_VALUE}'`,
    secrets_logged: false,
  };
}

export function auditDeployGate(env) {
  const blockers = [];
  if (env.LIVE_DEPLOY_CONFIRM?.trim() !== LIVE_DEPLOY_CONFIRM_VALUE) {
    blockers.push("live_deploy_confirm_missing");
  }
  return {
    pass: blockers.length === 0,
    blockers,
    required_command: `$env:LIVE_DEPLOY_CONFIRM='${LIVE_DEPLOY_CONFIRM_VALUE}'`,
    secrets_logged: false,
  };
}

export const REQUIRED_SUBSCRIPTION_PRICE_KEYS = [
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_YEARLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_YEARLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_YEARLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY",
  "NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_YEARLY",
];

export const REQUIRED_CREDIT_PRICE_KEYS = [
  "STRIPE_CREDITS_25",
  "STRIPE_CREDITS_70",
  "STRIPE_CREDITS_160",
  "STRIPE_CREDITS_320",
];

export const REQUIRED_AGENCY_PRICE_KEYS = [
  "STRIPE_AGENCY_STARTER_MONTHLY",
  "STRIPE_AGENCY_STARTER_YEARLY",
  "STRIPE_AGENCY_PRO_MONTHLY",
  "STRIPE_AGENCY_PRO_YEARLY",
  "STRIPE_AGENCY_ENTERPRISE_MONTHLY",
  "STRIPE_AGENCY_ENTERPRISE_YEARLY",
];

/** All live-required Stripe Price ID env keys (subscriptions + credit packs + agency). */
export const ALL_REQUIRED_STRIPE_PRICE_KEYS = [
  ...REQUIRED_SUBSCRIPTION_PRICE_KEYS,
  ...REQUIRED_CREDIT_PRICE_KEYS,
  ...REQUIRED_AGENCY_PRICE_KEYS,
];

/** Legacy pay-as-you-go keys — must not be required or used in checkout. */
export const LEGACY_INACTIVE_CREDIT_PRICE_KEYS = [
  "STRIPE_CREDITS_50",
  "STRIPE_CREDITS_150",
  "STRIPE_CREDITS_350",
  "STRIPE_CREDITS_800",
];

export function mergeLaunchEnv(localEnv, productionEnv) {
  return { ...localEnv, ...productionEnv };
}

export function auditLaunchGates(env) {
  const blockers = [];
  const missing = [];

  if (env.LAUNCH_MODE?.trim().toLowerCase() !== "live") {
    blockers.push("launch_mode_not_live");
    missing.push("LAUNCH_MODE=live");
  }
  if (env.LIVE_LAUNCH_CONFIRM?.trim() !== LIVE_CONFIRM_VALUE) {
    blockers.push("live_launch_confirm_missing");
    missing.push(`LIVE_LAUNCH_CONFIRM=${LIVE_CONFIRM_VALUE}`);
  }

  return {
    pass: blockers.length === 0,
    blockers,
    required_command:
      blockers.length > 0
        ? `$env:LAUNCH_MODE='live'; $env:LIVE_LAUNCH_CONFIRM='${LIVE_CONFIRM_VALUE}'; npm run launch:production`
        : null,
    secrets_logged: false,
  };
}

export function auditRequiredLiveEnv(env) {
  const missing = [];
  const blockers = [];

  const urlRef = maskRef(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const anonRef = supabaseJwtRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");

  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  } else if (urlRef !== PROD_REF) {
    blockers.push("supabase_url_not_production_ref");
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  } else if (anonRef !== PROD_REF) {
    blockers.push("supabase_anon_not_production_ref");
  }
  if (anonRef === STAGING_REF || urlRef === STAGING_REF) {
    blockers.push("staging_supabase_in_live_env");
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  const stripeMode = (env.STRIPE_MODE ?? "").trim().toLowerCase();
  const pubStripeMode = (env.NEXT_PUBLIC_STRIPE_MODE ?? "").trim().toLowerCase();
  if (stripeMode !== "live") blockers.push("stripe_mode_not_live");
  if (pubStripeMode !== "live") blockers.push("next_public_stripe_mode_not_live");

  const stripeSecret = env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripePub = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!stripeSecret) missing.push("STRIPE_SECRET_KEY");
  else if (!stripeSecret.startsWith("sk_live_")) blockers.push("stripe_secret_not_live");
  if (!stripePub) missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  else if (!stripePub.startsWith("pk_live_")) blockers.push("stripe_publishable_not_live");
  if (stripeSecret.startsWith("sk_test_")) blockers.push("stripe_test_secret_in_live");
  if (stripePub.startsWith("pk_test_")) blockers.push("stripe_test_publishable_in_live");
  if (!env.STRIPE_WEBHOOK_SECRET?.trim()) missing.push("STRIPE_WEBHOOK_SECRET");

  for (const key of REQUIRED_SUBSCRIPTION_PRICE_KEYS) {
    const status = priceIdEnvStatus(env[key]);
    if (status === "missing") missing.push(key);
    else if (status !== "price_id_set") blockers.push(`${key}_invalid`);
  }
  for (const key of REQUIRED_CREDIT_PRICE_KEYS) {
    const status = priceIdEnvStatus(env[key]);
    if (status === "missing") missing.push(key);
    else if (status !== "price_id_set") blockers.push(`${key}_invalid`);
  }
  for (const key of REQUIRED_AGENCY_PRICE_KEYS) {
    const status = priceIdEnvStatus(env[key]);
    if (status === "missing") missing.push(key);
    else if (status !== "price_id_set") blockers.push(`${key}_invalid`);
  }

  const fal = env.FAL_KEY?.trim() || env.FAL_API_KEY?.trim();
  if (!fal) missing.push("FAL_API_KEY or FAL_KEY");

  const providersDisabled = (env.PROVIDERS_DISABLED ?? "").trim().toLowerCase();
  const pubProvidersDisabled = (env.NEXT_PUBLIC_PROVIDERS_DISABLED ?? "")
    .trim()
    .toLowerCase();
  const smokeOverride = (env.ALLOW_SAFE_DEV_PROVIDER_SMOKE ?? "")
    .trim()
    .toLowerCase();

  if (!["true", "1", "yes"].includes(providersDisabled)) {
    blockers.push("providers_must_start_disabled");
  }
  if (!["true", "1", "yes"].includes(pubProvidersDisabled)) {
    blockers.push("public_providers_must_start_disabled");
  }
  if (smokeOverride === "true") blockers.push("allow_safe_dev_provider_smoke_must_be_false");

  return {
    pass: missing.length === 0 && blockers.length === 0,
    missing,
    blockers,
    supabase_ref: urlRef,
    anon_ref: anonRef,
    stripe_mode: stripeMode,
    stripe_secret_kind: stripeSecret.startsWith("sk_live_")
      ? "sk_live_"
      : stripeSecret.startsWith("sk_test_")
        ? "sk_test_"
        : "other",
    stripe_publishable_kind: stripePub.startsWith("pk_live_")
      ? "pk_live_"
      : stripePub.startsWith("pk_test_")
        ? "pk_test_"
        : "other",
    provider_key_present: Boolean(fal),
    provider_key_name: env.FAL_KEY?.trim()
      ? "FAL_KEY"
      : env.FAL_API_KEY?.trim()
        ? "FAL_API_KEY"
        : null,
    secrets_logged: false,
  };
}

export function buildProductionLiveClosedMap(liveEnv) {
  const map = {
    NEXT_PUBLIC_SUPABASE_URL: liveEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: liveEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: liveEnv.SUPABASE_SERVICE_ROLE_KEY,
    PROVIDERS_DISABLED: "true",
    NEXT_PUBLIC_PROVIDERS_DISABLED: "true",
    ALLOW_SAFE_DEV_PROVIDER_SMOKE: "false",
    STRIPE_MODE: "live",
    NEXT_PUBLIC_STRIPE_MODE: "live",
    STRIPE_SECRET_KEY: liveEnv.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: liveEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: liveEnv.STRIPE_WEBHOOK_SECRET,
  };

  for (const key of collectStripeEnvKeys(liveEnv)) {
    map[key] = liveEnv[key];
  }

  const fal = liveEnv.FAL_KEY?.trim() || liveEnv.FAL_API_KEY?.trim();
  if (fal) {
    map.FAL_KEY = fal;
    map.FAL_API_KEY = fal;
  }

  return map;
}

export function buildProductionLiveOpenMap(liveEnv) {
  const map = buildProductionLiveClosedMap(liveEnv);
  map.PROVIDERS_DISABLED = "false";
  map.NEXT_PUBLIC_PROVIDERS_DISABLED = "false";
  map.ALLOW_SAFE_DEV_PROVIDER_SMOKE = "false";
  return map;
}

export function auditProductionLiveMap(map, { providersOpen = false } = {}) {
  const blockers = [];
  const urlRef = maskRef(map.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const anonRef = supabaseJwtRef(map.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");

  if (urlRef !== PROD_REF) blockers.push("map_supabase_not_production");
  if (anonRef !== PROD_REF) blockers.push("map_anon_not_production");
  if (urlRef === STAGING_REF || anonRef === STAGING_REF) {
    blockers.push("map_staging_ref_forbidden");
  }
  if (map.STRIPE_MODE !== "live") blockers.push("map_stripe_not_live");
  if ((map.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_")) {
    blockers.push("map_stripe_test_secret");
  }
  if (providersOpen) {
    if (map.PROVIDERS_DISABLED !== "false") blockers.push("map_providers_not_open");
    if (map.NEXT_PUBLIC_PROVIDERS_DISABLED !== "false") {
      blockers.push("map_public_providers_not_open");
    }
  } else {
    if (map.PROVIDERS_DISABLED !== "true") blockers.push("map_providers_not_closed");
    if (map.NEXT_PUBLIC_PROVIDERS_DISABLED !== "true") {
      blockers.push("map_public_providers_not_closed");
    }
  }
  if (map.ALLOW_SAFE_DEV_PROVIDER_SMOKE !== "false") {
    blockers.push("map_smoke_override_not_false");
  }

  return { pass: blockers.length === 0, blockers, urlRef, anonRef };
}
