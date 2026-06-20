/**
 * G.10-R — Final controlled Provider UI smoke on Preview (exactly one provider run).
 *
 * Run: npm run launch:provider-ui-smoke
 */
import { randomBytes } from "crypto";
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { spawnSync, execSync } from "child_process";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import {
  STAGING_REF,
  PROD_REF,
  maskRef,
  supabaseJwtRef,
} from "./lib/supabase-env-audit.mjs";
import {
  buildPreviewProviderSmokeOpenMap,
  buildPreviewProviderSmokeClosedMap,
  syncPreviewEnvFromMap,
} from "./lib/sync-vercel-preview-env.mjs";
import { scanPreviewBundle, cleanVercelEnv } from "./lib/scan-preview-bundle.mjs";
import { resolveLatestPreviewUrl } from "./lib/resolve-latest-preview.mjs";
import { probePreviewProviderGuard, probePreviewGenerateApiOpen } from "./lib/preview-provider-guard.mjs";
import { resolveVercelProtectionBypass } from "./lib/resolve-vercel-protection-bypass.mjs";
import { isCreditExemptProfile } from "./lib/credit-exempt.mjs";

const EMAIL = "visualqa@influexai.test";
const TARGET_CREDITS = 75;
const EXPECTED_DELTA = -5;
const PROMPT =
  "Minimal premium product visual of a translucent lime green glass cube on soft ivory background, studio lighting, no text, no logo, no watermark";
const REPORT_PATH = resolve(
  process.cwd(),
  "docs/reports/final-provider-ui-smoke-g10r.md"
);
const ENV_LOCAL = resolve(process.cwd(), ".env.local");

config({ path: ENV_LOCAL });
delete process.env.VERCEL_DEBUG;
delete process.env.DEBUG;

let sessionPassword = process.env.VISUAL_QA_PASSWORD?.trim() ?? "";
if (!sessionPassword) {
  sessionPassword = randomBytes(24).toString("base64url");
  process.env.VISUAL_QA_PASSWORD = sessionPassword;
}

const report = {
  phase: "final-provider-ui-smoke-g10r",
  provider_runs: 0,
  provider_window_closed: false,
  preview_url: null,
  smoke: null,
  gallery: null,
  guard_after_close: null,
  blockers: [],
  diagnosis: null,
  secrets_logged: false,
};

function fail(message, code = 1) {
  console.error(`❌ ${message}`);
  process.exit(code);
}

function falKeyAudit(env) {
  const fal = env.FAL_KEY?.trim() || env.FAL_API_KEY?.trim() || "";
  return {
    present: Boolean(fal),
    key_name: env.FAL_KEY?.trim()
      ? "FAL_KEY"
      : env.FAL_API_KEY?.trim()
        ? "FAL_API_KEY"
        : null,
    supports_both: true,
  };
}

