/**
 * fal.ai functional tests — requires dev server + .env.local FAL_KEY
 * Run: node scripts/test-fal-tools.mjs
 */
import { config } from "dotenv";
import { resolve, join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env.local");
config({ path: ENV_PATH });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const falKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY;

const report = { precondition: {}, tests: [] };

function section(name, data) {
  report.tests.push({ name, ...data });
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(data, null, 2));
}

function toDataUrl(filePath) {
  const buf = readFileSync(filePath);
  const ext = filePath.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

async function falProbe() {
  const r = await fetch("https://queue.fal.run/fal-ai/flux/dev", {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "futuristic city at night, neon lights",
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
    }),
  });
  const body = await r.text();
  return { status: r.status, body: body.slice(0, 4000) };
}

async function getUserId(admin) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase())?.id;
}

async function getCredits(admin, uid) {
  const { data } = await admin.from("profiles").select("credits,plan").eq("id", uid).single();
  return data;
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.getByTestId("auth-email").fill(EMAIL);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
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
        return { status: r.status, body: text.slice(0, 8000) };
      } catch (e) {
        return { status: 0, body: String(e.message ?? e) };
      } finally {
        clearTimeout(t);
      }
    },
    { path, body, timeoutMs }
  );
}

async function main() {
  // ── 0. Vorbedingung ──
  const envExists = existsSync(ENV_PATH);
  const falSet = Boolean(falKey?.trim());
  report.precondition = {
    env_local_path: ENV_PATH,
    env_local_exists: envExists,
    FAL_KEY_set: falSet,
    FAL_KEY_length: falKey?.length ?? 0,
    dev_server: BASE,
    ANTHROPIC_set: Boolean(process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")),
  };

  console.log("=== 0. VORBEDINGUNG ===");
  console.log(JSON.stringify(report.precondition, null, 2));

  if (!envExists) {
    console.error("\nSTOP: .env.local fehlt im Projekt-Root.");
    process.exit(1);
  }
  if (!falSet) {
    console.error("\nSTOP: FAL_KEY nicht gesetzt in .env.local");
    process.exit(1);
  }

  const probe = await falProbe();
  console.log("\nfal.ai Probe (queue.fal.run/flux/dev):", probe.status);
  if (probe.status >= 400) {
    console.log("fal.ai Probe Body:", probe.body);
    report.precondition.fal_probe_fail = probe;
  } else {
    report.precondition.fal_probe_ok = probe.status;
  }

  if (!url || !serviceKey) {
    console.error("Supabase env missing");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  let uid = await getUserId(admin);
  if (!uid) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    uid = data.user.id;
  }
  await admin.from("profiles").update({ credits: 500, plan: "pro" }).eq("id", uid);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await login(page);

  // ── 1. Bild Generator ──
  {
    const before = await getCredits(admin, uid);
    const t0 = Date.now();
    const res = await apiPost(page, "/api/generate-image", {
      prompt: "futuristische Stadt bei Nacht",
      category: "creator",
      aspectRatio: "landscape_16_9",
      highRes: false,
    }, 180000);

    let parsed;
    try {
      parsed = JSON.parse(res.body);
    } catch {}

    const after = await getCredits(admin, uid);
    const checks = {
      http_status: res.status,
      api_body_preview: res.body.slice(0, 1500),
      duration_ms: Date.now() - t0,
      credits_before: before?.credits,
      credits_after: after?.credits,
    };

    if (parsed?.success && parsed?.generationId) {
      checks.a_bild = `OK — generationId=${parsed.generationId}, imageUrl=${parsed.imageUrl}`;
      checks.b_credits =
        after.credits <= before.credits - 1
          ? `OK (${before.credits} → ${after.credits}, used ${parsed.creditsUsed})`
          : `FAIL (${before.credits} → ${after.credits})`;

      const imgCheck = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return { status: r.status, type: r.headers.get("content-type") };
      }, parsed.imageUrl);
      checks.image_fetch = imgCheck;

      const { data: gens, error: genErr } = await admin
        .from("generations")
        .select("id,type,prompt,created_at")
        .eq("id", parsed.generationId)
        .maybeSingle();
      checks.c_gallery_db = genErr
        ? `DB: ${genErr.code} ${genErr.message}`
        : gens
          ? `OK in generations (${gens.type})`
          : "WARN: generations row not found";

      await page.goto(`${BASE}/dashboard/gallery`);
      await page.waitForTimeout(3000);
      const galleryHasContent = await page.locator("img, [data-testid='gallery-card']").count();
      checks.c_gallery_ui = galleryHasContent > 0 ? `OK (${galleryHasContent} media elements)` : "WARN: no visible gallery items";
    } else {
      checks.FAIL = parsed?.error ?? res.body;
      if (res.status >= 400) checks.fal_hint = "Siehe Server-Log + api_body_preview";
    }

    section("1_bild_generator", checks);
  }

  // ── 2. Produkt-Werbung ──
  {
    const productImg = toDataUrl(join(ROOT, "public/images/examples/product.jpg"));
    const before = await getCredits(admin, uid);
    const t0 = Date.now();
    console.log("\n[2] Starte Produkt-Werbung (Kling Video — kann mehrere Minuten dauern)…");

    const res = await apiPost(
      page,
      "/api/product-ad/generate",
      {
        productName: "Test Wireless Earbuds",
        productDescription: "Premium noise cancelling earbuds, sleek black design",
        imageUrl: productImg,
        audience: "Young professionals 25-35",
        platform: "tiktok",
        style: "lifestyle",
        language: "de",
        ctaText: "Jetzt shoppen",
        batch: false,
        upscale: false,
      },
      300000
    );

    let parsed;
    try {
      parsed = JSON.parse(res.body);
    } catch {}

    const after = await getCredits(admin, uid);
    const checks = {
      http_status: res.status,
      duration_ms: Date.now() - t0,
      api_body_preview: res.body.slice(0, 2000),
      credits_before: before?.credits,
      credits_after: after?.credits,
    };

    if (parsed?.success) {
      checks.a_job = `OK — generationId=${parsed.generationId}, ${parsed.generationTimeMs}ms`;
      checks.b_ergebnis = parsed.videoUrl
        ? `OK — videoUrl=${parsed.videoUrl}`
        : "FAIL: kein videoUrl";
      checks.c_credits =
        after.credits <= before.credits - 3
          ? `OK (${before.credits} → ${after.credits}, used ${parsed.creditsUsed})`
          : `FAIL (${before.credits} → ${after.credits})`;
      if (parsed.videoUrl) {
        const vid = await page.evaluate(async (u) => {
          const r = await fetch(u);
          return { status: r.status, type: r.headers.get("content-type"), size: r.headers.get("content-length") };
        }, parsed.videoUrl);
        checks.video_fetch = vid;
      }
    } else {
      checks.FAIL = parsed?.error ?? res.body;
    }

    section("2_produkt_werbung", checks);
  }

  // ── 3. Mein KI-Ich ──
  {
    const selfie = toDataUrl(join(ROOT, "public/avatars/avatar-1.jpg"));
    const before = await getCredits(admin, uid);

    // Preview (no credits)
    const previewRes = await apiPost(
      page,
      "/api/ki-ich",
      {
        imageUrl: selfie,
        scene: "professional business portrait in modern office, natural lighting",
        mode: "preview",
      },
      180000
    );
    let previewParsed;
    try {
      previewParsed = JSON.parse(previewRes.body);
    } catch {}

    const previewChecks = {
      preview_http: previewRes.status,
      preview_body: previewRes.body.slice(0, 1500),
    };

    if (previewParsed?.previewUrl || previewParsed?.generationId) {
      previewChecks.a_preview = "OK — Preview generiert";
    } else {
      previewChecks.a_preview_fail = previewParsed?.error ?? previewRes.body;
    }

    // Final (2 credits)
    const t0 = Date.now();
    const finalRes = await apiPost(
      page,
      "/api/ki-ich",
      {
        imageUrl: selfie,
        scene: "professional business portrait in modern office, natural lighting",
        mode: "final",
        generationId: previewParsed?.generationId,
      },
      300000
    );
    let finalParsed;
    try {
      finalParsed = JSON.parse(finalRes.body);
    } catch {}

    const after = await getCredits(admin, uid);
    const checks = {
      ...previewChecks,
      final_http: finalRes.status,
      final_duration_ms: Date.now() - t0,
      final_body: finalRes.body.slice(0, 1500),
      credits_before: before?.credits,
      credits_after: after?.credits,
    };

    if (finalParsed?.imageUrl || finalParsed?.finalUrl) {
      const imgUrl = finalParsed.imageUrl ?? finalParsed.finalUrl;
      checks.b_final = `OK — ${imgUrl}`;
      checks.c_credits =
        after.credits <= before.credits - 2
          ? `OK (${before.credits} → ${after.credits})`
          : `FAIL (${before.credits} → ${after.credits})`;
    } else {
      checks.FAIL = finalParsed?.error ?? finalRes.body;
    }

    section("3_ki_ich", checks);
  }

  await browser.close();
  writeFileSync(resolve(ROOT, "scripts/fal-tools-results.json"), JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
