#!/usr/bin/env node
/**
 * Read-only environment safety checker.
 * - No secret values printed
 * - No network / DB / provider calls
 * - No dependencies beyond Node built-ins
 *
 * Usage:
 *   node scripts/check-env-safety.mjs --example .env.local.example
 *   node scripts/check-env-safety.mjs --example .env.staging.example
 *   node scripts/check-env-safety.mjs --file .env.local
 */

import fs from "fs";
import path from "path";

const DEFAULT_PRODUCTION_REF =
  process.env.PRODUCTION_SUPABASE_PROJECT_REF?.trim() || "hszjafdelcydnppyolkm";

const LIVE_PRICE_PATTERN = /^price_[0-9A-Za-z]{14,}$/;

function parseArgs(argv) {
  const args = { mode: null, target: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--example" && argv[i + 1]) {
      args.mode = "example";
      args.target = argv[++i];
    } else if (argv[i] === "--file" && argv[i + 1]) {
      args.mode = "file";
      args.target = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      args.mode = "help";
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/check-env-safety.mjs --example <path>   Validate example template
  node scripts/check-env-safety.mjs --file <path>      Check local env (categories only)

Examples:
  node scripts/check-env-safety.mjs --example .env.local.example
  node scripts/check-env-safety.mjs --file .env.local`);
}

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

function extractSupabaseRef(url) {
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

function isPlaceholderValue(value) {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes("xxx") ||
    v.includes("your_") ||
    v.includes("...") ||
    v.endsWith("_key") ||
    v === "eyj...staging_anon_key" ||
    v === "eyj...staging_service_role"
  );
}

function analyzeEnv(vars, { strictExample = false } = {}) {
  const signalCategories = [];
  const warnings = [];

  const supabaseUrl = vars.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseRef = extractSupabaseRef(supabaseUrl);
  if (supabaseRef === DEFAULT_PRODUCTION_REF) {
    signalCategories.push("production_supabase_ref");
  } else if (supabaseRef && !isPlaceholderValue(supabaseRef)) {
    signalCategories.push("custom_supabase_ref");
  } else if (supabaseUrl && !isPlaceholderValue(supabaseUrl)) {
    signalCategories.push("supabase_url_set");
  }

  const stripeSecret = vars.STRIPE_SECRET_KEY?.trim() ?? "";
  if (stripeSecret.startsWith("sk_live_")) {
    signalCategories.push("stripe_live_secret");
  } else if (stripeSecret.startsWith("sk_test_")) {
    signalCategories.push("stripe_test_secret");
  } else if (stripeSecret && !isPlaceholderValue(stripeSecret)) {
    signalCategories.push("stripe_secret_set");
  }

  const stripePublishable = vars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  if (stripePublishable.startsWith("pk_live_")) {
    signalCategories.push("stripe_live_publishable");
  } else if (stripePublishable.startsWith("pk_test_")) {
    signalCategories.push("stripe_test_publishable");
  }

  for (const [key, value] of Object.entries(vars)) {
    if (!key.includes("STRIPE") || !value.startsWith("price_")) continue;
    if (isPlaceholderValue(value) || value.startsWith("price_test_")) continue;
    if (LIVE_PRICE_PATTERN.test(value)) {
      signalCategories.push("stripe_live_price_id");
      warnings.push(`Live-style Stripe price ID detected in ${key}`);
    }
  }

  if (vars.SUPABASE_SERVICE_ROLE_KEY?.trim() && !isPlaceholderValue(vars.SUPABASE_SERVICE_ROLE_KEY)) {
    signalCategories.push("service_role_present");
  }

  const providersDisabled = ["true", "1", "yes"].includes(
    (vars.PROVIDERS_DISABLED ?? "").trim().toLowerCase()
  );
  if (providersDisabled) {
    signalCategories.push("providers_disabled");
  }

  const hasFal = Boolean(vars.FAL_API_KEY?.trim() || vars.FAL_KEY?.trim());
  const hasAkool = Boolean(
    vars.AKOOL_API_KEY?.trim() ||
      (vars.AKOOL_CLIENT_ID?.trim() && vars.AKOOL_CLIENT_SECRET?.trim())
  );
  if ((hasFal || hasAkool) && !providersDisabled) {
    signalCategories.push("provider_keys_active");
  }

  const vercelEnv = vars.VERCEL_ENV?.trim();
  if (vercelEnv) signalCategories.push(`vercel_env_${vercelEnv}`);

  const stripeMode = vars.STRIPE_MODE?.trim().toLowerCase();
  if (stripeMode) signalCategories.push(`stripe_mode_${stripeMode}`);

  if (stripeMode === "test" && stripeSecret.startsWith("sk_live_")) {
    signalCategories.push("stripe_mode_key_mismatch");
    warnings.push("STRIPE_MODE=test conflicts with sk_live_ secret key");
  }
  if (stripeMode === "live" && stripeSecret.startsWith("sk_test_")) {
    signalCategories.push("stripe_mode_key_mismatch");
    warnings.push("STRIPE_MODE=live conflicts with sk_test_ secret key");
  }
  if (strictExample && stripeMode === "live") {
    signalCategories.push("stripe_mode_live_in_example");
    warnings.push("Example template must not declare STRIPE_MODE=live");
  }

  const guardTriggerSignals = [
    "production_supabase_ref",
    "stripe_live_secret",
    "stripe_live_publishable",
    "stripe_mode_key_mismatch",
    "stripe_mode_live_in_example",
    "provider_keys_active",
    "service_role_present",
  ];
  const activeGuardSignals = guardTriggerSignals.filter((s) =>
    signalCategories.includes(s)
  );

  const overrideActive =
    vars.ALLOW_PRODUCTION_DEV_WRITES === "true" &&
    vars.I_UNDERSTAND_PRODUCTION_WRITES === "true";

  const productionLike =
    activeGuardSignals.length > 0 ||
    signalCategories.includes("stripe_live_price_id");

  let fail = false;
  if (strictExample) {
    if (productionLike) fail = true;
    if (!providersDisabled && (hasFal || hasAkool)) fail = true;
  } else {
    if (productionLike && !overrideActive) fail = true;
  }

  return {
    signalCategories,
    activeGuardSignals,
    warnings,
    providersDisabled,
    vercelEnv: vercelEnv ?? "(unset)",
    stripeMode: stripeMode ?? "(unset)",
    providersDisabledFlag: vars.PROVIDERS_DISABLED ?? "(unset)",
    overrideActive,
    productionLike,
    fail,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.mode === "help" || !args.mode || !args.target) {
    printHelp();
    process.exit(args.mode === "help" ? 0 : 1);
  }

  const targetPath = path.resolve(process.cwd(), args.target);
  if (!fs.existsSync(targetPath)) {
    console.error(`File not found: ${targetPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(targetPath, "utf8");
  const vars = parseEnvFile(content);
  const result = analyzeEnv(vars, { strictExample: args.mode === "example" });

  console.log(
    JSON.stringify(
      {
        file: path.basename(targetPath),
        mode: args.mode,
        signalCategories: result.signalCategories,
        activeGuardSignals: result.activeGuardSignals,
        vercelEnv: result.vercelEnv,
        stripeMode: result.stripeMode,
        providersDisabled: result.providersDisabledFlag,
        overrideActive: result.overrideActive,
        warnings: result.warnings,
        productionLike: result.productionLike,
        devWriteGuardWouldBlock:
          result.activeGuardSignals.length > 0 && !result.overrideActive,
      },
      null,
      2
    )
  );

  if (result.fail) {
    console.error(
      "\n[check-env-safety] FAIL — production-like or unsafe signals detected."
    );
    if (args.mode === "example") {
      console.error(
        "Example templates must not contain live keys, production Supabase ref, or live price IDs."
      );
    } else {
      console.error(
        "Use .env.staging.example as a template. See docs/environment-safety.md."
      );
    }
    process.exit(1);
  }

  console.log("\n[check-env-safety] OK — no blocking production-like signals.");
  process.exit(0);
}

main();
