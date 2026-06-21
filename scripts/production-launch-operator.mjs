/**
 * PHASE LIVE-1 — Production Launch Operator
 *
 * Requires:
 *   LAUNCH_MODE=live
 *   LIVE_LAUNCH_CONFIRM=I_UNDERSTAND_THIS_GOES_LIVE
 *   Live credentials in .env.production.local (preferred) or .env.local
 *
 * Check-only (Steps 0–2, no env sync / deploy):
 *   npm run launch:production:check
 *   --check-only
 *   LAUNCH_CHECK_ONLY=true
 *
 * Step 3 env sync additionally requires:
 *   LIVE_ENV_SYNC_CONFIRM=I_UNDERSTAND_THIS_UPDATES_VERCEL_PRODUCTION_ENV
 *
 * Step 4 deploy additionally requires:
 *   LIVE_DEPLOY_CONFIRM=I_UNDERSTAND_THIS_DEPLOYS_TO_PRODUCTION
 *
 * Run: npm run launch:production
 */
import { parse } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { spawnSync, execSync } from "child_process";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import {
  auditLaunchGates,
  auditRequiredLiveEnv,
  auditEnvSyncGate,
  auditDeployGate,
  isLaunchCheckOnly,
  buildProductionLiveClosedMap,
  buildProductionLiveOpenMap,
  auditProductionLiveMap,
  LIVE_CONFIRM_VALUE,
  LIVE_ENV_SYNC_CONFIRM_VALUE,
  LIVE_DEPLOY_CONFIRM_VALUE,
} from "./lib/production-live-env.mjs";
import { checkProductionSupabaseReadiness } from "./lib/production-supabase-readiness.mjs";
import { syncProductionEnvFromMap } from "./lib/sync-vercel-production-env.mjs";
import { scanPreviewBundle, cleanVercelEnv } from "./lib/scan-preview-bundle.mjs";
import { probeProductionProviderGuard } from "./lib/production-provider-guard.mjs";
import { isCreditExemptProfile } from "./lib/credit-exempt.mjs";

const DOMAIN = "https://www.influexaicreator.com";
const REPORT_PATH = resolve(
  process.cwd(),
  "docs/reports/production-live-launch-gate.md"
);
const LAUNCH_QA_EMAIL = "launchqa@influexai.test";
const TARGET_CREDITS = 75;
const PROMPT =
  "Minimal premium product visual of a translucent lime green glass cube on soft ivory background, studio lighting, no text, no logo, no watermark";

const CHECK_ONLY =
  process.argv.includes("--check-only") ||
  ["true", "1", "yes"].includes(
    String(process.env.LAUNCH_CHECK_ONLY ?? "").trim().toLowerCase()
  );

const report = {
  phase: CHECK_ONLY ? "production-live-launch-check" : "production-live-launch-gate",
  domain: DOMAIN,
  check_only: CHECK_ONLY,
  provider_runs: 0,
  blockers: [],
  diagnosis: null,
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
  const localPath = resolve(process.cwd(), ".env.local");
  const prodPath = resolve(process.cwd(), ".env.production.local");
  const merged = parseEnvFile(localPath);
  for (const [key, value] of Object.entries(parseEnvFile(prodPath))) {
    if (String(value ?? "").trim() !== "") {
      merged[key] = value;
    }
  }
  for (const key of [
    "LAUNCH_MODE",
    "LIVE_LAUNCH_CONFIRM",
    "LIVE_ENV_SYNC_CONFIRM",
    "LIVE_DEPLOY_CONFIRM",
    "LAUNCH_CHECK_ONLY",
    "LAUNCH_QA_PASSWORD",
    "DATABASE_URL",
    "SUPABASE_DB_PASSWORD",
  ]) {
    const shellVal = process.env[key];
    if (String(shellVal ?? "").trim() !== "") {
      merged[key] = shellVal;
    }
  }
  return merged;
}

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  report.blockers.push(String(message).slice(0, 200));
  report.diagnosis = report.diagnosis ?? "blocked";
  writeReport();
  process.exit(code);
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
    const body = execSync(`curl.exe -s -L "${url}"`, {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    }).slice(0, 12000);
    const crash =
      /middleware.*error|internal server error|application error/i.test(body) &&
      !/<!DOCTYPE html/i.test(body.slice(0, 200));
    return {
      path,
      status: Number(status),
      ok: Number(status) >= 200 && Number(status) < 500,
      crash,
      auth_redirect:
        path.includes("/dashboard") &&
        (body.includes("/auth/sign-in") || status === "307" || status === "302"),
    };
  } catch (err) {
    return { path, status: 0, ok: false, error: String(err.message).slice(0, 120) };
  }
}

