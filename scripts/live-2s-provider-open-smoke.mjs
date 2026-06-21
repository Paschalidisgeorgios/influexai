#!/usr/bin/env node
/**
 * LIVE-2S — Controlled Provider Open + Single Image Smoke (Production).
 * Never logs secrets or full provider keys.
 *
 * Required confirms (PowerShell):
 *   $env:LAUNCH_MODE='live'
 *   $env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'
 *   $env:LIVE_ENV_SYNC_CONFIRM='I_UNDERSTAND_THIS_UPDATES_VERCEL_PRODUCTION_ENV'
 *   $env:LIVE_DEPLOY_CONFIRM='I_UNDERSTAND_THIS_DEPLOYS_TO_PRODUCTION'
 *   $env:LIVE_PROVIDER_OPEN_CONFIRM='I_UNDERSTAND_THIS_ENABLES_REAL_PROVIDER_CALLS'
 *
 * Run: npm run live-2s:provider-open-smoke
 */
import { createHash } from "crypto";
import { parse } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { spawnSync, execSync } from "child_process";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import {
  auditLaunchGates,
  auditEnvSyncGate,
  auditDeployGate,
  auditProviderOpenGate,
  LIVE_CONFIRM_VALUE,
  LIVE_ENV_SYNC_CONFIRM_VALUE,
  LIVE_DEPLOY_CONFIRM_VALUE,
  LIVE_PROVIDER_OPEN_CONFIRM_VALUE,
} from "./lib/production-live-env.mjs";
import { syncProductionProviderFlags } from "./lib/sync-vercel-production-env.mjs";
import {
  probeProductionProviderGuard,
  probeProductionProviderGuardOpen,
} from "./lib/production-provider-guard.mjs";
import { auditVercelProductionEnvSafe } from "./lib/audit-vercel-production-env-safe.mjs";
import { cleanVercelEnv } from "./lib/scan-preview-bundle.mjs";

const DOMAIN = "https://www.influexaicreator.com";
const QA_EMAIL = "launchqa@influexai.test";
const PROMPT =
  "premium product photo of a lime green glass cube on a dark editorial studio background, no text, no logo";
const IMAGE_GEN_CREDIT_COST = 5;
const REPORT_PATH = resolve(process.cwd(), "docs/reports/live-2s-provider-open-smoke.md");

const report = {
  phase: "live-2s-provider-open-smoke",
  provider_open_gate_added: true,
  provider_open_gate_value: LIVE_PROVIDER_OPEN_CONFIRM_VALUE,
  secrets_logged: false,
};

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  try {
    return parse(readFileSync(path));
  } catch {
    return {};
  }
}

function loadEnvFiles() {
  const merged = parseEnvFile(resolve(".env.local"));
  for (const [k, v] of Object.entries(parseEnvFile(resolve(".env.production.local")))) {
    if (String(v ?? "").trim() !== "") merged[k] = v;
  }
  for (const key of [
    "LAUNCH_MODE",
    "LIVE_LAUNCH_CONFIRM",
    "LIVE_ENV_SYNC_CONFIRM",
    "LIVE_DEPLOY_CONFIRM",
    "LIVE_PROVIDER_OPEN_CONFIRM",
    "LAUNCH_QA_PASSWORD",
  ]) {
    const shellVal = process.env[key];
    if (String(shellVal ?? "").trim() !== "") merged[key] = shellVal;
  }
  return merged;
}

function fp(v) {
  return createHash("sha256").update(String(v ?? "").trim()).digest("hex").slice(0, 8);
}

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  report.blockers = report.blockers ?? [];
  report.blockers.push(String(message).slice(0, 200));
  report.diagnosis = report.diagnosis ?? "blocked";
  writeReport();
  process.exit(code);
}

