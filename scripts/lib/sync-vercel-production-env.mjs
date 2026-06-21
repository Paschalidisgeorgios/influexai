/**
 * Sync Production-scoped Vercel env vars for dry-run launch (never logs values).
 */
import { spawnSync } from "child_process";
import { cleanVercelEnv } from "./scan-preview-bundle.mjs";
import { buildPreviewEnvMap } from "./sync-vercel-preview-env.mjs";

function runVercelEnv(args, value, env) {
  return spawnSync("npx", ["vercel", "env", ...args], {
    encoding: "utf8",
    input: value,
    env: cleanVercelEnv(env),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}

export function listProductionEnvKeys(env) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "list", "production", "--format", "json"],
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

export function upsertProductionEnvVar(name, value, existingKeys, env) {
  const action = existingKeys.has(name) ? "update" : "add";
  const args =
    action === "update"
      ? [action, name, "production", "--yes", "--value", String(value)]
      : [action, name, "production", "--yes", "--force", "--value", String(value)];

  const result = spawnSync("npx", ["vercel", "env", ...args], {
    encoding: "utf8",
    env: cleanVercelEnv(env),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  const combined = `${result.stderr ?? ""}${result.stdout ?? ""}`.toLowerCase();
  const ok =
    result.status === 0 ||
    combined.includes("updated") ||
    combined.includes("added") ||
    combined.includes("overwritten");

  return { ok, action, status: result.status ?? 1 };
}

/** Production dry-run map: staging Supabase + Stripe test + providers locked. */
export function buildProductionDryRunEnvMap(localEnv) {
  return buildPreviewEnvMap(localEnv);
}

export function syncProductionEnvFromMap(envMap, baseEnv) {
  const list = listProductionEnvKeys(baseEnv);
  if (!list.ok) {
    return {
      ok: false,
      synced: [],
      failed: Object.keys(envMap),
      preview_touched: false,
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
    const result = upsertProductionEnvVar(
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
    preview_touched: false,
    secrets_logged: false,
  };
}

/** Sync only PROVIDERS_DISABLED + NEXT_PUBLIC_PROVIDERS_DISABLED on Production. */
export function syncProductionProviderFlags({ disabled }, baseEnv) {
  const value = disabled ? "true" : "false";
  return syncProductionEnvFromMap(
    {
      PROVIDERS_DISABLED: value,
      NEXT_PUBLIC_PROVIDERS_DISABLED: value,
    },
    baseEnv
  );
}