function fetchLegalSurface() {
  const routes = {
    impressum: fetchRoute("/impressum"),
    datenschutz: fetchRoute("/datenschutz"),
    agb: fetchRoute("/agb"),
    pricing: fetchRoute("/pricing"),
    home: fetchRoute("/"),
  };

  const homeBody = (() => {
    try {
      return execSync(`curl.exe -s -L "${DOMAIN}/"`, { encoding: "utf8" }).slice(0, 20000);
    } catch {
      return "";
    }
  })();

  const pricingBody = (() => {
    try {
      return execSync(`curl.exe -s -L "${DOMAIN}/pricing"`, {
        encoding: "utf8",
      }).slice(0, 20000);
    } catch {
      return "";
    }
  })();

  const blockers = [];
  if (!routes.impressum.ok) blockers.push("impressum_missing");
  if (!routes.datenschutz.ok) blockers.push("datenschutz_missing");
  if (!routes.agb.ok) blockers.push("agb_missing");

  const footerLinks =
    /impressum/i.test(homeBody) &&
    /datenschutz/i.test(homeBody) &&
    (/agb|nutzungsbedingungen/i.test(homeBody) || /terms/i.test(homeBody));

  const testModeBanner =
    /test\s*mode|testmodus|stripe.*test|sandbox/i.test(pricingBody) ||
    /test\s*mode|testmodus/i.test(homeBody);

  const riskyToolClaims =
    /lora\s*training|face\s*swap|elevenlabs|akool/i.test(pricingBody) &&
    !/demnächst|coming soon|nicht verfügbar|deaktiviert/i.test(pricingBody);

  if (!footerLinks) blockers.push("legal_footer_links_missing");
  if (testModeBanner) blockers.push("public_testmode_banner");
  if (riskyToolClaims) blockers.push("pricing_claims_inactive_tools");

  const refundHint =
    /credit|gutschrift|erstatt|refund/i.test(pricingBody) ||
    /credit|gutschrift|erstatt|refund/i.test(homeBody);

  return {
    routes,
    footer_links: footerLinks,
    testmode_banner: testModeBanner,
    risky_tool_claims: riskyToolClaims,
    refund_or_credit_hint: refundHint,
    pass: blockers.length === 0,
    blockers,
  };
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

async function ensureLaunchQaUser(liveEnv, password) {
  const url = liveEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = liveEnv.SUPABASE_SERVICE_ROLE_KEY;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let user = null;
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  user = listData?.users?.find(
    (u) => u.email?.toLowerCase() === LAUNCH_QA_EMAIL.toLowerCase()
  );

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: LAUNCH_QA_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Production Launch QA" },
    });
    if (error) fail(`create launch QA user: ${error.message}`);
    user = data.user;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) fail(`update launch QA user: ${error.message}`);
  }

  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: LAUNCH_QA_EMAIL,
      plan: "starter",
      credits: TARGET_CREDITS,
      onboarding_completed: true,
      role: "user",
      is_admin: false,
    },
    { onConflict: "id" }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("credits, plan, role, is_admin")
    .eq("id", user.id)
    .single();

  const exempt = isCreditExemptProfile(
    LAUNCH_QA_EMAIL,
    profile,
    liveEnv.ADMIN_EMAIL_ALLOWLIST
  );
  if (exempt.exempt) fail("launch QA user must not be credit-exempt");

  if ((profile?.credits ?? 0) !== TARGET_CREDITS) {
    const delta = TARGET_CREDITS - (profile?.credits ?? 0);
    if (delta > 0) {
      await admin.rpc("add_credits", { p_user_id: user.id, p_amount: delta });
    } else {
      await admin.from("profiles").update({ credits: TARGET_CREDITS }).eq("id", user.id);
    }
  }

  return { userId: user.id, credits: TARGET_CREDITS, plan: "starter" };
}