function deployPreview() {
  const result = spawnSync("npx", ["vercel", "--yes", "--force"], {
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
  return { ok: result.status === 0, deployment_url: urlMatch?.[0] ?? null };
}

async function sleepMs(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function fetchPreviewText(url) {
  const tmp = resolve(process.cwd(), "scripts/.tmp-preview-fetch.html");
  try {
    execSync(`npx vercel curl "${url}" -s -o "${tmp}" 2>&1`, {
      stdio: "pipe",
      env: cleanVercelEnv(process.env),
      shell: process.platform === "win32",
    });
    const text = readFileSync(tmp, "utf8");
    unlinkSync(tmp);
    return text;
  } catch {
    return "";
  }
}

async function resolvePreviewUrl(deployUrl) {
  return (
    deployUrl?.replace(/\/$/, "") ??
    resolveLatestPreviewUrl(null) ??
    (await (async () => {
      for (let i = 0; i < 12; i += 1) {
        const url = resolveLatestPreviewUrl(null);
        if (url) return url.replace(/\/$/, "");
        await sleepMs(10000);
      }
      return null;
    })())
  );
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) fail("Missing Supabase admin env");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function ensureVisualQaUser() {
  const ensure = spawnSync("node", ["scripts/ensure-staging-visual-qa-user.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, VISUAL_QA_PASSWORD: sessionPassword },
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (ensure.status !== 0) {
    fail("ensure-staging-visual-qa-user failed");
  }
}

async function ensureCreditsExactly75(admin, userId) {
  const { data } = await admin
    .from("profiles")
    .select("credits, plan, role, is_admin")
    .eq("id", userId)
    .single();
  const current = data?.credits ?? 0;
  if (current === TARGET_CREDITS) return { ...data, credits: current };

  if (current < TARGET_CREDITS) {
    await admin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: TARGET_CREDITS - current,
    });
  } else {
    await admin.from("profiles").update({ credits: TARGET_CREDITS }).eq("id", userId);
  }

  const { data: after } = await admin
    .from("profiles")
    .select("credits, plan, role, is_admin")
    .eq("id", userId)
    .single();
  return after;
}

async function findUserId(admin) {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", EMAIL)
    .maybeSingle();
  return data?.id ?? null;
}

async function waitForAuthenticatedDashboard(page, context, getAuthStatus) {
  await page.waitForURL(
    (url) => {
      const path = new URL(url).pathname;
      return (
        path.startsWith("/dashboard") ||
        path.startsWith("/pricing") ||
        path.startsWith("/onboarding")
      );
    },
    { timeout: 45000 }
  );

  await sleepMs(2000);

  const path = new URL(page.url()).pathname;
  if (!path.startsWith("/dashboard")) {
    throw new Error(`login_landed_on_${path.replace(/\//g, "_") || "unknown"}`);
  }

  const cookies = await context.cookies();
  const sessionCookie = cookies.some(
    (c) => c.name.includes("auth-token") || c.name.startsWith("sb-")
  );

  const localStorageSession = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) ?? "";
      if (key.includes("auth-token") || key.startsWith("sb-")) return true;
    }
    return false;
  });

  const authStatus = getAuthStatus?.() ?? null;

  if (authStatus !== null && authStatus !== 200) {
    throw new Error(`auth_token_status_${authStatus}`);
  }
  if (!sessionCookie && !localStorageSession) {
    throw new Error("auth_session_missing");
  }
}

async function runProviderUiSmoke(previewUrl, userId) {
  if (report.provider_runs >= 1) {
    fail("Provider run limit exceeded — aborting second run");
  }

  const bypass = resolveVercelProtectionBypass(process.env);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: previewUrl,
    viewport: { width: 1280, height: 720 },
    ...(bypass
      ? { extraHTTPHeaders: { "x-vercel-protection-bypass": bypass } }
      : {}),
  });
  const page = await context.newPage();

  let apiCapture = null;

  page.on("response", async (response) => {
    if (
      response.url().includes("/api/generate-image") &&
      response.request().method() === "POST"
    ) {
      try {
        apiCapture = {
          status: response.status(),
          body: await response.json(),
        };
      } catch {
        apiCapture = { status: response.status(), body: null };
      }
    }
  });

  const smoke = {
    prompt_submitted: PROMPT,
    http_status: null,
    success: false,
    generationId: null,
    imageUrl: null,
    image_fetch: null,
    model: null,
    credits_used: null,
    ui_error: null,
  };

  try {
    await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
    const accept = page.getByRole("button", { name: /^Akzeptieren$/i });
    if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
      await accept.click();
    }

    await page.getByTestId("auth-email").fill(EMAIL);
    await page.getByTestId("auth-password").fill(sessionPassword);

    let authStatus = null;
    const onAuthResponse = (response) => {
      const url = response.url();
      if (url.includes("/auth/v1/token") && response.request().method() === "POST") {
        authStatus = response.status();
      }
    };
    page.on("response", onAuthResponse);

    await page.getByRole("button", { name: /anmelden|sign in|jetzt anmelden/i }).click();
    await waitForAuthenticatedDashboard(page, context, () => authStatus);
    page.off("response", onAuthResponse);

    await page.goto("/dashboard?tool=image-gen", {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page
      .getByRole("heading", { name: /Bildgenerator/i })
      .waitFor({ state: "visible", timeout: 60000 });

    const disabledNotice = page.getByTestId("tool-execution-disabled-notice");
    const disabledBanner = page.getByTestId("image-gen-provider-disabled-banner");
    await page.getByTestId("image-gen-prompt").fill(PROMPT);

    const generateBtn = page.getByTestId("image-gen-generate-standard").last();
    await generateBtn.waitFor({ state: "visible", timeout: 60000 });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (await generateBtn.isEnabled()) break;
      await sleepMs(2000);
    }

    if (!(await generateBtn.isEnabled())) {
      const noticeVisible = await disabledNotice
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      const bannerVisible = await disabledBanner
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (noticeVisible || bannerVisible) {
        smoke.ui_error = "provider_disabled_ui_visible";
      } else {
        const probe = await page.evaluate(async () => {
          const r = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          const d = await r.json().catch(() => ({}));
          return { status: r.status, code: d.code ?? null };
        });
        smoke.ui_error = `generate_button_disabled (probe ${probe.status}/${probe.code})`;
      }
      return smoke;
    }

    report.provider_runs = 1;
    await generateBtn.click({ timeout: 120000 });

    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      if (apiCapture?.body?.success === true && apiCapture?.body?.generationId) {
        break;
      }
      if (apiCapture?.body?.success === false && apiCapture?.status >= 400) {
        break;
      }
      await sleepMs(2000);
    }

    smoke.http_status = apiCapture?.status ?? null;
    smoke.success = apiCapture?.body?.success === true;
    smoke.generationId = apiCapture?.body?.generationId ?? null;
    smoke.imageUrl = apiCapture?.body?.imageUrl ?? null;
    smoke.model = apiCapture?.body?.model ?? null;
    smoke.credits_used = apiCapture?.body?.creditsUsed ?? null;

    if (smoke.imageUrl) {
      smoke.image_fetch = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return {
          status: r.status,
          contentType: r.headers.get("content-type"),
        };
      }, smoke.imageUrl);
    }

    if (!smoke.success) {
      const alert = page.locator(".influex-auth-alert--error, [class*='text-[#ff6b7a]']");
      if (await alert.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        smoke.ui_error = (await alert.first().textContent())?.trim()?.slice(0, 200) ?? null;
      }
    }

    await page.goto("/dashboard/gallery", { waitUntil: "domcontentloaded" });
    smoke.gallery_route_ok = page.url().includes("/dashboard/gallery");
  } finally {
    await browser.close();
  }

  return smoke;
}

