/**
 * Read-only Vercel Production env audit — key names + safe non-secret flags only.
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parse } from "dotenv";
import { cleanVercelEnv } from "./scan-preview-bundle.mjs";
import { PROD_REF, STAGING_REF, maskRef } from "./supabase-env-audit.mjs";

const SAFE_FLAG_KEYS = [
  "STRIPE_MODE",
  "NEXT_PUBLIC_STRIPE_MODE",
  "PROVIDERS_DISABLED",
  "NEXT_PUBLIC_PROVIDERS_DISABLED",
  "ALLOW_SAFE_DEV_PROVIDER_SMOKE",
  "NEXT_PUBLIC_SUPABASE_URL",
];

function runVercel(args, baseEnv) {
  return spawnSync("npx", ["vercel", "env", ...args], {
    encoding: "utf8",
    env: cleanVercelEnv(baseEnv),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}

function readSafeFlagsFromPull(baseEnv) {
  const tmp = join(tmpdir(), `vercel-prod-audit-${Date.now()}.env`);
  const pull = runVercel(
    ["pull", tmp, "--environment=production", "--yes"],
    baseEnv
  );
  if (pull.status !== 0 || !existsSync(tmp)) {
    return { ok: false, flags: null, error: "vercel env pull failed" };
  }
  try {
    const parsed = parse(readFileSync(tmp));
    const flags = {};
    for (const key of SAFE_FLAG_KEYS) {
      const raw = parsed[key];
      if (!String(raw ?? "").trim()) {
        flags[key] = { key, present: false, value: null };
        continue;
      }
      if (key === "NEXT_PUBLIC_SUPABASE_URL") {
        const ref = maskRef(raw);
        flags[key] = {
          key,
          present: true,
          value: ref ? `ref:${ref}` : "set",
          is_production_ref: ref === PROD_REF,
          is_staging_ref: ref === STAGING_REF,
        };
      } else {
        flags[key] = { key, present: true, value: raw.trim() };
      }
    }
    return { ok: true, flags, error: null };
  } finally {
    unlinkSync(tmp);
  }
}

export function auditVercelProductionEnv(baseEnv = process.env) {
  const list = runVercel(["list", "production", "--format", "json"], baseEnv);
  if (list.status !== 0) {
    return {
      ok: false,
      target: "production",
      error: (list.stderr || list.stdout || "vercel env list failed").slice(0, 200),
      secrets_logged: false,
    };
  }

  let keys = [];
  try {
    const parsed = JSON.parse(list.stdout);
    keys = (parsed.envs ?? parsed ?? [])
      .map((row) => row.key ?? row.name)
      .filter(Boolean)
      .sort();
  } catch (err) {
    return {
      ok: false,
      target: "production",
      error: String(err.message ?? err).slice(0, 200),
      secrets_logged: false,
    };
  }

  const flagsResult = readSafeFlagsFromPull(baseEnv);
  const flags = flagsResult.flags ?? {};

  const stripeSecretListed = keys.includes("STRIPE_SECRET_KEY");
  const stripePubListed = keys.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

  return {
    ok: true,
    target: "production",
    key_count: keys.length,
    keys,
    safe_flags_source: flagsResult.ok ? "vercel_env_pull_safe_subset" : "unknown",
    safe_flags_error: flagsResult.error,
    watch_keys_present: {
      PROVIDERS_DISABLED: keys.includes("PROVIDERS_DISABLED"),
      NEXT_PUBLIC_PROVIDERS_DISABLED: keys.includes("NEXT_PUBLIC_PROVIDERS_DISABLED"),
      STRIPE_MODE: keys.includes("STRIPE_MODE"),
      NEXT_PUBLIC_STRIPE_MODE: keys.includes("NEXT_PUBLIC_STRIPE_MODE"),
      STRIPE_SECRET_KEY: stripeSecretListed,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePubListed,
      NEXT_PUBLIC_SUPABASE_URL: keys.includes("NEXT_PUBLIC_SUPABASE_URL"),
      FAL_API_KEY: keys.includes("FAL_API_KEY") || keys.includes("FAL_KEY"),
    },
    safe_flags: flags,
    providers_disabled:
      flags.PROVIDERS_DISABLED?.value === "true" &&
      flags.NEXT_PUBLIC_PROVIDERS_DISABLED?.value === "true",
    stripe_mode_live:
      flags.STRIPE_MODE?.value === "live" &&
      flags.NEXT_PUBLIC_STRIPE_MODE?.value === "live",
    supabase_production_ref: flags.NEXT_PUBLIC_SUPABASE_URL?.is_production_ref === true,
    secrets_logged: false,
  };
}