async function runProductionLiveSmoke(password) {
  if (report.provider_runs >= 1) fail("Provider run limit exceeded");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: DOMAIN,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
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
    gallery_route_ok: false,
  };

  try {
    await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
    const accept = page.getByRole("button", { name: /^Akzeptieren$/i });
    if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
      await accept.click();
    }
    await page.getByTestId("auth-email").fill(LAUNCH_QA_EMAIL);
    await page.getByTestId("auth-password").fill(password);
    await page.getByRole("button", { name: /anmelden|sign in|jetzt anmelden/i }).click();
    await page.waitForURL(
      (url) => new URL(url).pathname.startsWith("/dashboard"),
      { timeout: 45000 }
    );

    await page.goto("/dashboard?tool=image-gen", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.getByTestId("image-gen-prompt").fill(PROMPT);
    const generateBtn = page.getByTestId("image-gen-generate-standard").last();
    await generateBtn.waitFor({ state: "visible", timeout: 60000 });
    for (let i = 0; i < 30; i += 1) {
      if (await generateBtn.isEnabled()) break;
      await sleepMs(2000);
    }
    if (!(await generateBtn.isEnabled())) {
      smoke.ui_error = "generate_button_disabled";
      return smoke;
    }

    report.provider_runs = 1;
    await generateBtn.click({ timeout: 180000 });

    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      if (apiCapture?.body?.success === true && apiCapture?.body?.generationId) break;
      if (apiCapture?.body?.success === false && apiCapture?.status >= 400) break;
      await sleepMs(2000);
    }

    smoke.http_status = apiCapture?.status ?? null;
    smoke.success = apiCapture?.body?.success === true;
    smoke.generationId = apiCapture?.body?.generationId ?? null;
    smoke.imageUrl = apiCapture?.body?.imageUrl ?? null;
    smoke.credits_used = apiCapture?.body?.creditsUsed ?? null;

    if (smoke.imageUrl) {
      smoke.image_fetch = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return { status: r.status, contentType: r.headers.get("content-type") };
      }, smoke.imageUrl);
    }

    await page.goto("/dashboard/gallery", { waitUntil: "domcontentloaded" });
    smoke.gallery_route_ok = page.url().includes("/dashboard/gallery");
  } finally {
    await browser.close();
  }

  return smoke;
}

