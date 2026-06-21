/**
 * Secret-safe Vercel Production env classification — never logs raw values.
 */
import { spawnSync } from "child_process";
import { cleanVercelEnv } from "./scan-preview-bundle.mjs";
import {
  PROD_REF,
  STAGING_REF,
  maskRef,
  supabaseJwtRef,
} from "./supabase-env-audit.mjs";
import { priceIdEnvStatus } from "./stripe-price-id-env.mjs";
import {
  REQUIRED_SUBSCRIPTION_PRICE_KEYS,
  REQUIRED_CREDIT_PRICE_KEYS,
  REQUIRED_AGENCY_PRICE_KEYS,
  LEGACY_INACTIVE_CREDIT_PRICE_KEYS,
} from "./production-live-env.mjs";

function runVercel(args, baseEnv) {
  return spawnSync("npx", ["vercel", "env", ...args], {
    encoding: "utf8",
    env: cleanVercelEnv(baseEnv),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}

function classifyBoolean(raw) {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return { value_class: "missing", pass: false };
  if (["true", "1", "yes"].includes(v)) return { value_class: "true", pass: true };
  if (["false", "0", "no"].includes(v)) return { value_class: "false", pass: true };
  return { value_class: "invalid", pass: false };
}

function classifyMode(raw) {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return { value_class: "missing", pass: false };
  if (v === "live") return { value_class: "live", pass: true };
  if (v === "test") return { value_class: "test", pass: false };
  return { value_class: "invalid", pass: false };
}

function classifyStripeSecret(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return { prefix_class: "missing", value_class: "missing", pass: false };
  if (v.startsWith("sk_live_")) return { prefix_class: "sk_live", value_class: "live", pass: true };
  if (v.startsWith("sk_test_")) return { prefix_class: "sk_test", value_class: "test", pass: false };
  return { prefix_class: "unknown", value_class: "invalid", pass: false };
}

function classifyStripePublishable(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return { prefix_class: "missing", value_class: "missing", pass: false };
  if (v.startsWith("pk_live_")) return { prefix_class: "pk_live", value_class: "live", pass: true };
  if (v.startsWith("pk_test_")) return { prefix_class: "pk_test", value_class: "test", pass: false };
  return { prefix_class: "unknown", value_class: "invalid", pass: false };
}

function classifyWebhook(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return { prefix_class: "missing", value_class: "missing", pass: false };
  if (v.startsWith("whsec_")) return { prefix_class: "whsec", value_class: "present", pass: true };
  return { prefix_class: "unknown", value_class: "invalid", pass: false };
}

function classifySupabaseUrl(raw) {
  const v = String(raw ?? "").trim();
  if (!v) {
    return {
      supabase_ref: "missing",
      value_class: "missing",
      pass: false,
    };
  }
  const ref = maskRef(v);
  if (ref === PROD_REF) {
    return { supabase_ref: PROD_REF, value_class: "production", pass: true };
  }
  if (ref === STAGING_REF) {
    return { supabase_ref: STAGING_REF, value_class: "staging", pass: false };
  }
  return { supabase_ref: ref ?? "unknown", value_class: "unknown", pass: false };
}

function classifySupabaseJwt(raw) {
  const v = String(raw ?? "").trim();
  if (!v) {
    return { supabase_ref: "missing", value_class: "missing", pass: false };
  }
  const ref = supabaseJwtRef(v);
  if (ref === PROD_REF) {
    return { supabase_ref: PROD_REF, value_class: "production", pass: true };
  }
  if (ref === STAGING_REF) {
    return { supabase_ref: STAGING_REF, value_class: "staging", pass: false };
  }
  return { supabase_ref: ref ?? "unknown", value_class: "unknown", pass: false };
}

function classifySecretPresent(raw) {
  const v = String(raw ?? "").trim();
  if (!v) return { value_class: "missing", prefix_class: "missing", pass: false };
  return { value_class: "present", prefix_class: "redacted", pass: true };
}

function classifyPriceId(raw, stripeLive) {
  const status = priceIdEnvStatus(raw);
  if (status === "missing") {
    return { value_class: "missing", prefix_class: "missing", pass: false };
  }
  if (status !== "price_id_set") {
    return { value_class: "invalid", prefix_class: "invalid", pass: false };
  }
  return {
    value_class: stripeLive ? "live" : "unknown",
    prefix_class: "price_live_like",
    pass: stripeLive,
  };
}

const PFlicht_AUDIT_KEYS = [
  "STRIPE_MODE",
  "NEXT_PUBLIC_STRIPE_MODE",
  "PROVIDERS_DISABLED",
  "NEXT_PUBLIC_PROVIDERS_DISABLED",
  "ALLOW_SAFE_DEV_PROVIDER_SMOKE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  ...REQUIRED_SUBSCRIPTION_PRICE_KEYS,
  ...REQUIRED_CREDIT_PRICE_KEYS,
  ...REQUIRED_AGENCY_PRICE_KEYS,
];

function parseJsonFromVercelStdout(stdout) {
  const text = String(stdout ?? "");
  const marker = text.indexOf('{"audit"');
  if (marker >= 0) {
    try {
      return JSON.parse(text.slice(marker));
    } catch {
      /* fall through */
    }
  }
  const lines = text.trim().split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith("{")) continue;
    try {
      return JSON.parse(line);
    } catch {
      continue;
    }
  }
  return null;
}

