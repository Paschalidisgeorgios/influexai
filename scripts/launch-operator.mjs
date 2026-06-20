/**
 * Launch Operator — G.10-Q
 *
 * Syncs Preview env from .env.local (staging), deploys Preview, runs auth/guard gates.
 * Requires VISUAL_QA_PASSWORD (never logged).
 *
 * Run: npm run launch:operator
 *
 * Optional:
 *   SKIP_DEPLOY=1 SKIP_PLAYWRIGHT=1 SKIP_ENV_SYNC=1
 *   LAUNCH_SCOPE=production-dry-run LAUNCH_CONFIRM=I_UNDERSTAND_DRY_RUN_NO_LIVE
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve, join } from "path";
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  STAGING_REF,
  PROD_REF,
  maskRef,
  supabaseJwtRef,
} from "./lib/supabase-env-audit.mjs";
import {
  buildPreviewEnvMap,
  syncPreviewEnvFromMap,
} from "./lib/sync-vercel-preview-env.mjs";
import { scanPreviewBundle, cleanVercelEnv } from "./lib/scan-preview-bundle.mjs";
import { resolveLatestPreviewUrl } from "./lib/resolve-latest-preview.mjs";
import { probePreviewProviderGuard } from "./lib/preview-provider-guard.mjs";

const EMAIL = "visualqa@influexai.test";
const REPORT_PATH = resolve(process.cwd(), "docs/reports/launch-operator-g10q.md");
const ENV_LOCAL = resolve(process.cwd(), ".env.local");

config({ path: ENV_LOCAL });

delete process.env.VERCEL_DEBUG;
delete process.env.DEBUG;

const password = process.env.VISUAL_QA_PASSWORD?.trim();

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  process.exit(code);
}

function missingPasswordExit() {
  console.error("❌ Missing VISUAL_QA_PASSWORD (not logged).");
  console.error("");
  console.error("$env:VISUAL_QA_PASSWORD = 'DEIN_NEUES_TEMPORÄRES_PASSWORT'");
  console.error("npm run launch:operator");
  process.exit(1);
}

function auditLocalSafety() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const providersDisabled = (process.env.PROVIDERS_DISABLED ?? "").trim().toLowerCase();
  const allowSafe =
    process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE?.trim().toLowerCase() === "true";

  const ref = maskRef(url);
  const anonJwt = supabaseJwtRef(anonKey);
  const serviceJwt = supabaseJwtRef(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");

  return {
    env_local_present: existsSync(ENV_LOCAL),
    providers_disabled: ["true", "1", "yes"].includes(providersDisabled),
    allow_safe_dev_provider_smoke: allowSafe,
    stripe_mode: process.env.STRIPE_MODE ?? "(unset)",
    stripe_live:
      stripeSecret.startsWith("sk_live_") || stripePub.startsWith("pk_live_"),
    local_supabase_ref: ref,
    local_anon_jwt_ref: anonJwt,
    local_service_jwt_ref: serviceJwt,
    url_anon_match: ref === anonJwt && ref === STAGING_REF,
    production_supabase_blocked: ref !== PROD_REF,
    stripe_test_secret: stripeSecret.startsWith("sk_test_"),
    stripe_test_publishable: stripePub.startsWith("pk_test_"),
  };
}

function deployPreview() {
  const result = spawnSync("npx", ["vercel", "--yes"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: cleanVercelEnv(process.env),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const urlMatch = out.match(
    /https:\/\/influexai-[a-z0-9]+-paschalidisgeorgios-projects\.vercel\.app/
  );
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    deployment_url: urlMatch?.[0] ?? null,
  };
}

function sleepMs(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForPreviewUrl(preferred, attempts = 12, delayMs = 10000) {
  for (let i = 0; i < attempts; i += 1) {
    const url = resolveLatestPreviewUrl(preferred) ?? preferred;
    if (url) return url.replace(/\/$/, "");
    await sleepMs(delayMs);
  }
  return (preferred ?? "").replace(/\/$/, "");
}

function runEnsureUser() {
  return spawnSync("node", ["scripts/ensure-staging-visual-qa-user.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VISUAL_QA_PASSWORD: password },
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function runPlaywright(previewUrl) {
  return spawnSync(
    "npx",
    [
      "playwright",
      "test",
      "tests/e2e/flows/visual-qa-auth-truth.test.ts",
      "--config=playwright.visual-qa-auth.config.ts",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...cleanVercelEnv(process.env),
        VISUAL_QA_PASSWORD: password,
        PREVIEW_URL: previewUrl,
        PLAYWRIGHT_BASE_URL: previewUrl,
      },
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    }
  );
}

function writeReport(report) {
  mkdirSync(resolve(process.cwd(), "docs/reports"), { recursive: true });
  const ui = report.playwright?.ui;
  const md = `# Launch Operator — G.10-Q

Generated: ${new Date().toISOString()}

## Launch Gate

| Gate | Result |
|------|--------|
| Preview Gate (bundle + provider guard) | ${report.launch_gate.preview_gate_pass ? "PASS" : "FAIL"} |
| Auth Gate (direct Supabase) | ${report.launch_gate.auth_gate_pass ? "PASS" : "FAIL"} |
| UI Gate (Playwright login) | ${report.launch_gate.ui_gate_pass ? "PASS" : "FAIL"} |
| Provider Guard | ${report.provider_guard?.pass ? "PASS" : "FAIL"} |
| G.10-O Provider-UI-Smoke ready | ${report.launch_gate.g10o_ready ? "YES" : "NO"} |

## Safety

- \`.env.local\` present: ${report.safety.env_local_present}
- Production env touched: **${report.vercel_env.production_touched ? "yes" : "no"}**
- Production deploy: **${report.preview_deploy.production_deploy ? "yes" : "no"}**
- Secrets logged: **false**

## Vercel Preview Env Sync

- Auto sync: ${report.vercel_env.synced ? "yes" : "no"}
- Keys synced: ${report.vercel_env.synced_keys?.length ?? 0}
- Sync failures: ${report.vercel_env.failed_keys?.length ? report.vercel_env.failed_keys.join(", ") : "none"}
- Local Supabase URL ref: ${report.safety.local_supabase_ref}
- Local anon JWT ref: ${report.safety.local_anon_jwt_ref}
- Local url/anon match: ${report.safety.url_anon_match}

## Preview Deploy

- Deploy triggered: ${report.preview_deploy.triggered}
- Preview URL: ${report.preview_url ?? "n/a"}
- Bundle URL refs: ${report.preview_bundle?.url_refs?.join(", ") ?? "n/a"}
- Bundle anon JWT refs: ${report.preview_bundle?.anon_jwt_refs?.join(", ") ?? "n/a"}
- Production ref in bundle: ${report.preview_bundle?.production_url_ref || report.preview_bundle?.production_anon_ref ? "yes" : "no"}
- \`url_anon_mismatch\`: ${report.preview_bundle?.url_anon_mismatch ? "true" : "false"}

## Auth

- visualqa ensured: ${report.ensure_user?.ok ? "yes" : "no"}
- Direct Supabase sign-in: ${report.direct_supabase_sign_in_ok ? "PASS" : "FAIL"}
- user_id: ${report.direct_supabase_user_id ?? "n/a"}
- UI Login: ${ui?.ui_login_ok ? "PASS" : report.playwright?.skipped ? "skipped" : "FAIL"}
- Final URL: ${ui?.final_url ?? "n/a"}
- Error text: ${ui?.error_text ?? "n/a"}
- Session set: ${ui?.session_cookie_set || ui?.local_storage_session ? "yes" : "no"}

## Dashboard Readiness

- Dashboard: ${ui?.dashboard_reachable ? "yes" : "n/a"}
- Image Generator: ${ui?.image_generator_reachable ? "yes" : "n/a"}
- Credits visible: ${ui?.credits_visible ?? "n/a"}
- Provider-disabled banner: ${ui?.provider_disabled_banner ? "yes" : "n/a"}
- Gallery: ${ui?.gallery_reachable ? "yes" : "n/a"}

## Provider Guard

- Status: ${report.provider_guard?.pass ? "PASS" : "FAIL"}
- code: ${report.provider_guard?.code ?? "n/a"}
- generationId: ${report.provider_guard?.has_generation_id ? "yes" : "no"}
- imageUrl: ${report.provider_guard?.has_image_url ? "yes" : "no"}

## Diagnosis

- **${report.diagnosis ?? "pending"}**
- Blockers: ${report.blockers.length ? report.blockers.join(", ") : "none"}

## Production Dry-Run

${report.production_dry_run.section}

---
No secrets in this report.
`;
  writeFileSync(REPORT_PATH, md);
  console.log(`\nReport: ${REPORT_PATH}`);
}

console.log("=== Launch Operator (G.10-Q) ===\n");

if (!password) missingPasswordExit();

const safety = auditLocalSafety();
if (!safety.env_local_present) fail(".env.local missing");
if (!safety.providers_disabled) fail("PROVIDERS_DISABLED must be true");
if (safety.allow_safe_dev_provider_smoke) fail("ALLOW_SAFE_DEV_PROVIDER_SMOKE must be false");
if (safety.stripe_mode !== "test") fail("STRIPE_MODE must be test");
if (!safety.production_supabase_blocked || safety.local_supabase_ref !== STAGING_REF) {
  fail(`Local Supabase must be staging (${STAGING_REF})`);
}
if (!safety.url_anon_match) {
  fail("Local NEXT_PUBLIC_SUPABASE_URL and anon key must reference the same staging project");
}
if (safety.stripe_live) fail("Stripe live keys blocked locally");
if (!safety.stripe_test_secret || !safety.stripe_test_publishable) {
  fail("Stripe test keys required (sk_test_ / pk_test_)");
}

const launchScope = process.env.LAUNCH_SCOPE ?? "preview";
const launchConfirm = process.env.LAUNCH_CONFIRM ?? "";
const productionDryRunConfirmed =
  launchScope === "production-dry-run" &&
  launchConfirm === "I_UNDERSTAND_DRY_RUN_NO_LIVE";

const report = {
  phase: "launch-operator-g10q",
  safety,
  vercel_env: {
    synced: false,
    synced_keys: [],
    failed_keys: [],
    production_touched: false,
  },
  preview_deploy: { triggered: false, production_deploy: false },
  preview_url: null,
  preview_bundle: null,
  ensure_user: null,
  direct_supabase_sign_in_ok: false,
  direct_supabase_user_id: null,
  direct_supabase_error_code: null,
  direct_supabase_error_message: null,
  provider_guard: null,
  playwright: null,
  launch_gate: {
    preview_gate_pass: false,
    auth_gate_pass: false,
    ui_gate_pass: false,
    g10o_ready: false,
  },
  production_dry_run: {
    confirmed: productionDryRunConfirmed,
    section: productionDryRunConfirmed
      ? "Production dry-run mode confirmed locally. Operator still does NOT run `vercel --prod`. Manual production dry-run: sync Production env with staging Supabase + test Stripe + PROVIDERS_DISABLED=true, then deploy with explicit approval outside this script."
      : "Not enabled. Set `LAUNCH_SCOPE=production-dry-run` and `LAUNCH_CONFIRM=I_UNDERSTAND_DRY_RUN_NO_LIVE` to see production dry-run instructions only.",
  },
  diagnosis: null,
  blockers: [],
  secrets_logged: false,
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

console.log("Step 1: Sync Preview env from local staging (.env.local)…");
if (process.env.SKIP_ENV_SYNC !== "1") {
  const envMap = buildPreviewEnvMap(process.env);
  const sync = syncPreviewEnvFromMap(envMap, process.env);
  report.vercel_env = {
    synced: sync.ok,
    synced_keys: sync.synced,
    failed_keys: sync.failed,
    production_touched: sync.production_touched,
    error: sync.error ?? null,
  };
  console.log(
    sync.ok
      ? `✅ Preview env synced (${sync.synced.length} keys)`
      : `⚠️  Preview env sync partial/failed (${sync.failed.length} failed)`
  );
  if (sync.failed.length) {
    report.blockers.push("vercel_preview_env_sync_failed");
  }
} else {
  console.log("⏭️  SKIP_ENV_SYNC=1");
}

async function bundleGateLoop(previewUrl, maxAttempts = 2) {
  let bundle = await scanPreviewBundle(previewUrl);
  let attempt = 1;

  while (!bundle.bundle_gate_pass && attempt < maxAttempts) {
    console.warn(`⚠️  Bundle gate fail (attempt ${attempt}) — re-sync + redeploy…`);
    if (process.env.SKIP_ENV_SYNC !== "1") {
      const sync = syncPreviewEnvFromMap(buildPreviewEnvMap(process.env), process.env);
      report.vercel_env.synced_keys = [
        ...new Set([...(report.vercel_env.synced_keys ?? []), ...sync.synced]),
      ];
    }
    if (process.env.SKIP_DEPLOY !== "1") {
      deployPreview();
    }
    previewUrl = await waitForPreviewUrl(previewUrl);
    bundle = await scanPreviewBundle(previewUrl);
    attempt += 1;
  }

  return { previewUrl, bundle };
}

console.log("\nStep 2: Preview deploy (no --prod)…");
let previewUrl = process.env.PREVIEW_URL?.replace(/\/$/, "") ?? null;

if (process.env.SKIP_DEPLOY !== "1") {
  const deploy = deployPreview();
  report.preview_deploy.triggered = deploy.ok;
  previewUrl =
    deploy.deployment_url ??
    (await waitForPreviewUrl(resolveLatestPreviewUrl(null)));
  console.log(deploy.ok ? `✅ Preview deploy OK` : `⚠️  Preview deploy exit ${deploy.status}`);
} else {
  previewUrl =
    previewUrl ?? resolveLatestPreviewUrl(null) ?? fail("PREVIEW_URL required when SKIP_DEPLOY=1");
  console.log("⏭️  SKIP_DEPLOY=1");
}

report.preview_url = previewUrl;
console.log(`Preview URL: ${previewUrl}\n`);

console.log("Step 3: Bundle scan…");
let { previewUrl: resolvedUrl, bundle } = await bundleGateLoop(previewUrl);
report.preview_url = resolvedUrl;
report.preview_bundle = bundle;

console.log(`   URL refs: ${bundle.url_refs?.join(", ") || "(none)"}`);
console.log(`   Anon JWT refs: ${bundle.anon_jwt_refs?.join(", ") || "(none)"}`);
console.log(`   url_anon_mismatch: ${bundle.url_anon_mismatch ? "true" : "false"}`);

if (!bundle.bundle_gate_pass) {
  report.diagnosis = "preview_bundle_env_mismatch";
  report.blockers.push("preview_bundle_gate_fail");
  console.warn("⚠️  Bundle gate FAIL — UI probe skipped");
}

console.log("\nStep 4: Ensure visualqa staging user…");
const ensure = runEnsureUser();
report.ensure_user = { ok: ensure.status === 0, exit_code: ensure.status ?? 1 };
if (!report.ensure_user.ok) {
  console.error(ensure.stderr || ensure.stdout);
  report.blockers.push("ensure_visualqa_failed");
  writeReport(report);
  fail("ensure-staging-visual-qa-user failed", 2);
}
console.log("✅ visualqa user ensured");

console.log("\nStep 5: Direct Supabase signInWithPassword…");
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data, error } = await anon.auth.signInWithPassword({
  email: EMAIL,
  password,
});

report.direct_supabase_sign_in_ok = Boolean(data.user && !error);
report.direct_supabase_user_id = data.user?.id ?? null;
report.direct_supabase_error_code = error?.code ?? null;
report.direct_supabase_error_message = error?.message ?? null;
report.launch_gate.auth_gate_pass = report.direct_supabase_sign_in_ok;

console.log(
  report.direct_supabase_sign_in_ok
    ? `✅ Direct sign-in OK (${report.direct_supabase_user_id})`
    : `❌ Direct sign-in FAIL (${report.direct_supabase_error_code})`
);

if (!report.direct_supabase_sign_in_ok) {
  report.diagnosis = "direct_supabase_sign_in_failed";
  report.blockers.push("direct_supabase_sign_in_failed");
  writeReport(report);
  fail("Direct Supabase sign-in failed", 2);
}

console.log("\nStep 6: Provider guard probe…");
report.provider_guard = probePreviewProviderGuard(resolvedUrl);
console.log(
  report.provider_guard.pass
    ? "✅ Provider guard PASS"
    : `❌ Provider guard FAIL (${report.provider_guard.code ?? report.provider_guard.error ?? "unknown"})`
);

if (bundle.bundle_gate_pass && process.env.SKIP_PLAYWRIGHT !== "1") {
  console.log("\nStep 7: Playwright UI login probe…");
  const pw = runPlaywright(resolvedUrl);
  report.playwright = { exit_code: pw.status ?? 1 };
  try {
    report.playwright.ui = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "scripts/visual-qa-auth-truth-ui.json"),
        "utf8"
      )
    );
  } catch {
    report.playwright.ui = null;
  }
  report.launch_gate.ui_gate_pass = Boolean(report.playwright.ui?.ui_login_ok);
  if (!report.launch_gate.ui_gate_pass) {
    report.diagnosis = report.diagnosis ?? "ui_login_failed";
    report.blockers.push("ui_login_failed");
  } else {
    report.diagnosis = "launch_gates_pass";
  }
} else {
  report.playwright = {
    skipped: true,
    reason: bundle.bundle_gate_pass ? "SKIP_PLAYWRIGHT" : "bundle_gate_fail",
  };
}

report.launch_gate.preview_gate_pass =
  Boolean(bundle.bundle_gate_pass) && Boolean(report.provider_guard?.pass);
report.launch_gate.g10o_ready =
  report.launch_gate.preview_gate_pass &&
  report.launch_gate.auth_gate_pass &&
  report.launch_gate.ui_gate_pass;

writeReport(report);

console.log("\n=== Launch Operator Result ===");
console.log(
  JSON.stringify(
    {
      preview_url: report.preview_url,
      bundle_gate_pass: bundle.bundle_gate_pass,
      auth_gate_pass: report.launch_gate.auth_gate_pass,
      ui_gate_pass: report.launch_gate.ui_gate_pass,
      provider_guard_pass: report.provider_guard?.pass,
      g10o_ready: report.launch_gate.g10o_ready,
      blockers: report.blockers,
      secrets_logged: false,
    },
    null,
    2
  )
);

const exitOk = report.launch_gate.g10o_ready;
process.exit(exitOk ? 0 : 1);