function writeReport() {
  mkdirSync(resolve(process.cwd(), "docs/reports"), { recursive: true });
  const r = report;
  const md = `# Production Live Launch Gate — LIVE-1

Generated: ${new Date().toISOString()}

## Go/No-Go

| Check | Result |
|-------|--------|
| Live Launch Status | ${r.diagnosis === "live_1_pass" ? "**GO (Image MVP ready)**" : r.diagnosis === "live_check_only_pass" ? "**CHECK-ONLY PASS (Steps 0–2)**" : "**NO-GO**"} |
| Check-only mode | ${r.check_only ? "yes" : "no"} |
| Provider runs | ${r.provider_runs} (max 1) |
| Secrets logged | **no** |

## Safety

- Branch: \`${r.branch ?? "n/a"}\`
- HEAD: \`${r.head ?? "n/a"}\`
- Production deploy: ${r.production_deployed ? "yes" : "no"}
- Provider window closed on failure: ${r.provider_closed_on_failure ? "yes" : "n/a"}

## Required Env

- Production Supabase ref: ${r.required_env?.supabase_ref ?? "n/a"}
- Stripe mode: ${r.required_env?.stripe_mode ?? "n/a"}
- Stripe key mode: ${r.required_env?.stripe_secret_kind ?? "n/a"}
- Provider key: ${r.required_env?.provider_key_present ? r.required_env.provider_key_name : "missing"}
- Missing env keys: ${r.required_env?.missing?.length ? r.required_env.missing.join(", ") : "none"}

## Production Supabase Readiness

- Local migrations max: ${r.supabase_readiness?.local_migrations?.max ?? "n/a"} / ${r.supabase_readiness?.local_migrations?.expected_max ?? 68}
- Remote migration 068: ${r.supabase_readiness?.remote_migrations?.has_068 ? "yes" : "no/unknown"}
- Tables: ${r.supabase_readiness?.tables?.map((t) => `${t.table}=${t.ok ? "ok" : "fail"}`).join(", ") ?? "n/a"}
- deduct_credits RPC: ${r.supabase_readiness?.rpc?.ok ? "ok" : "fail"}
- Storage: ${r.supabase_readiness?.storage?.ok ? "ok" : "fail"}
- Readiness: ${r.supabase_readiness?.pass ? "PASS" : "FAIL"}

## Migration Query Diagnostics

- Query: \`${r.supabase_readiness?.migration_query_diagnostics?.query ?? "select version from supabase_migrations.schema_migrations order by version"}\`
- Transport: ${r.supabase_readiness?.migration_query_diagnostics?.transport ?? "postgres_direct_pooler"}
- Connection method: ${r.supabase_readiness?.migration_query_diagnostics?.connection_method ?? "n/a"}
- Connection ref: ${r.supabase_readiness?.migration_query_diagnostics?.connection_ref ?? "n/a"}
- Supabase URL ref: ${r.supabase_readiness?.migration_query_diagnostics?.supabase_url_ref ?? "n/a"}
- Production ref checked: ${r.supabase_readiness?.migration_query_diagnostics?.is_production_ref ? "yes" : "no"}
- Connect OK: ${r.supabase_readiness?.migration_query_diagnostics?.connect_ok ? "yes" : "no"}
- Migration schema exists: ${r.supabase_readiness?.migration_query_diagnostics?.migration_schema_exists === true ? "yes" : r.supabase_readiness?.migration_query_diagnostics?.migration_schema_exists === false ? "no" : "n/a"}
- Migration table query OK: ${r.supabase_readiness?.migration_query_diagnostics?.migration_table_query_ok ? "yes" : "no"}
- Error class: ${r.supabase_readiness?.migration_query_diagnostics?.error?.error_class ?? r.supabase_readiness?.remote_migrations?.error_detail?.error_class ?? "n/a"}
- Error code: ${r.supabase_readiness?.migration_query_diagnostics?.error?.code ?? r.supabase_readiness?.remote_migrations?.error_detail?.code ?? "n/a"}
- Sanitized error: ${r.supabase_readiness?.migration_query_diagnostics?.error?.message ?? r.supabase_readiness?.remote_migrations?.error ?? "none"}

## Dry-Run Deploy (Provider Disabled)

- Landing: ${r.dry_run?.routes?.home?.status ?? "n/a"}
- Pricing: ${r.dry_run?.routes?.pricing?.status ?? "n/a"}
- Auth: ${r.dry_run?.routes?.sign_in?.status ?? "n/a"}
- Dashboard route: ${r.dry_run?.routes?.image_generator?.status ?? "n/a"}
- Provider guard: ${r.dry_run?.guard?.pass ? "PASS" : "FAIL"} (${r.dry_run?.guard?.code ?? "n/a"})

## Legal / Surface

- Impressum: ${r.legal?.routes?.impressum?.ok ? "ok" : "fail"}
- Datenschutz: ${r.legal?.routes?.datenschutz?.ok ? "ok" : "fail"}
- AGB: ${r.legal?.routes?.agb?.ok ? "ok" : "fail"}
- Footer legal links: ${r.legal?.footer_links ? "yes" : "no"}
- Testmode banner: ${r.legal?.testmode_banner ? "yes (blocker)" : "no"}
- Refund/credit hint: ${r.legal?.refund_or_credit_hint ? "present" : "not found"}

## Provider Live

- Provider opened: ${r.provider_opened ? "yes" : "no"}
- Deploy after open: ${r.provider_deploy_after_open ? "yes" : "no"}
- Smoke user: \`${LAUNCH_QA_EMAIL}\`
- Credits before: ${r.live_smoke?.credits_before ?? "n/a"}
- Credits after: ${r.live_smoke?.credits_after ?? "n/a"}
- generationId: ${r.live_smoke?.generationId ?? "n/a"}
- imageUrl: ${r.live_smoke?.imageUrl ? "(set, not logged)" : "n/a"}
- Gallery: ${r.live_smoke?.gallery_route_ok ? "ok" : "fail"}
- Provider remained active: ${r.provider_remained_active ? "yes" : "no"}

## Blockers

${r.blockers.length ? r.blockers.map((b) => `- ${b}`).join("\n") : "- none"}

## Diagnosis

**${r.diagnosis ?? "pending"}**

## Immediate Next Action

${r.next_action ?? "Review blockers above."}

---
No secrets in this report.
`;
  writeFileSync(REPORT_PATH, md);
  console.log(`\nReport: ${REPORT_PATH}`);
}

async function closeProviderOnProduction(liveEnv) {
  const closed = buildProductionLiveClosedMap(liveEnv);
  syncProductionEnvFromMap(closed, process.env);
  return deployProduction();
}

