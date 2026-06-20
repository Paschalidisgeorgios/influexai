/**
 * Launch auth truth gate — G.10-P
 *
 * Requires VISUAL_QA_PASSWORD in shell or .env.local (never logged).
 * Optional: PREVIEW_URL, SKIP_ENSURE=1, SKIP_PLAYWRIGHT=1, SKIP_DEPLOY=1
 *
 * Run: npm run launch:auth-truth
 */
import { config } from "dotenv";
import { resolve } from "path";
import { execSync, spawnSync } from "child_process";
import { readFileSync, unlinkSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  STAGING_REF,
  PROD_REF,
  maskRef,
  supabaseJwtRef,
  extractSupabaseRefsFromText,
} from "./lib/supabase-env-audit.mjs";
import { resolveLatestPreviewUrl } from "./lib/resolve-latest-preview.mjs";
import { probePreviewProviderGuard } from "./lib/preview-provider-guard.mjs";

const EMAIL = "visualqa@influexai.test";
const FALLBACK_PREVIEW =
  "https://influexai-iad04g5x8-paschalidisgeorgios-projects.vercel.app";

config({ path: resolve(process.cwd(), ".env.local") });

const password = process.env.VISUAL_QA_PASSWORD?.trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  process.exit(code);
}

function missingPasswordExit() {
  console.error("❌ Missing VISUAL_QA_PASSWORD (not logged).");
  console.error("");
  console.error("PowerShell:");
  console.error("  $env:VISUAL_QA_PASSWORD = 'DEIN_NEUES_TEMPORÄRES_PASSWORT'");
  console.error("  npm run launch:auth-truth");
  console.error("");
  console.error("Or add VISUAL_QA_PASSWORD to .env.local (never commit).");
  process.exit(1);
}

if (!password) missingPasswordExit();

const localRef = maskRef(url);
const localAnonJwtRef = supabaseJwtRef(anonKey);