function runCmd(label, cmd, args = []) {
  const result = spawnSync(cmd, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const ok = result.status === 0;
  return { label, ok, status: result.status ?? 1 };
}

function deployProduction() {
  const result = spawnSync("npx", ["vercel", "--prod", "--yes"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: cleanVercelEnv(process.env),
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const ok =
    result.status === 0 ||
    out.includes("Deployment completed") ||
    out.includes('"status": "ok"');
  return { ok, output_snippet: out.slice(-400) };
}

function sleepMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchRoute(path) {
  const url = `${DOMAIN}${path}`;
  try {
    const status = execSync(`curl.exe -s -o NUL -w "%{http_code}" -L "${url}"`, {
      encoding: "utf8",
    }).trim();
    return { path, status: Number(status), ok: Number(status) >= 200 && Number(status) < 500 };
  } catch {
    return { path, status: 0, ok: false };
  }
}

async function readQaSnapshot(liveEnv) {
  const admin = createClient(
    liveEnv.NEXT_PUBLIC_SUPABASE_URL,
    liveEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = list?.users?.find((u) => u.email?.toLowerCase() === QA_EMAIL.toLowerCase());
  if (!user) return { user_found: false };

  const { data: profile } = await admin
    .from("profiles")
    .select("credits, plan")
    .eq("id", user.id)
    .maybeSingle();

  const { count: txCount } = await admin
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: genCount } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return {
    user_found: true,
    user_fingerprint: fp(user.id),
    credits: profile?.credits ?? null,
    plan: profile?.plan ?? null,
    credit_tx_count: txCount ?? 0,
    generation_count: genCount ?? 0,
  };
}

async function auditLive2rPrerequisites(liveEnv) {
  const qa = await readQaSnapshot(liveEnv);
  const vercel = auditVercelProductionEnvSafe(process.env);
  const creditsDeltaFromBaseline = qa.credits != null ? qa.credits - 75 : null;
  const live2rPaymentOk =
    qa.user_found &&
    creditsDeltaFromBaseline === 25 &&
    (qa.credit_tx_count ?? 0) >= 1;
  const providersDisabled = vercel.providers_disabled === true;

  const blockers = [];
  if (!qa.user_found) blockers.push("qa_user_missing");
  if (!live2rPaymentOk) blockers.push("live_2r_payment_not_verified");
  if (!providersDisabled) blockers.push("providers_not_disabled_before_open");
  if (qa.plan === "free") blockers.push("qa_plan_free_image_smoke_blocked");

  return {
    pass: blockers.length === 0,
    blockers,
    qa,
    providers_disabled_vercel: providersDisabled,
    live_2r_credits_delta: creditsDeltaFromBaseline,
    secrets_logged: false,
  };
}

async function runSingleImageSmoke(password, providerRunsRef) {
  if (providerRunsRef.count >= 1) {
    return { success: false, ui_error: "provider_run_limit_exceeded" };
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let apiCapture = null;

  page.on("response", async (response) => {
    if (
      response.url().includes("/api/generate-image") &&
      response.request().method() === "POST"
    ) {
      try {
        apiCapture = { status: response.status(), body: await response.json() };
      } catch {
        apiCapture = { status: response.status(), body: null };
      }
    }
  });

  const smoke = {
    success: false,
    generationId: null,
    imageUrl: null,
    image_fetch: null,
    http_status: null,
    credits_used: null,
    ui_error: null,
    gallery_visible: false,
    api_code: null,
  };

  try {
    await page.goto(`${DOMAIN}/auth/sign-in`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const accept = page.getByRole("button", { name: /^Akzeptieren$/i });
    if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
      await accept.click();
    }
    await page.getByRole("textbox", { name: /E-Mail|Email/i }).fill(QA_EMAIL);
    await page.getByRole("textbox", { name: /Passwort|Password/i }).fill(password);
    await page.getByRole("button", { name: /Jetzt anmelden|Sign in|Anmelden/i }).click();
    await page.waitForURL(/\/(dashboard|pricing|onboarding)/, { timeout: 45000 });

    await page.goto(`${DOMAIN}/dashboard?tool=image-gen`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    const promptBox =
      (await page.getByTestId("image-gen-prompt").isVisible({ timeout: 5000 }).catch(() => false))
        ? page.getByTestId("image-gen-prompt")
        : page.getByRole("textbox").first();

    await promptBox.fill(PROMPT);

    const generateBtn = page.getByTestId("image-gen-generate-standard").last();
    const hasTestId = await generateBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const btn = hasTestId
      ? generateBtn
      : page.getByRole("button", { name: /generieren|generate|erstellen/i }).first();

    await btn.waitFor({ state: "visible", timeout: 60000 });
    for (let i = 0; i < 30; i += 1) {
      if (await btn.isEnabled()) break;
      await sleepMs(2000);
    }
    if (!(await btn.isEnabled())) {
      smoke.ui_error = "generate_button_disabled";
      return smoke;
    }

    providerRunsRef.count = 1;
    await btn.click({ timeout: 180000 });

    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      if (apiCapture?.body?.success === true && apiCapture?.body?.generationId) break;
      if (apiCapture?.body?.success === false && apiCapture?.status >= 400) break;
      await sleepMs(2000);
    }

    smoke.http_status = apiCapture?.status ?? null;
    smoke.success = apiCapture?.body?.success === true;
    smoke.generationId = apiCapture?.body?.generationId ?? null;
    smoke.imageUrl = apiCapture?.body?.imageUrl ? "(set, not logged)" : null;
    smoke.credits_used = apiCapture?.body?.creditsUsed ?? null;
    smoke.api_code = apiCapture?.body?.code ?? null;

    if (apiCapture?.body?.imageUrl) {
      smoke.image_fetch = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return { status: r.status, contentType: r.headers.get("content-type") };
      }, apiCapture.body.imageUrl);
    }

    await page.goto(`${DOMAIN}/dashboard/gallery`, { waitUntil: "domcontentloaded" });
    const galleryText = await page.locator("body").innerText();
    smoke.gallery_visible =
      page.url().includes("/dashboard/gallery") &&
      (Boolean(smoke.generationId) && galleryText.length > 100);
  } finally {
    await browser.close();
  }

  return smoke;
}

function writeReport() {
  mkdirSync(resolve(process.cwd(), "docs/reports"), { recursive: true });
  const r = report;
  const md = `# LIVE-2S — Controlled Provider Open + Single Image Smoke

Generated: ${new Date().toISOString()}

## Result

| Check | Value |
|-------|-------|
| Diagnosis | **${r.diagnosis ?? "pending"}** |
| Provider open gate | ${r.provider_open_gate_added ? "confirmed" : "missing"} |
| Provider env set open | ${r.provider_env_open ? "yes" : "no"} |
| Deploy executed | ${r.deploy_executed ? "yes" : "no"} |
| Provider final state | ${r.provider_final_open ? "open" : r.provider_closed_on_failure ? "closed (rollback)" : "unchanged"} |
| Provider runs | ${r.provider_runs ?? 0} |
| Secrets logged | **no** |

## LIVE-2R Prerequisites

- Pass: ${r.live_2r_prereq?.pass ? "yes" : "no"}
- Blockers: ${r.live_2r_prereq?.blockers?.join(", ") || "none"}

## QA Snapshot

- Fingerprint: ${r.qa?.user_fingerprint ?? "n/a"}
- Credits before: ${r.credits_before ?? "n/a"}
- Credits after: ${r.credits_after ?? "n/a"}
- Plan: ${r.qa?.plan ?? "n/a"}

## Smoke

- generationId: ${r.smoke?.generationId ? "yes" : "no"}
- imageUrl: ${r.smoke?.imageUrl ? "yes (not logged)" : "no"}
- image_fetch: ${r.smoke?.image_fetch?.status ?? "n/a"}
- gallery visible: ${r.smoke?.gallery_visible ? "yes" : "no"}

## Validation

${(r.validation ?? [])
  .map((v) => `- ${v.label}: ${v.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Blockers

${(r.blockers ?? []).length ? r.blockers.map((b) => `- ${b}`).join("\n") : "- none"}

---
No secrets in this report.
`;
  writeFileSync(REPORT_PATH, md);
  console.log(`\nReport: ${REPORT_PATH}`);
}

async function closeProvidersAndDeploy() {
  const sync = syncProductionProviderFlags({ disabled: true }, process.env);
  report.provider_rollback_sync = { ok: sync.ok, synced: sync.synced };
  const deploy = deployProduction();
  report.provider_rollback_deploy = deploy.ok;
  await sleepMs(60000);
  report.provider_final_open = false;
  report.provider_closed_on_failure = true;
}

console.log("=== LIVE-2S — Controlled Provider Open + Single Image Smoke ===\n");

report.branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" }).stdout?.trim();
report.head = spawnSync("git", ["log", "--oneline", "-1"], { encoding: "utf8" }).stdout?.trim();

const liveEnv = loadEnvFiles();

console.log("Gate: Launch + env sync + deploy + provider open…");
const gates = {
  launch: auditLaunchGates(liveEnv),
  envSync: auditEnvSyncGate({ ...liveEnv, LIVE_ENV_SYNC_CONFIRM: process.env.LIVE_ENV_SYNC_CONFIRM }),
  deploy: auditDeployGate({ ...liveEnv, LIVE_DEPLOY_CONFIRM: process.env.LIVE_DEPLOY_CONFIRM }),
  providerOpen: auditProviderOpenGate({
    ...liveEnv,
    LIVE_PROVIDER_OPEN_CONFIRM: process.env.LIVE_PROVIDER_OPEN_CONFIRM,
  }),
};
report.gates = {
  launch: gates.launch.pass,
  env_sync: gates.envSync.pass,
  deploy: gates.deploy.pass,
  provider_open: gates.providerOpen.pass,
};

if (!Object.values(gates).every((g) => g.pass)) {
  console.error("❌ Confirm gates not satisfied.");
  if (!gates.launch.pass) console.error(`  LAUNCH_MODE + LIVE_LAUNCH_CONFIRM='${LIVE_CONFIRM_VALUE}'`);
  if (!gates.envSync.pass) console.error(`  LIVE_ENV_SYNC_CONFIRM='${LIVE_ENV_SYNC_CONFIRM_VALUE}'`);
  if (!gates.deploy.pass) console.error(`  LIVE_DEPLOY_CONFIRM='${LIVE_DEPLOY_CONFIRM_VALUE}'`);
  if (!gates.providerOpen.pass) {
    console.error(`  LIVE_PROVIDER_OPEN_CONFIRM='${LIVE_PROVIDER_OPEN_CONFIRM_VALUE}'`);
  }
  report.diagnosis = "confirm_gates_blocked";
  writeReport();
  process.exit(1);
}
console.log("✅ All confirm gates OK");

console.log("\nValidation suite…");
report.validation = [
  runCmd("lint", "npm", ["run", "lint"]),
  runCmd("test:unit", "npm", ["run", "test:unit", "--", "--run"]),
  runCmd("typecheck", "npm", ["run", "typecheck"]),
  runCmd("build", "npm", ["run", "build"]),
];
const validationFail = report.validation.some((v) => !v.ok);
if (validationFail) {
  report.diagnosis = "validation_failed";
  report.blockers = report.validation.filter((v) => !v.ok).map((v) => `${v.label}_failed`);
  writeReport();
  fail("Validation suite failed — provider open aborted", 2);
}
console.log("✅ lint / test:unit / typecheck / build PASS");

console.log("\nlaunch:production:check…");
const check = runCmd("launch:production:check", "npm", ["run", "launch:production:check"]);
report.launch_check = check.ok;
if (!check.ok) {
  report.diagnosis = "launch_check_failed";
  writeReport();
  fail("launch:production:check FAIL — provider open aborted", 3);
}
console.log("✅ launch:production:check PASS");

console.log("\nLIVE-2R prerequisite audit (read-only)…");
report.live_2r_prereq = await auditLive2rPrerequisites(liveEnv);
report.qa = report.live_2r_prereq.qa;
report.credits_before = report.qa?.credits ?? null;

if (!report.live_2r_prereq.pass) {
  console.error("❌ LIVE-2R prerequisites not satisfied:");
  console.error("  Blockers:", report.live_2r_prereq.blockers.join(", "));
  report.diagnosis = "live_2r_prereq_blocked";
  report.blockers = report.live_2r_prereq.blockers;
  report.provider_env_open = false;
  report.deploy_executed = false;
  report.provider_final_open = false;
  writeReport();
  process.exit(4);
}
console.log("✅ LIVE-2R prerequisites OK");

console.log("\nPre-open guard (expect disabled)…");
report.guard_before = probeProductionProviderGuard(DOMAIN);
if (!report.guard_before.pass) {
  report.diagnosis = "guard_not_disabled_before_open";
  writeReport();
  fail("Provider guard not disabled before open — aborting", 5);
}
console.log("✅ Provider guard disabled before open");

console.log("\nSync Production provider flags → OPEN (2 keys only)…");
const syncOpen = syncProductionProviderFlags({ disabled: false }, process.env);
report.provider_env_open = syncOpen.ok;
report.provider_sync_keys = syncOpen.synced;
if (!syncOpen.ok) {
  report.diagnosis = "provider_env_sync_failed";
  writeReport();
  fail(`Provider env sync failed: ${syncOpen.failed?.join(", ")}`, 6);
}
console.log(`✅ Synced: ${syncOpen.synced.join(", ")}`);

console.log("\nProduction deploy…");
const deploy = deployProduction();
report.deploy_executed = deploy.ok;
if (!deploy.ok) {
  await closeProvidersAndDeploy();
  report.diagnosis = "deploy_failed_rollback";
  writeReport();
  fail("Production deploy failed — providers rolled back to disabled", 7);
}
console.log("✅ Deploy complete — waiting 60s…");
await sleepMs(60000);

console.log("\nPost-deploy checks…");
report.post_deploy = {
  home: fetchRoute("/"),
  pricing: fetchRoute("/pricing"),
  sign_in: fetchRoute("/auth/sign-in"),
  guard_open: probeProductionProviderGuardOpen(DOMAIN),
  pricing_packs: null,
};

try {
  const pricingHtml = execSync(`curl.exe -s -L "${DOMAIN}/pricing"`, {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  const packs = [25, 70, 160, 320].filter((n) => pricingHtml.includes(String(n)));
  report.post_deploy.pricing_packs = {
    found: packs,
    all: packs.length === 4,
  };
} catch {
  report.post_deploy.pricing_packs = { all: false };
}

const postOk =
  report.post_deploy.home.ok &&
  report.post_deploy.pricing.ok &&
  report.post_deploy.sign_in.ok &&
  report.post_deploy.guard_open.pass &&
  report.post_deploy.pricing_packs?.all;

if (!postOk) {
  console.error("❌ Post-deploy checks failed — rolling back providers");
  await closeProvidersAndDeploy();
  report.diagnosis = "post_deploy_failed_rollback";
  report.blockers = ["post_deploy_check_failed"];
  writeReport();
  process.exit(8);
}
console.log("✅ Post-deploy checks PASS (site up, guard open, pricing 25/70/160/320)");

const launchPassword = liveEnv.LAUNCH_QA_PASSWORD?.trim();
if (!launchPassword) {
  await closeProvidersAndDeploy();
  report.diagnosis = "missing_launch_qa_password_rollback";
  writeReport();
  fail("LAUNCH_QA_PASSWORD missing — providers rolled back", 9);
}

console.log("\nSingle image provider smoke (max 1 run)…");
const providerRunsRef = { count: 0 };
report.smoke = await runSingleImageSmoke(launchPassword, providerRunsRef);
report.provider_runs = providerRunsRef.count;

const qaAfter = await readQaSnapshot(liveEnv);
report.credits_after = qaAfter.credits ?? null;

const smokePass =
  report.smoke.success === true &&
  Boolean(report.smoke.generationId) &&
  report.smoke.image_fetch?.status === 200 &&
  report.credits_after === (report.credits_before ?? 0) - IMAGE_GEN_CREDIT_COST &&
  report.provider_runs === 1;

if (!smokePass) {
  console.error("❌ Provider smoke FAIL — closing providers");
  await closeProvidersAndDeploy();
  report.diagnosis = "smoke_failed_rollback";
  report.blockers = ["production_image_smoke_failed"];
  writeReport();
  process.exit(10);
}

report.provider_final_open = true;
report.provider_closed_on_failure = false;
report.diagnosis = "live_2s_pass";
report.go_public_readiness = "GO";

writeReport();
console.log(
  JSON.stringify(
    {
      diagnosis: report.diagnosis,
      provider_runs: report.provider_runs,
      user_fingerprint: report.qa?.user_fingerprint,
      credits_before: report.credits_before,
      credits_after: report.credits_after,
      generationId: Boolean(report.smoke.generationId),
      image_fetch: report.smoke.image_fetch?.status,
      provider_final_open: true,
      secrets_logged: false,
    },
    null,
    2
  )
);
process.exit(0);
