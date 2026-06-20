/**
 * Sync Preview-scoped Vercel env vars from local map (never logs values).
 */
import { spawnSync } from "child_process";
import { cleanVercelEnv } from "./scan-preview-bundle.mjs";

function runVercelEnv(args, value, env) {
  return spawnSync("npx", ["vercel", "env", ...args], {
    encoding: "utf8",
    input: value,
    env: cleanVercelEnv(env),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}

export function listPreviewEnvKeys(env) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "list", "preview", "--format", "json"],
    {
      encoding: "utf8",
      env: cleanVercelEnv(env),
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    }
  );
  if (result.status !== 0) {
    return {
      ok: false,
      keys: new Set(),
      error: (result.stderr || result.stdout || "vercel env list failed").slice(
        0,
        200
      ),
    };
  }
  try {
    const parsed = JSON.parse(result.stdout);
    const keys = new Set(
      (parsed.envs ?? parsed ?? [])
        .map((row) => row.key ?? row.name)
        .filter(Boolean)
    );
    return { ok: true, keys, error: null };
  } catch (err) {
    return {
      ok: false,
      keys: new Set(),
      error: String(err.message ?? err).slice(0, 200),
    };
  }
}

/**
 * Upsert one Preview env var via stdin (values never echoed).
 */
export function upsertPreviewEnvVar(name, value, existingKeys, env) {
  const action = existingKeys.has(name) ? "update" : "add";
  const args =
    action === "update"
      ? [action, name, "preview", "--yes"]
      : [action, name, "preview", "--yes", "--force"];

  const result = runVercelEnv(args, value, env);
  const combined = `${result.stderr ?? ""}${result.stdout ?? ""}`.toLowerCase();
  const ok =
    result.status === 0 ||
    combined.includes("updated") ||
    combined.includes("added") ||
    combined.includes("overwritten");

  return { ok, action, status: result.status ?? 1 };
}

export function syncPreviewEnvFromMap(envMap, baseEnv) {
  const list = listPreviewEnvKeys(baseEnv);
  if (!list.ok) {
    return {
      ok: false,
      synced: [],
      failed: Object.keys(envMap),
      production_touched: false,
      error: list.error,
      secrets_logged: false,
    };
  }

  const synced = [];
  const failed = [];

  for (const [name, value] of Object.entries(envMap)) {
    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }
    const result = upsertPreviewEnvVar(
      name,
      String(value),
      list.keys,
      baseEnv
    );
    if (result.ok) {
      synced.push(name);
      list.keys.add(name);
    } else {
      failed.push(name);
    }
  }

  return {
    ok: failed.length === 0,
    synced,
    failed,
    production_touched: false,
    secrets_logged: false,
  };
}

/** Collect Stripe price / mode keys present in local env for Preview sync. */
export function collectStripeEnvKeys(localEnv) {
  const patterns = [
    /^NEXT_PUBLIC_STRIPE_INFLUEXAI_/,
    /^NEXT_PUBLIC_STRIPE_PRICE_/,
    /^STRIPE_CREDITS_/,
    /^STRIPE_AGENCY_/,
  ];
  const keys = [];
  for (const key of Object.keys(localEnv)) {
    if (patterns.some((re) => re.test(key))) keys.push(key);
  }
  return keys.sort();
}

export function buildPreviewEnvMap(localEnv) {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: localEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: localEnv.SUPABASE_SERVICE_ROLE_KEY,
    PROVIDERS_DISABLED: "true",
    NEXT_PUBLIC_PROVIDERS_DISABLED: "true",
    ALLOW_SAFE_DEV_PROVIDER_SMOKE: "false",
    STRIPE_MODE: "test",
    NEXT_PUBLIC_STRIPE_MODE: "test",
    STRIPE_SECRET_KEY: localEnv.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: localEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: localEnv.STRIPE_WEBHOOK_SECRET,
  };

  for (const key of collectStripeEnvKeys(localEnv)) {
    required[key] = localEnv[key];
  }

  return required;
}

/** Preview env map for a single controlled provider smoke window (Preview scope only). */
export function buildPreviewProviderSmokeOpenMap(localEnv) {
  const base = buildPreviewEnvMap(localEnv);
  base.PROVIDERS_DISABLED = "false";
  base.NEXT_PUBLIC_PROVIDERS_DISABLED = "false";
  base.ALLOW_SAFE_DEV_PROVIDER_SMOKE = "true";

  const fal = localEnv.FAL_KEY?.trim() || localEnv.FAL_API_KEY?.trim();
  if (fal) {
    base.FAL_KEY = fal;
    base.FAL_API_KEY = fal;
  }

  return base;
}

/** Restore Preview provider kill-switch after smoke window. */
export function buildPreviewProviderSmokeClosedMap(localEnv) {
  return buildPreviewEnvMap(localEnv);
}