function runProductionEnvViaVercelRun(baseEnv) {
  const cwd = process.cwd();
  const runnerRel = "scripts/lib/classify-vercel-production-env-runner.mjs";
  const command =
    process.platform === "win32"
      ? `npx vercel env run -e production -- node ${runnerRel}`
      : `npx vercel env run -e production -- node ${runnerRel}`;

  const result = spawnSync(command, {
    encoding: "utf8",
    env: cleanVercelEnv(baseEnv),
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  const parsed = parseJsonFromVercelStdout(result.stdout);
  if (result.status !== 0 || !parsed?.audit) {
    const stderr = String(result.stderr ?? "").slice(-400);
    const stdout = String(result.stdout ?? "");
    let parse_error = null;
    const start = stdout.lastIndexOf("{");
    if (start >= 0) {
      try {
        JSON.parse(stdout.slice(start));
      } catch (err) {
        parse_error = String(err.message ?? err).slice(0, 120);
      }
    }
    return {
      ok: false,
      map: {},
      non_empty_key_count: 0,
      error: "vercel_env_run_failed",
      prebuilt_audit: null,
      run_debug: {
        status: result.status ?? 1,
        stderr_tail: stderr,
        stdout_has_json: stdout.includes('"audit"'),
        stdout_len: stdout.length,
        parse_error,
        parsed_has_audit: Boolean(parsed?.audit),
      },
    };
  }

  return {
    ok: true,
    map: {},
    non_empty_key_count: parsed.non_empty_key_count ?? 0,
    error: null,
    prebuilt_audit: parsed.audit,
  };
}

export function buildProductionEnvAudit(env, keyNames) {
  const stripeMode = classifyMode(env.STRIPE_MODE);
  const pubStripeMode = classifyMode(env.NEXT_PUBLIC_STRIPE_MODE);
  const stripeLive =
    stripeMode.value_class === "live" && pubStripeMode.value_class === "live";

  const audit = {
    STRIPE_MODE: {
      key_present: keyNames.length === 0 || keyNames.includes("STRIPE_MODE"),
      ...classifyMode(env.STRIPE_MODE),
    },
    NEXT_PUBLIC_STRIPE_MODE: {
      key_present:
        keyNames.length === 0 || keyNames.includes("NEXT_PUBLIC_STRIPE_MODE"),
      ...classifyMode(env.NEXT_PUBLIC_STRIPE_MODE),
    },
    PROVIDERS_DISABLED: {
      key_present:
        keyNames.length === 0 || keyNames.includes("PROVIDERS_DISABLED"),
      ...classifyBoolean(env.PROVIDERS_DISABLED),
    },
    NEXT_PUBLIC_PROVIDERS_DISABLED: {
      key_present:
        keyNames.length === 0 ||
        keyNames.includes("NEXT_PUBLIC_PROVIDERS_DISABLED"),
      ...classifyBoolean(env.NEXT_PUBLIC_PROVIDERS_DISABLED),
    },
    ALLOW_SAFE_DEV_PROVIDER_SMOKE: {
      key_present:
        keyNames.length === 0 ||
        keyNames.includes("ALLOW_SAFE_DEV_PROVIDER_SMOKE"),
      ...classifyBoolean(env.ALLOW_SAFE_DEV_PROVIDER_SMOKE),
      expected: "false",
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      key_present:
        keyNames.length === 0 || keyNames.includes("NEXT_PUBLIC_SUPABASE_URL"),
      ...classifySupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL),
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      key_present:
        keyNames.length === 0 ||
        keyNames.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      ...classifySupabaseJwt(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      key_present:
        keyNames.length === 0 ||
        keyNames.includes("SUPABASE_SERVICE_ROLE_KEY"),
      ...classifySecretPresent(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    STRIPE_SECRET_KEY: {
      key_present:
        keyNames.length === 0 || keyNames.includes("STRIPE_SECRET_KEY"),
      ...classifyStripeSecret(env.STRIPE_SECRET_KEY),
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      key_present:
        keyNames.length === 0 ||
        keyNames.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
      ...classifyStripePublishable(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },
    STRIPE_WEBHOOK_SECRET: {
      key_present:
        keyNames.length === 0 || keyNames.includes("STRIPE_WEBHOOK_SECRET"),
      ...classifyWebhook(env.STRIPE_WEBHOOK_SECRET),
    },
    FAL_API_KEY: {
      key_present:
        keyNames.length === 0 ||
        keyNames.includes("FAL_API_KEY") ||
        keyNames.includes("FAL_KEY"),
      ...classifySecretPresent(env.FAL_API_KEY ?? env.FAL_KEY),
      provider_note: "may be present; provider must stay disabled",
      pflicht: false,
    },
  };

  for (const key of REQUIRED_CREDIT_PRICE_KEYS) {
    audit[key] = {
      key_present: keyNames.length === 0 || keyNames.includes(key),
      ...classifyPriceId(env[key], stripeLive),
      pflicht: true,
      pricing_domain: "payg_credit_pack",
    };
  }

  for (const key of LEGACY_INACTIVE_CREDIT_PRICE_KEYS) {
    const listed = keyNames.length === 0 || keyNames.includes(key);
    const hasValue = Boolean(String(env[key] ?? "").trim());
    audit[key] = {
      key_present: listed,
      value_class: listed || hasValue ? "present_but_not_active" : "absent_ok",
      prefix_class: listed ? "legacy_inactive" : "absent",
      pass: true,
      pflicht: false,
      active: false,
    };
  }

  for (const key of REQUIRED_SUBSCRIPTION_PRICE_KEYS) {
    audit[key] = {
      key_present: keyNames.length === 0 || keyNames.includes(key),
      ...classifyPriceId(env[key], stripeLive),
      pflicht: true,
      pricing_domain: "platform_subscription",
    };
  }

  for (const key of REQUIRED_AGENCY_PRICE_KEYS) {
    audit[key] = {
      key_present: keyNames.length === 0 || keyNames.includes(key),
      ...classifyPriceId(env[key], stripeLive),
      pflicht: true,
      pricing_domain: "agency_white_label",
    };
  }

  return audit;
}

export function auditVercelProductionEnvSafe(baseEnv = process.env) {
  const list = runVercel(["list", "production", "--format", "json"], baseEnv);
  let keyNames = [];
  if (list.status === 0) {
    try {
      const parsed = JSON.parse(list.stdout);
      keyNames = (parsed.envs ?? parsed ?? [])
        .map((row) => row.key ?? row.name)
        .filter(Boolean)
        .sort();
    } catch {
      keyNames = [];
    }
  }

  const viaRun = runProductionEnvViaVercelRun(baseEnv);
  let audit =
    viaRun.prebuilt_audit ??
    buildProductionEnvAudit(viaRun.map ?? {}, keyNames);

  if (viaRun.prebuilt_audit && keyNames.length > 0) {
    audit = { ...audit };
    for (const [name, row] of Object.entries(audit)) {
      if (name === "FAL_API_KEY") {
        audit[name] = {
          ...row,
          key_present:
            keyNames.includes("FAL_API_KEY") || keyNames.includes("FAL_KEY"),
        };
      } else {
        audit[name] = { ...row, key_present: keyNames.includes(name) };
      }
    }
  }

  const stripeLive =
    audit.STRIPE_MODE.value_class === "live" &&
    audit.NEXT_PUBLIC_STRIPE_MODE.value_class === "live";

  const requiredChecks = [
    audit.STRIPE_MODE.pass,
    audit.NEXT_PUBLIC_STRIPE_MODE.pass,
    audit.PROVIDERS_DISABLED.value_class === "true",
    audit.NEXT_PUBLIC_PROVIDERS_DISABLED.value_class === "true",
    audit.ALLOW_SAFE_DEV_PROVIDER_SMOKE.value_class === "false",
    audit.NEXT_PUBLIC_SUPABASE_URL.pass,
    audit.NEXT_PUBLIC_SUPABASE_ANON_KEY.pass,
    audit.SUPABASE_SERVICE_ROLE_KEY.pass,
    audit.STRIPE_SECRET_KEY.pass,
    audit.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.pass,
    audit.STRIPE_WEBHOOK_SECRET.pass,
    ...REQUIRED_SUBSCRIPTION_PRICE_KEYS.map((k) => audit[k].pass),
    ...REQUIRED_CREDIT_PRICE_KEYS.map((k) => audit[k].pass),
    ...REQUIRED_AGENCY_PRICE_KEYS.map((k) => audit[k].pass),
  ];

  return {
    ok: viaRun.ok && requiredChecks.every(Boolean),
    target: "production",
    method: "vercel_env_list + vercel_env_run_classified",
    key_name_count: keyNames.length,
    env_run_ok: viaRun.ok,
    classified_key_count: viaRun.ok ? Object.keys(audit).length : 0,
    env_run_non_empty_key_count: viaRun.non_empty_key_count,
    temp_file_used: false,
    temp_file_deleted: true,
    run_error: viaRun.error,
    stripe_live: stripeLive,
    providers_disabled:
      audit.PROVIDERS_DISABLED.value_class === "true" &&
      audit.NEXT_PUBLIC_PROVIDERS_DISABLED.value_class === "true",
    supabase_production:
      audit.NEXT_PUBLIC_SUPABASE_URL.supabase_ref === PROD_REF &&
      audit.NEXT_PUBLIC_SUPABASE_ANON_KEY.supabase_ref === PROD_REF,
    legacy_inactive_credit_keys: Object.fromEntries(
      LEGACY_INACTIVE_CREDIT_PRICE_KEYS.map((key) => [
        key,
        {
          key_present: audit[key]?.key_present ?? false,
          value_class: audit[key]?.value_class ?? "unknown",
          active: false,
        },
      ])
    ),
    audit,
    blockers: requiredChecks.every(Boolean)
      ? []
      : PFlicht_AUDIT_KEYS.filter((k) => audit[k]?.pass === false).map(
          (k) => `audit_fail_${k}`
        ),
    secrets_logged: false,
  };
}