console.log(
  CHECK_ONLY
    ? "=== Production Launch Operator (CHECK-ONLY Steps 0–2) ===\n"
    : "=== Production Launch Operator (LIVE-1) ===\n"
);

delete process.env.VERCEL_DEBUG;
delete process.env.DEBUG;

report.branch = spawnSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
}).stdout?.trim();
report.head = spawnSync("git", ["log", "--oneline", "-1"], {
  encoding: "utf8",
}).stdout?.trim();

const liveEnv = loadEnvFiles();

console.log("Step 0: Launch gates…");
report.launch_gates = auditLaunchGates(liveEnv);
if (!report.launch_gates.pass) {
  console.error("❌ Launch gates not satisfied.");
  console.error("");
  console.error("Required (PowerShell):");
  console.error(`  $env:LAUNCH_MODE='live'`);
  console.error(`  $env:LIVE_LAUNCH_CONFIRM='${LIVE_CONFIRM_VALUE}'`);
  console.error("  npm run launch:production");
  console.error("");
  console.error("Or add to .env.production.local (never commit secrets).");
  report.blockers.push(...report.launch_gates.blockers);
  report.diagnosis = "launch_gates_blocked";
  report.next_action = report.launch_gates.required_command;
  writeReport();
  process.exit(1);
}
console.log("✅ Launch gates OK");

console.log("\nStep 1: Required live env audit…");
report.required_env = auditRequiredLiveEnv(liveEnv);
if (!report.required_env.pass) {
  console.error("❌ Missing or invalid live env.");
  if (report.required_env.missing.length) {
    console.error("Missing keys:", report.required_env.missing.join(", "));
  }
  if (report.required_env.blockers.length) {
    console.error("Blockers:", report.required_env.blockers.join(", "));
  }
  report.blockers.push(
    ...report.required_env.missing.map((k) => `missing_${k}`),
    ...report.required_env.blockers
  );
  report.diagnosis = "missing_live_env";
  report.next_action = [
    "Populate .env.production.local (never commit) with:",
    "- Production Supabase (ref hszjafdelcydnppyolkm): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY",
    "- Stripe Live: STRIPE_MODE=live, NEXT_PUBLIC_STRIPE_MODE=live, STRIPE_SECRET_KEY (sk_live_), NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_), STRIPE_WEBHOOK_SECRET",
    "- Live price IDs: all NEXT_PUBLIC_STRIPE_INFLUEXAI_* + STRIPE_CREDITS_25/70/160/320 + STRIPE_AGENCY_*",
    "- Provider start closed: PROVIDERS_DISABLED=true, NEXT_PUBLIC_PROVIDERS_DISABLED=true, ALLOW_SAFE_DEV_PROVIDER_SMOKE=false",
    "- FAL_API_KEY or FAL_KEY",
    "- Optional migration check: DATABASE_URL or SUPABASE_DB_PASSWORD",
    "- Smoke: LAUNCH_QA_PASSWORD",
    "Then: $env:LAUNCH_MODE='live'; $env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'; npm run launch:production",
  ].join("\n");
  writeReport();
  process.exit(1);
}
console.log("✅ Required live env OK");

console.log("\nStep 2: Production Supabase readiness (read-only)…");
report.supabase_readiness = await checkProductionSupabaseReadiness(liveEnv);
if (!report.supabase_readiness.pass) {
  console.error("❌ Production Supabase not ready.");
  console.error("Blockers:", report.supabase_readiness.blockers.join(", "));
  const mig = report.supabase_readiness.migration_query_diagnostics;
  if (mig) {
    console.error("Migration diagnostics:", JSON.stringify({
      connection_method: mig.connection_method,
      connection_ref: mig.connection_ref,
      supabase_url_ref: mig.supabase_url_ref,
      is_production_ref: mig.is_production_ref,
      connect_ok: mig.connect_ok,
      migration_schema_exists: mig.migration_schema_exists,
      migration_table_query_ok: mig.migration_table_query_ok,
      error: mig.error ?? report.supabase_readiness.remote_migrations?.error_detail ?? null,
      secrets_logged: false,
    }, null, 2));
  }
  if (report.supabase_readiness.migration_plan_command) {
    console.error("Migration plan:", report.supabase_readiness.migration_plan_command);
  }
  report.blockers.push(...report.supabase_readiness.blockers);
  report.diagnosis = "supabase_not_ready";
  report.next_action =
    report.supabase_readiness.migration_plan_command ??
    "Fix Production Supabase tables/RPC/storage before live launch.";
  writeReport();
  process.exit(1);
}
console.log("✅ Production Supabase readiness OK");