if (localRef === PROD_REF) fail("Local Supabase points to production — blocked.");
if (!url || !anonKey) fail("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

const report = {
  phase: "launch-auth-truth-g10p",
  email: EMAIL,
  local_supabase_ref: localRef,
  local_anon_jwt_ref: localAnonJwtRef,
  local_url_and_anon_match:
    Boolean(localRef && localAnonJwtRef && localRef === localAnonJwtRef),
  preview_url: null,
  preview_ready: false,
  preview_deploy_triggered: false,
  ensure_user: null,
  direct_supabase_sign_in_ok: false,
  direct_supabase_user_id: null,
  direct_supabase_error_code: null,
  direct_supabase_error_message: null,
  preview_bundle: null,
  preview_bundle_gate_pass: false,
  preview_url_anon_mismatch: false,
  provider_guard: null,
  playwright: null,
  launch_gate: {
    auth_gate_pass: false,
    preview_gate_pass: false,
    ui_smoke_ready: false,
  },
  diagnosis: null,
  blockers: [],
  secrets_logged: false,
};

console.log("=== Launch Auth Truth (G.10-P) ===\n");

if (localRef !== localAnonJwtRef) {
  console.warn(
    `⚠️  Local URL ref (${localRef}) != anon JWT ref (${localAnonJwtRef})`
  );
}

let previewUrl = (process.env.PREVIEW_URL ?? resolveLatestPreviewUrl(FALLBACK_PREVIEW) ?? FALLBACK_PREVIEW).replace(
  /\/$/,
  ""
);
report.preview_url = previewUrl;

if (process.env.LAUNCH_TRIGGER_PREVIEW === "1" && process.env.SKIP_DEPLOY !== "1") {
  console.log("Checking for newer preview deploy (no --prod)…");
  const deploy = spawnSync("npx", ["vercel", "--yes"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (deploy.status === 0) {
    report.preview_deploy_triggered = true;
    const detected = resolveLatestPreviewUrl(null);
    if (detected) {
      previewUrl = detected.replace(/\/$/, "");
      report.preview_url = previewUrl;
    }
    console.log(`✅ Preview deploy triggered → ${previewUrl}`);
  } else {
    console.warn("⚠️  Preview deploy skipped or failed — using latest known Ready URL");
  }
}

console.log(`Preview URL: ${previewUrl}\n`);

if (process.env.SKIP_ENSURE !== "1") {
  console.log("Step 1: Ensure staging visual QA user…");
  const ensure = spawnSync("node", ["scripts/ensure-staging-visual-qa-user.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VISUAL_QA_PASSWORD: password },
  });
  report.ensure_user = { exit_code: ensure.status ?? 1 };
  if (ensure.status !== 0) {
    console.error(ensure.stderr || ensure.stdout);
    fail("ensure-staging-visual-qa-user failed");
  }
  console.log("✅ User ensure completed\n");
}

console.log("Step 2: Direct Supabase anon signInWithPassword…");
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const { data, error } = await anon.auth.signInWithPassword({
  email: EMAIL,
  password,
});

report.direct_supabase_sign_in_ok = Boolean(data.user && !error);
report.direct_supabase_user_id = data.user?.id ?? null;
report.direct_supabase_error_code = error?.code ?? null;
report.direct_supabase_error_message = error?.message ?? null;

console.log(
  report.direct_supabase_sign_in_ok
    ? `✅ Direct sign-in OK (user_id=${report.direct_supabase_user_id})`
    : `❌ Direct sign-in FAIL (${report.direct_supabase_error_code}: ${report.direct_supabase_error_message})`
);

if (!report.direct_supabase_sign_in_ok) {
  report.diagnosis = "fall_a_direct_supabase_sign_in_failed";
  report.blockers.push("direct_supabase_sign_in_failed");
  report.launch_gate.auth_gate_pass = false;
  writeReports(report);
  fail("Direct Supabase sign-in failed — fix user/password sync first", 2);
}

report.launch_gate.auth_gate_pass = true;

console.log("\nStep 3: Preview bundle Supabase ref scan…");
const bundle = await scanPreviewBundle(previewUrl);
report.preview_bundle = bundle;
report.preview_url_anon_mismatch = bundle.url_anon_mismatch;
report.preview_bundle_gate_pass =
  bundle.staging_url_ref &&
  !bundle.production_url_ref &&
  !bundle.url_anon_mismatch &&
  bundle.anon_jwt_refs?.includes(STAGING_REF);

console.log(`   URL refs: ${bundle.url_refs.join(", ") || "(none)"}`);
console.log(`   Anon JWT refs: ${bundle.anon_jwt_refs.join(", ") || "(none)"}`);

if (!report.preview_bundle_gate_pass) {
  report.diagnosis = "fall_b_preview_bundle_or_env_mismatch";
  report.blockers.push("preview_bundle_env_mismatch");
  if (bundle.url_anon_mismatch) {
    report.blockers.push("preview_anon_key_production_url_staging");
  }
  console.warn("\n⚠️  Preview bundle gate FAIL — skipping UI login probe");
  console.warn(
    "Fix Vercel Preview NEXT_PUBLIC_SUPABASE_ANON_KEY to staging (ref jvjmqtxlqfqaoyjklpxh), then redeploy."
  );
} else {
  report.preview_ready = true;
}

console.log("\nStep 4: Provider guard probe…");
report.provider_guard = probePreviewProviderGuard(previewUrl);
console.log(
  report.provider_guard.pass
    ? "✅ Provider guard PASS (PROVIDERS_DISABLED)"
    : `❌ Provider guard FAIL (code=${report.provider_guard.code ?? "unknown"})`
);

if (report.preview_bundle_gate_pass && process.env.SKIP_PLAYWRIGHT !== "1") {
  console.log("\nStep 5: Playwright UI login probe…");
  const pw = spawnSync(
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
        ...process.env,
        VISUAL_QA_PASSWORD: password,
        PREVIEW_URL: previewUrl,
        PLAYWRIGHT_BASE_URL: previewUrl,
      },
    }
  );
  report.playwright = { exit_code: pw.status ?? 1 };
  try {
    report.playwright.ui = JSON.parse(
      readFileSync(resolve(process.cwd(), "scripts/visual-qa-auth-truth-ui.json"), "utf8")
    );
  } catch {
    report.playwright.ui = null;
  }

  if (report.playwright.ui?.ui_login_ok) {
    report.diagnosis = "fall_d_ui_login_pass";
    report.launch_gate.ui_smoke_ready = true;
  } else if (report.preview_bundle_gate_pass) {
    report.diagnosis = "fall_c_ui_login_fail";
    report.blockers.push("ui_login_failed");
  }
} else if (!report.preview_bundle_gate_pass) {
  report.playwright = { skipped: true, reason: "preview_bundle_gate_fail" };
}

report.launch_gate.preview_gate_pass =
  report.preview_bundle_gate_pass && report.provider_guard?.pass === true;

if (report.launch_gate.auth_gate_pass && report.launch_gate.preview_gate_pass && report.launch_gate.ui_smoke_ready) {
  report.diagnosis = "launch_gates_pass";
}

writeReports(report);

console.log("\n=== Launch Auth Truth Result ===");
console.log(JSON.stringify(report, null, 2));

const exitOk =
  report.launch_gate.auth_gate_pass &&
  report.launch_gate.preview_gate_pass &&
  report.launch_gate.ui_smoke_ready;

process.exit(exitOk ? 0 : 1);

async function scanPreviewBundle(previewBase) {
  const htmlTmp = join(tmpdir(), `vq-auth-${Date.now()}.html`);
  try {
    execSync(
      `npx vercel curl "${previewBase}/auth/sign-in" -s -o "${htmlTmp}"`,
      { stdio: "pipe" }
    );
    const html = readFileSync(htmlTmp, "utf8");
    unlinkSync(htmlTmp);

    const jsPaths = new Set();
    for (const m of html.matchAll(/\/_next\/static\/[^\s"'<>]+\.js[^\s"'<>]*/g)) {
      jsPaths.add(m[0].split("?")[0]);
    }

    const merged = { url_refs: new Set(), anon_jwt_refs: new Set() };
    const scanText = (text) => {
      const { url_refs, anon_jwt_refs } = extractSupabaseRefsFromText(text);
      url_refs.forEach((r) => merged.url_refs.add(r));
      anon_jwt_refs.forEach((r) => merged.anon_jwt_refs.add(r));
    };
    scanText(html);

    let scanned = 0;
    for (const jsPath of jsPaths) {
      const chunkTmp = join(tmpdir(), `vq-chunk-${scanned}.js`);
      try {
        execSync(
          `npx vercel curl "${previewBase}${jsPath}" -s -o "${chunkTmp}"`,
          { stdio: "pipe" }
        );
        scanText(readFileSync(chunkTmp, "utf8"));
        scanned += 1;
      } catch {
        /* skip */
      } finally {
        try {
          unlinkSync(chunkTmp);
        } catch {
          /* ignore */
        }
      }
    }

    const urlRefs = [...merged.url_refs];
    const anonRefs = [...merged.anon_jwt_refs];
    return {
      js_chunks_scanned: scanned,
      url_refs: urlRefs,
      anon_jwt_refs: anonRefs,
      staging_url_ref: urlRefs.includes(STAGING_REF),
      production_url_ref: urlRefs.includes(PROD_REF),
      production_anon_ref: anonRefs.includes(PROD_REF),
      staging_anon_ref: anonRefs.includes(STAGING_REF),
      url_anon_mismatch:
        urlRefs.length >= 1 &&
        anonRefs.length >= 1 &&
        !anonRefs.some((r) => urlRefs.includes(r)),
    };
  } catch (err) {
    return { error: String(err.message ?? err).slice(0, 200) };
  }
}

function writeReports(report) {
  mkdirSync(resolve(process.cwd(), "docs/reports"), { recursive: true });
  const mdPath = resolve(process.cwd(), "docs/reports/launch-auth-truth-g10p.md");
  const md = `# Launch Auth Truth — G.10-P

Generated: ${new Date().toISOString()}

## Launch Gate

| Gate | Result |
|------|--------|
| Auth Gate (direct Supabase sign-in) | ${report.launch_gate.auth_gate_pass ? "PASS" : "FAIL"} |
| Preview Gate (bundle + provider guard) | ${report.launch_gate.preview_gate_pass ? "PASS" : "FAIL"} |
| UI Smoke Ready | ${report.launch_gate.ui_smoke_ready ? "PASS" : "FAIL"} |

## Direct Supabase Auth

- User: \`${EMAIL}\`
- \`direct_supabase_sign_in_ok\`: ${report.direct_supabase_sign_in_ok}
- Supabase ref: ${report.local_supabase_ref}
- user_id: ${report.direct_supabase_user_id ?? "null"}
- error: ${report.direct_supabase_error_code ?? "null"} / ${report.direct_supabase_error_message ?? "null"}

## Preview

- URL: ${report.preview_url}
- Bundle URL refs: ${report.preview_bundle?.url_refs?.join(", ") ?? "n/a"}
- Bundle anon JWT refs: ${report.preview_bundle?.anon_jwt_refs?.join(", ") ?? "n/a"}
- URL/anon mismatch: ${report.preview_url_anon_mismatch ? "YES" : "no"}
- Provider guard: ${report.provider_guard?.pass ? "PASS" : "FAIL"} (${report.provider_guard?.code ?? "n/a"})

## UI Login

${report.playwright?.ui ? JSON.stringify(report.playwright.ui, null, 2) : "Skipped or not run"}

## Diagnosis

- **${report.diagnosis}**
- Blockers: ${report.blockers.length ? report.blockers.join(", ") : "none"}

## Vercel fix (if URL/anon mismatch)

Set Preview env \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` to staging anon key (JWT ref \`${STAGING_REF}\`), redeploy with \`npx vercel --yes\` (no \`--prod\`).

## G.10-O readiness

Provider UI smoke requires: Auth Gate PASS + Preview Gate PASS + UI login PASS + explicit provider window (not this sprint).
`;
  writeFileSync(mdPath, md);
  console.log(`\nReport: ${mdPath}`);
}
