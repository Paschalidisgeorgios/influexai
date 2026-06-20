/**
 * Supervised single-shot smoke: POST /api/generate-image only.
 * Does NOT commit secrets. Requires dev server + .env.local.
 *
 * Usage:
 *   node scripts/supervised-generate-image-smoke.mjs audit
 *   node scripts/supervised-generate-image-smoke.mjs baseline
 *   node scripts/supervised-generate-image-smoke.mjs guard-probe
 *   node scripts/supervised-generate-image-smoke.mjs run
 */
import { config } from "dotenv";
import { resolve, join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env.local");
const RESULT_PATH = resolve(ROOT, "scripts/supervised-smoke-result.json");
const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const PROD_REF = "hszjafdelcydnppyolkm";

config({ path: ENV_PATH });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";

function maskRef(url) {
  const m = (url ?? "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

function envAudit() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = maskRef(url);
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const falKey = process.env.FAL_KEY?.trim() || process.env.FAL_API_KEY?.trim() || "";
  const providersDisabled = (process.env.PROVIDERS_DISABLED ?? "").trim().toLowerCase();
  const disabled = ["true", "1", "yes"].includes(providersDisabled);

  const blockers = [];
  if (!existsSync(ENV_PATH)) blockers.push("missing_env_local");
  if (ref !== STAGING_REF) blockers.push("supabase_not_staging");
  if (ref === PROD_REF) blockers.push("supabase_production_ref");
  if (stripeSecret.startsWith("sk_live_")) blockers.push("stripe_live_secret");
  if (stripePub.startsWith("pk_live_")) blockers.push("stripe_live_publishable");
  if ((process.env.STRIPE_MODE ?? "").trim().toLowerCase() !== "test") {
    blockers.push("stripe_mode_not_test");
  }
  if (!falKey) blockers.push("missing_fal_key");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) blockers.push("missing_service_role");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) blockers.push("missing_anon_key");

  const safe =
    blockers.length === 0 ||
    (blockers.length === 1 && blockers[0] === "providers_disabled_for_run");

  return {
    env_local_exists: existsSync(ENV_PATH),
    supabase_ref: ref,
    staging_ref_ok: ref === STAGING_REF,
    production_ref: ref === PROD_REF,
    providers_disabled: disabled,
    stripe_mode: process.env.STRIPE_MODE ?? "(unset)",
    stripe_secret_prefix: stripeSecret ? stripeSecret.slice(0, 8) + "…" : "(unset)",
    stripe_live: stripeSecret.startsWith("sk_live_") || stripePub.startsWith("pk_live_"),
    fal_key_present: Boolean(falKey),
    fal_key_length: falKey.length,
    blockers,
    safe_to_proceed: blockers.filter((b) => b !== "providers_disabled_for_run").length === 0,
  };
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase admin env missing");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function findUser(admin) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  try {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (!error) {
      const found = data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
      if (found) return found;
    }
  } catch {
    /* fall through to sign-in probe */
  }
  const { data, error } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error) return null;
  return data.user ?? null;
}

async function baseline() {
  const admin = getAdmin();
  const user = await findUser(admin);
  if (!user) {
    return { ok: false, error: "test_user_not_found", email: EMAIL };
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("credits, plan, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  const { count: genCount } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return {
    ok: true,
    email: EMAIL,
    user_id: user.id,
    plan: profile?.plan ?? null,
    credits: profile?.credits ?? null,
    onboarding_completed: profile?.onboarding_completed ?? null,
    generations_count: genCount ?? 0,
    providers_disabled: envAudit().providers_disabled,
  };
}

async function login(page) {
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByTestId("auth-email").fill(EMAIL);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 45000 });
}

async function apiPost(page, path, body, timeoutMs = 300000) {
  return page.evaluate(
    async ({ path, body, timeoutMs }) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const r = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        const text = await r.text();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}
        return { status: r.status, json, bodyPreview: text.slice(0, 2000) };
      } catch (e) {
        return { status: 0, json: null, bodyPreview: String(e.message ?? e) };
      } finally {
        clearTimeout(t);
      }
    },
    { path, body, timeoutMs }
  );
}