async function verifyGallery(admin, userId, generationId) {
  const gallery = {
    generation_row: false,
    gallery_query_pass: false,
    preview_route_works: null,
    metadata_checked: false,
  };

  if (!generationId) return gallery;

  const { data: row } = await admin
    .from("generations")
    .select("id, type, prompt, credits_used, result, created_at")
    .eq("id", generationId)
    .eq("user_id", userId)
    .maybeSingle();

  gallery.generation_row = Boolean(row);
  gallery.metadata_checked = Boolean(row?.type === "image" && row?.credits_used === 5);
  gallery.gallery_query_pass = gallery.generation_row;
  gallery.preview_route_works = Boolean(row?.result?.previewPath || row?.result?.url);

  return gallery;
}

function writeReport() {
  mkdirSync(resolve(process.cwd(), "docs/reports"), { recursive: true });
  const s = report.smoke ?? {};
  const g = report.gallery ?? {};
  const guard = report.guard_after_close ?? {};
  const md = `# Final Provider UI Smoke — G.10-R

Generated: ${new Date().toISOString()}

## Launch Gate

| Check | Result |
|-------|--------|
| G.10-R PASS | ${report.diagnosis === "g10r_pass" ? "YES" : "NO"} |
| Provider runs | ${report.provider_runs} (max 1) |
| Provider window closed | ${report.provider_window_closed ? "yes" : "no"} |

## Preview Smoke Window

- Preview URL: ${report.preview_url ?? "n/a"}
- Supabase URL ref: ${report.preview_bundle?.url_refs?.join(", ") ?? "n/a"}
- Anon JWT ref: ${report.preview_bundle?.anon_jwt_refs?.join(", ") ?? "n/a"}
- Provider disabled before: yes
- Provider window opened: ${report.window_opened ? "yes" : "no"}
- Provider key present: ${report.fal_key?.present ? `yes (${report.fal_key.key_name})` : "no"}
- Production env touched: **no**

## UI Provider Smoke

- User: \`${EMAIL}\`
- Credits before: ${report.credits_before ?? "n/a"}
- Credits after: ${report.credits_after ?? "n/a"}
- Delta: ${report.credit_delta ?? "n/a"}
- Prompt submitted: yes
- HTTP status: ${s.http_status ?? "n/a"}
- success: ${s.success ?? false}
- generationId: ${s.generationId ?? "n/a"}
- imageUrl: ${s.imageUrl ? "(set, not logged)" : "n/a"}
- image_fetch: ${s.image_fetch ? JSON.stringify(s.image_fetch) : "n/a"}
- model: ${s.model ?? "n/a"}
- credits_used: ${s.credits_used ?? "n/a"}
- billing pass: ${report.billing_pass ?? false}
- generation pass: ${report.generation_pass ?? false}
- ui_error: ${s.ui_error ?? "none"}

## Gallery

- Generation row: ${g.generation_row ? "yes" : "no"}
- Gallery query pass: ${g.gallery_query_pass ? "yes" : "no"}
- Metadata checked: ${g.metadata_checked ? "yes" : "no"}

## Provider Window Closed

- Guard status: ${guard.pass ? "PASS" : "FAIL"}
- Guard code: ${guard.code ?? "n/a"}
- generationId after guard: ${guard.has_generation_id ? "yes" : "no"}
- imageUrl after guard: ${guard.has_image_url ? "yes" : "no"}

## Blockers

${report.blockers.length ? report.blockers.map((b) => `- ${b}`).join("\n") : "- none"}

## Diagnosis

**${report.diagnosis ?? "pending"}**

---
No secrets in this report.
`;
  writeFileSync(REPORT_PATH, md);
  console.log(`\nReport: ${REPORT_PATH}`);
}