if (CHECK_ONLY) {
  report.diagnosis = "live_check_only_pass";
  report.next_action = [
    "Check-only complete. No Vercel env sync, no deploy, no provider.",
    "Next (manual): set LIVE_ENV_SYNC_CONFIRM then re-run for Step 3 only via full operator.",
    `$env:LIVE_ENV_SYNC_CONFIRM='${LIVE_ENV_SYNC_CONFIRM_VALUE}'`,
    `$env:LIVE_DEPLOY_CONFIRM='${LIVE_DEPLOY_CONFIRM_VALUE}'`,
    "npm run launch:production",
  ].join("\n");
  writeReport();
  console.log("\n✅ Check-only PASS — stopped after Step 2 (no env sync, no deploy).");
  process.exit(0);
}

console.log("\nStep 3 gate: Vercel Production env sync confirmation…");
report.env_sync_gate = auditEnvSyncGate({
  ...liveEnv,
  LIVE_ENV_SYNC_CONFIRM: process.env.LIVE_ENV_SYNC_CONFIRM,
});
if (!report.env_sync_gate.pass) {
  console.error("❌ Env sync blocked — explicit confirmation required.");
  console.error(`Required: $env:LIVE_ENV_SYNC_CONFIRM='${LIVE_ENV_SYNC_CONFIRM_VALUE}'`);
  report.blockers.push(...report.env_sync_gate.blockers);
  report.diagnosis = "env_sync_gate_blocked";
  report.next_action = report.env_sync_gate.required_command;
  writeReport();
  process.exit(1);
}
console.log("✅ Env sync confirmation OK");

console.log("\nStep 3: Sync Production env — Phase 1 (providers disabled)…");
const closedMap = buildProductionLiveClosedMap(liveEnv);
const closedAudit = auditProductionLiveMap(closedMap, { providersOpen: false });
if (!closedAudit.pass) {
  fail(`Closed env map invalid: ${closedAudit.blockers.join(", ")}`);
}
const sync1 = syncProductionEnvFromMap(closedMap, process.env);
report.env_sync_phase1 = { synced: sync1.synced.length, failed: sync1.failed };
if (!sync1.ok) fail(`Production env sync failed: ${sync1.failed.join(", ")}`);
console.log(`✅ Phase 1 env synced (${sync1.synced.length} keys)`);

console.log("\nStep 4 gate: Production deploy confirmation…");
report.deploy_gate = auditDeployGate({
  ...liveEnv,
  LIVE_DEPLOY_CONFIRM: process.env.LIVE_DEPLOY_CONFIRM,
});
if (!report.deploy_gate.pass) {
  console.error("❌ Deploy blocked — explicit confirmation required.");
  console.error(`Required: $env:LIVE_DEPLOY_CONFIRM='${LIVE_DEPLOY_CONFIRM_VALUE}'`);
  report.blockers.push(...report.deploy_gate.blockers);
  report.diagnosis = "deploy_gate_blocked";
  report.next_action = report.deploy_gate.required_command;
  writeReport();
  process.exit(1);
}
console.log("✅ Deploy confirmation OK");

console.log("\nStep 4: Production deploy — Phase 1…");
const deploy1 = deployProduction();
report.production_deployed = deploy1.ok;
if (!deploy1.ok) fail("Production deploy phase 1 failed");
console.log("✅ Phase 1 deploy complete");
console.log("Waiting 60s for propagation…");
await sleepMs(60000);

console.log("\nStep 5: Dry-run domain + guard checks…");
report.dry_run = {
  routes: {
    home: fetchRoute("/"),
    pricing: fetchRoute("/pricing"),
    sign_in: fetchRoute("/auth/sign-in"),
    image_generator: fetchRoute("/dashboard/image-generator"),
    gallery: fetchRoute("/dashboard/gallery"),
  },
  guard: probeProductionProviderGuard(DOMAIN),
  bundle: await scanPreviewBundle(DOMAIN),
};

const dryRunOk =
  Object.values(report.dry_run.routes).every((r) => r.ok) &&
  report.dry_run.guard.pass &&
  report.dry_run.bundle.production_live_bundle_gate_pass === true;