async function guardProbe(page) {
  return apiPost(
    page,
    "/api/generate-image",
    { prompt: "guard probe", category: "creator" },
    15000
  );
}

async function runSmoke() {
  const audit = envAudit();
  if (!audit.safe_to_proceed) {
    console.log(JSON.stringify({ phase: "blocked", audit }, null, 2));
    process.exit(2);
  }

  const admin = getAdmin();
  const before = await baseline();
  if (!before.ok) {
    console.log(JSON.stringify({ phase: "blocked", before }, null, 2));
    process.exit(2);
  }
  if ((before.credits ?? 0) < 10) {
    console.log(
      JSON.stringify(
        { phase: "blocked", reason: "insufficient_credits", credits: before.credits },
        null,
        2
      )
    );
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await login(page);

  const payload = {
    prompt:
      "Minimal cinematic product-style test image, abstract lime-green glass cube on soft ivory background, no text, no logo",
    category: "creator",
    skipPromptEnhancement: true,
    falPrompt:
      "abstract lime-green glass cube on soft ivory background, studio lighting, minimal product style, no text, no logo, no watermark",
  };

  const t0 = Date.now();
  const res = await apiPost(page, "/api/generate-image", payload, 300000);
  const durationMs = Date.now() - t0;

  const afterProfile = await admin
    .from("profiles")
    .select("credits, plan")
    .eq("id", before.user_id)
    .single();
  const afterCredits = afterProfile.data?.credits ?? null;

  let generation = null;
  let imageFetch = null;
  const parsed = res.json;
  if (parsed?.generationId) {
    const { data } = await admin
      .from("generations")
      .select("id, type, prompt, credits_used, result, created_at")
      .eq("id", parsed.generationId)
      .maybeSingle();
    generation = data;
    if (parsed.imageUrl) {
      imageFetch = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return { status: r.status, contentType: r.headers.get("content-type") };
      }, parsed.imageUrl);
    }
  }

  const { count: genCountAfter } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", before.user_id);

  const result = {
    phase: "run",
    audit,
    test_user: { email: EMAIL, user_id: before.user_id, plan: before.plan },
    providers_disabled_before: before.providers_disabled,
    credits_before: before.credits,
    credits_after: afterCredits,
    credit_delta: before.credits != null && afterCredits != null ? afterCredits - before.credits : null,
    expected_credit_delta: -5,
    generations_count_before: before.generations_count,
    generations_count_after: genCountAfter ?? null,
    request: {
      route: "/api/generate-image",
      prompt_summary: payload.prompt.slice(0, 80),
      category: payload.category,
      skipPromptEnhancement: true,
    },
    response: {
      http_status: res.status,
      duration_ms: durationMs,
      success: parsed?.success ?? false,
      code: parsed?.code ?? null,
      error: parsed?.error ?? null,
      generationId: parsed?.generationId ?? null,
      imageUrl: parsed?.imageUrl ?? null,
      creditsUsed: parsed?.creditsUsed ?? null,
      model: parsed?.model ?? null,
      bodyPreview: res.bodyPreview,
    },
    generation_row: generation
      ? {
          id: generation.id,
          type: generation.type,
          credits_used: generation.credits_used,
          has_preview_path: Boolean(generation.result?.previewPath),
          model: generation.result?.model ?? null,
        }
      : null,
    image_fetch: imageFetch,
    pass:
      res.status === 200 &&
      parsed?.success === true &&
      parsed?.generationId &&
      afterCredits === before.credits - 5 &&
      generation?.type === "image",
  };

  writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  process.exit(result.pass ? 0 : 1);
}

const cmd = process.argv[2] ?? "audit";
if (cmd === "audit") {
  console.log(JSON.stringify(envAudit(), null, 2));
} else if (cmd === "baseline") {
  console.log(JSON.stringify(await baseline(), null, 2));
} else if (cmd === "guard-probe") {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await login(page);
  const res = await guardProbe(page);
  console.log(JSON.stringify({ guard_probe: res }, null, 2));
  await browser.close();
} else if (cmd === "run") {
  await runSmoke();
} else {
  console.error("Unknown command:", cmd);
  process.exit(1);
}
