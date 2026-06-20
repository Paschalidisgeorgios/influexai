/**
 * Visual QA auth truth test — staging direct sign-in + preview bundle audit.
 *
 * Requires VISUAL_QA_PASSWORD in .env.local (never logged).
 * Optional: PREVIEW_URL, SKIP_ENSURE=1, SKIP_PLAYWRIGHT=1
 *
 * Run: node scripts/visual-qa-auth-truth.mjs
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

const EMAIL = "visualqa@influexai.test";
const DEFAULT_PREVIEW =
  "https://influexai-iad04g5x8-paschalidisgeorgios-projects.vercel.app";

config({ path: resolve(process.cwd(), ".env.local") });

const password = process.env.VISUAL_QA_PASSWORD?.trim();
const previewUrl = (process.env.PREVIEW_URL ?? DEFAULT_PREVIEW).replace(/\/$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!password) {
  console.error("❌ Missing VISUAL_QA_PASSWORD (not logged).");
  console.error("Add to .env.local, then: node scripts/visual-qa-auth-truth.mjs");
  process.exit(1);
}

const localRef = maskRef(url);
const localAnonJwtRef = supabaseJwtRef(anonKey);

const report = {
  phase: "visual-qa-auth-truth",
  email: EMAIL,
  preview_url: previewUrl,
  local_supabase_ref: localRef,
  local_anon_jwt_ref: localAnonJwtRef,
  local_url_and_anon_match:
    Boolean(localRef && localAnonJwtRef && localRef === localAnonJwtRef),
  staging_ref_ok: localRef === STAGING_REF,
  ensure_user: null,
  direct_supabase_sign_in_ok: false,
  direct_supabase_user_id: null,
  direct_supabase_error_code: null,
  direct_supabase_error_message: null,
  preview_bundle: null,
  preview_bundle_staging_ok: false,
  preview_anon_jwt_ref: null,
  preview_url_anon_mismatch: false,
  playwright: null,
  diagnosis: null,
  secrets_logged: false,
};

console.log("=== Visual QA Auth Truth ===\n");

if (localRef === PROD_REF) fail("Local Supabase points to production — blocked.");
if (!url || !anonKey) fail("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (localRef !== localAnonJwtRef) {
  console.warn(
    `⚠️  Local URL ref (${localRef}) != anon JWT ref (${localAnonJwtRef}) — misconfigured .env.local`
  );
}

if (process.env.SKIP_ENSURE !== "1") {
  console.log("Step 1: Ensure staging visual QA user…");
  const ensure = spawnSync("node", ["scripts/ensure-staging-visual-qa-user.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VISUAL_QA_PASSWORD: password },
  });
  report.ensure_user = {
    exit_code: ensure.status ?? 1,
    stdout_tail: ensure.stdout?.slice(-400) ?? "",
    stderr_tail: ensure.stderr?.slice(-400) ?? "",
  };
  if (ensure.status !== 0) {
    console.error(ensure.stderr || ensure.stdout);
    fail("ensure-staging-visual-qa-user failed");
  }
  console.log("✅ User ensure completed\n");
} else {
  report.ensure_user = { skipped: true };
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

console.log("\nStep 3: Preview bundle Supabase ref scan…");
const htmlTmp = join(tmpdir(), `vq-auth-${Date.now()}.html`);
try {
  execSync(
    `npx vercel curl "${previewUrl}/auth/sign-in" -s -o "${htmlTmp}"`,
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
        `npx vercel curl "${previewUrl}${jsPath}" -s -o "${chunkTmp}"`,
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
  report.preview_bundle = {
    js_chunks_scanned: scanned,
    url_refs: urlRefs,
    anon_jwt_refs: anonRefs,
    production_url_ref: urlRefs.includes(PROD_REF),
    staging_url_ref: urlRefs.includes(STAGING_REF),
  };
  report.preview_bundle_staging_ok =
    urlRefs.includes(STAGING_REF) && !urlRefs.includes(PROD_REF);
  report.preview_anon_jwt_ref = anonRefs[0] ?? null;
  report.preview_url_anon_mismatch =
    urlRefs.length === 1 &&
    anonRefs.length === 1 &&
    urlRefs[0] !== anonRefs[0];

  console.log(`   URL refs in bundle: ${urlRefs.join(", ") || "(none)"}`);
  console.log(`   Anon JWT refs in bundle: ${anonRefs.join(", ") || "(none)"}`);
  if (report.preview_url_anon_mismatch) {
    console.warn(
      `⚠️  Preview URL ref (${urlRefs[0]}) != anon JWT ref (${anonRefs[0]}) — UI login will fail`
    );
  }
} catch (err) {
  report.preview_bundle = { error: String(err.message ?? err).slice(0, 200) };
  console.warn(`⚠️  Preview bundle scan failed: ${report.preview_bundle.error}`);
}

if (process.env.SKIP_PLAYWRIGHT !== "1") {
  console.log("\nStep 4: Playwright UI login probe…");
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
  report.playwright = {
    exit_code: pw.status ?? 1,
    stdout_tail: pw.stdout?.slice(-800) ?? "",
    stderr_tail: pw.stderr?.slice(-400) ?? "",
  };
  try {
    const resultPath = resolve(process.cwd(), "scripts/visual-qa-auth-truth-ui.json");
    const ui = JSON.parse(readFileSync(resultPath, "utf8"));
    report.playwright.ui = ui;
  } catch {
    report.playwright.ui = null;
  }
} else {
  report.playwright = { skipped: true };
}

if (!report.direct_supabase_sign_in_ok) {
  report.diagnosis =
    "direct_supabase_sign_in_failed — fix ensure-staging-visual-qa-user or VISUAL_QA_PASSWORD / staging user";
} else if (report.preview_url_anon_mismatch) {
  report.diagnosis =
    "preview_url_anon_key_mismatch — set Vercel Preview NEXT_PUBLIC_SUPABASE_ANON_KEY to staging anon key matching jvjmqtxlqfqaoyjklpxh, redeploy preview";
} else if (report.playwright?.ui?.ui_login_ok === false) {
  report.diagnosis =
    "direct_ok_ui_fail — login UI/client issue (trim email, error mapping, or stale preview deploy)";
} else if (report.playwright?.ui?.ui_login_ok === true) {
  report.diagnosis = "auth_flow_ok";
} else {
  report.diagnosis = "inconclusive — review playwright output";
}

mkdirSync(resolve(process.cwd(), "docs/reports"), { recursive: true });
const reportPath = resolve(process.cwd(), "docs/reports/visual-qa-auth-truth-g10o0f.md");
const md = `# Visual QA Auth Truth — G.10-O0F

Generated: ${new Date().toISOString()}

## Summary

| Check | Result |
|-------|--------|
| Direct Supabase sign-in | ${report.direct_supabase_sign_in_ok ? "PASS" : "FAIL"} |
| Local Supabase ref | ${localRef} |
| Local anon JWT ref | ${localAnonJwtRef ?? "(unknown)"} |
| Preview URL | ${previewUrl} |
| Preview bundle URL refs | ${report.preview_bundle?.url_refs?.join(", ") ?? "n/a"} |
| Preview bundle anon JWT refs | ${report.preview_bundle?.anon_jwt_refs?.join(", ") ?? "n/a"} |
| Preview URL/anon mismatch | ${report.preview_url_anon_mismatch ? "YES" : "no"} |
| UI login (Playwright) | ${report.playwright?.ui?.ui_login_ok ?? "not run"} |
| Diagnosis | ${report.diagnosis} |

## Direct sign-in

- \`direct_supabase_sign_in_ok\`: ${report.direct_supabase_sign_in_ok}
- \`user_id\`: ${report.direct_supabase_user_id ?? "null"}
- \`error_code\`: ${report.direct_supabase_error_code ?? "null"}
- \`error_message\`: ${report.direct_supabase_error_message ?? "null"}

## Playwright UI

${report.playwright?.ui ? "```json\n" + JSON.stringify(report.playwright.ui, null, 2) + "\n```" : "Not available"}

## Machine-readable

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;
writeFileSync(reportPath, md);

console.log("\n=== Auth Truth Result ===");
console.log(JSON.stringify(report, null, 2));
console.log(`\nReport: ${reportPath}`);

process.exit(
  report.direct_supabase_sign_in_ok &&
    report.preview_bundle_staging_ok &&
    !report.preview_url_anon_mismatch &&
    report.playwright?.ui?.ui_login_ok !== false
    ? 0
    : 1
);