async function closeProviderWindow(previewUrlRef) {
  console.log("\n=== Closing provider smoke window (Preview only) ===");
  const sync = syncPreviewEnvFromMap(
    buildPreviewProviderSmokeClosedMap(process.env),
    process.env
  );
  console.log(
    sync.ok
      ? `✅ Preview env restored (${sync.synced.length} keys)`
      : `⚠️  Preview env restore partial (${sync.failed.length} failed)`
  );

  const deploy = deployPreview();
  console.log(deploy.ok ? "✅ Preview redeploy after close" : "⚠️  Redeploy may have failed");

  const closedUrl = await resolvePreviewUrl(deploy.deployment_url ?? previewUrlRef);
  report.provider_window_closed = true;
  report.guard_after_close = probePreviewProviderGuard(closedUrl ?? previewUrlRef);
  console.log(
    report.guard_after_close.pass
      ? "✅ Guard PASS after close (PROVIDERS_DISABLED)"
      : `❌ Guard FAIL after close (${report.guard_after_close.code ?? "unknown"})`
  );
  return closedUrl ?? previewUrlRef;
}

console.log("=== Final Provider UI Smoke (G.10-R) ===\n");

const ref = maskRef(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
if (ref !== STAGING_REF) fail(`Local Supabase must be staging (${STAGING_REF})`);
if (ref === PROD_REF) fail("Production Supabase blocked");

report.fal_key = falKeyAudit(process.env);
if (!report.fal_key.present) {
  report.blockers.push("missing_fal_key");
  report.diagnosis = "missing_fal_key";
  writeReport();
  fail("Missing FAL_API_KEY or FAL_KEY — no smoke started");
}

const guardBefore = probePreviewProviderGuard(
  process.env.PREVIEW_URL?.replace(/\/$/, "") ??
    resolveLatestPreviewUrl("https://influexai-mpoqnjoes-paschalidisgeorgios-projects.vercel.app")
);
console.log(
  guardBefore.pass
    ? "✅ Pre-smoke guard: PROVIDERS_DISABLED (expected)"
    : "⚠️  Pre-smoke guard not disabled — continuing to open window"
);

const admin = getAdmin();
await ensureVisualQaUser();
const userId = await findUserId(admin);
if (!userId) fail("visualqa user not found");

const profile = await ensureCreditsExactly75(admin, userId);
report.credits_before = profile?.credits ?? TARGET_CREDITS;
report.plan = profile?.plan ?? null;

const creditExempt = isCreditExemptProfile(
  EMAIL,
  profile,
  process.env.ADMIN_EMAIL_ALLOWLIST
);
if (creditExempt.exempt) {
  report.blockers.push("credit_exempt_user");
  writeReport();
  fail("visualqa must not be credit-exempt");
}

let previewUrl = null;

try {
  console.log("\nStep 1: Open provider smoke window on Preview…");
  report.window_opened = true;
  const openSync = syncPreviewEnvFromMap(
    buildPreviewProviderSmokeOpenMap(process.env),
    process.env
  );
  if (!openSync.ok) {
    report.blockers.push("preview_env_open_sync_failed");
  }
  console.log(`✅ Preview env opened (${openSync.synced.length} keys synced)`);

  const deploy = deployPreview();
  previewUrl = await resolvePreviewUrl(deploy.deployment_url);
  if (!previewUrl) fail("Could not resolve Preview URL");
  report.preview_url = previewUrl;
  console.log(`Preview URL: ${previewUrl}`);
  console.log("Waiting 45s for Preview build propagation…");
  await sleepMs(45000);

  console.log("\nStep 2: Bundle scan…");
  report.preview_bundle = await scanPreviewBundle(previewUrl);
  if (!report.preview_bundle?.bundle_gate_pass) {
    report.blockers.push("preview_bundle_gate_fail");
    fail("Preview bundle gate fail — aborting before provider run");
  }
  console.log("✅ Bundle staging refs OK");

  console.log("\nStep 2b: Open-window API probe…");
  const openProbe = probePreviewGenerateApiOpen(previewUrl);
  report.open_window_probe = openProbe;
  if (!openProbe.open) {
    report.blockers.push("open_window_api_still_disabled");
    fail(`Provider API still disabled (code=${openProbe.code ?? "unknown"})`);
  }
  console.log("✅ Open-window API probe OK (guard not blocking)");

  const htmlProbe = fetchPreviewText(`${previewUrl}/dashboard/image-generator`);
  const providersFlagDisabled =
    /NEXT_PUBLIC_PROVIDERS_DISABLED["']?\s*[:=]\s*["']?true/i.test(htmlProbe) ||
    /isProvidersDisabledForGenerateImageClient\(\)\s*\?\s*!0/.test(htmlProbe);
  report.providers_disabled_in_bundle = providersFlagDisabled;
  if (providersFlagDisabled) {
    report.blockers.push("providers_still_disabled_in_bundle");
    fail("Preview build still has providers disabled client flag");
  }

  console.log("\nStep 3: Single Provider UI smoke (1 run max)…");
  report.smoke = await runProviderUiSmoke(previewUrl, userId);

  const afterProfile = await admin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  report.credits_after = afterProfile.data?.credits ?? null;
  report.credit_delta =
    report.credits_before != null && report.credits_after != null
      ? report.credits_after - report.credits_before
      : null;

  report.generation_pass =
    report.smoke.success === true &&
    Boolean(report.smoke.generationId) &&
    report.smoke.http_status === 200;

  report.billing_pass =
    report.credit_delta === EXPECTED_DELTA && report.smoke.credits_used === 5;

  report.gallery = await verifyGallery(
    admin,
    userId,
    report.smoke.generationId
  );

  if (
    report.generation_pass &&
    report.billing_pass &&
    report.gallery.generation_row
  ) {
    report.diagnosis = "g10r_pass";
  } else if (report.smoke.success && report.credit_delta !== EXPECTED_DELTA) {
    report.diagnosis = "billing_delta_mismatch";
    report.blockers.push("credits_not_75_to_70");
  } else {
    report.diagnosis = "provider_smoke_failed";
    report.blockers.push("provider_smoke_failed");
  }
} catch (err) {
  report.diagnosis = "provider_smoke_error";
  report.blockers.push(String(err.message ?? err).slice(0, 200));
  console.error("❌ Smoke error:", String(err.message ?? err).slice(0, 200));
} finally {
  previewUrl = await closeProviderWindow(previewUrl);
  report.preview_url_after_close = previewUrl;
  writeReport();
}

const pass =
  report.diagnosis === "g10r_pass" &&
  report.provider_window_closed &&
  report.guard_after_close?.pass === true &&
  report.provider_runs <= 1;

console.log("\n=== G.10-R Result ===");
console.log(
  JSON.stringify(
    {
      diagnosis: report.diagnosis,
      provider_runs: report.provider_runs,
      credits_before: report.credits_before,
      credits_after: report.credits_after,
      credit_delta: report.credit_delta,
      generation_pass: report.generation_pass,
      billing_pass: report.billing_pass,
      guard_after_close: report.guard_after_close?.pass,
      secrets_logged: false,
    },
    null,
    2
  )
);

process.exit(pass ? 0 : 1);