if (!dryRunOk) {
  report.blockers.push("dry_run_deploy_failed");
  report.diagnosis = "dry_run_failed";
  report.next_action = "Fix domain/guard/bundle before opening providers.";
  writeReport();
  fail("Dry-run phase failed — providers not opened");
}

console.log("✅ Dry-run checks PASS (providers disabled, production refs in bundle)");

console.log("\nStep 6: Legal / launch surface…");
report.legal = fetchLegalSurface();
if (!report.legal.pass) {
  report.blockers.push(...report.legal.blockers);
  report.diagnosis = "legal_surface_failed";
  report.next_action = "Fix legal pages/footer/pricing claims before provider open.";
  writeReport();
  fail("Legal surface check failed — providers not opened");
}
console.log("✅ Legal surface OK");

console.log("\nStep 7: Open providers on Production…");
const openMap = buildProductionLiveOpenMap(liveEnv);
const openAudit = auditProductionLiveMap(openMap, { providersOpen: true });
if (!openAudit.pass) fail(`Open env map invalid: ${openAudit.blockers.join(", ")}`);
const sync2 = syncProductionEnvFromMap(openMap, process.env);
if (!sync2.ok) fail(`Provider open env sync failed: ${sync2.failed.join(", ")}`);
report.provider_opened = true;

const deploy2 = deployProduction();
report.provider_deploy_after_open = deploy2.ok;
if (!deploy2.ok) {
  await closeProviderOnProduction(liveEnv);
  report.provider_closed_on_failure = true;
  fail("Production deploy after provider open failed");
}
console.log("✅ Provider open deploy complete");
console.log("Waiting 60s for propagation…");
await sleepMs(60000);

const launchPassword = liveEnv.LAUNCH_QA_PASSWORD?.trim();
if (!launchPassword) {
  report.blockers.push("missing_launch_qa_password");
  report.diagnosis = "smoke_skipped_no_password";
  report.next_action =
    "Set LAUNCH_QA_PASSWORD in .env.production.local, re-run provider smoke manually.";
  await closeProviderOnProduction(liveEnv);
  report.provider_closed_on_failure = true;
  writeReport();
  fail("LAUNCH_QA_PASSWORD missing — provider closed again");
}

console.log("\nStep 8: Production live smoke (max 1 provider run)…");
const qa = await ensureLaunchQaUser(liveEnv, launchPassword);
report.live_smoke = {
  credits_before: qa.credits,
  userId: qa.userId,
};

report.live_smoke.result = await runProductionLiveSmoke(launchPassword);

const admin = createClient(
  liveEnv.NEXT_PUBLIC_SUPABASE_URL,
  liveEnv.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const { data: afterProfile } = await admin
  .from("profiles")
  .select("credits")
  .eq("id", qa.userId)
  .single();
report.live_smoke.credits_after = afterProfile?.credits ?? null;

const smokePass =
  report.live_smoke.result.success === true &&
  report.live_smoke.result.generationId &&
  report.live_smoke.result.image_fetch?.status === 200 &&
  report.live_smoke.credits_after === TARGET_CREDITS - 5 &&
  report.provider_runs === 1;

if (!smokePass) {
  console.error("❌ Production live smoke failed — closing providers");
  await closeProviderOnProduction(liveEnv);
  report.provider_closed_on_failure = true;
  report.provider_remained_active = false;
  report.blockers.push("production_live_smoke_failed");
  report.diagnosis = "live_smoke_failed";
  report.next_action = "Investigate smoke failure; providers re-disabled on Production.";
  writeReport();
  process.exit(1);
}

report.provider_remained_active = true;
report.diagnosis = "live_1_pass";
report.next_action =
  "Image MVP live. Monitor Stripe webhooks, auth, and first real customer signups.";

writeReport();

console.log("\n=== LIVE-1 Result ===");
console.log(
  JSON.stringify(
    {
      diagnosis: report.diagnosis,
      provider_runs: report.provider_runs,
      credits_before: report.live_smoke.credits_before,
      credits_after: report.live_smoke.credits_after,
      generationId: report.live_smoke.result.generationId,
      guard_was_disabled_for_smoke: true,
      provider_remained_active: report.provider_remained_active,
      secrets_logged: false,
    },
    null,
    2
  )
);

process.exit(0);
