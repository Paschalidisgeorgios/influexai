/** Tests 3+4 only — run after test-anthropic-functional.mjs or standalone */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

config({ path: resolve(process.cwd(), ".env.local") });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getUserId(admin) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase())?.id;
}

async function getCreditsDb(admin, uid) {
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

async function main() {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const uid = await getUserId(admin);
  await admin.from("profiles").update({ credits: 200, plan: "pro" }).eq("id", uid);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apiLog = [];

  page.on("response", async (res) => {
    const u = res.url();
    if (u.includes("/api/viral-score") || u.includes("/api/agent")) {
      let body = "";
      try {
        body = await res.text();
      } catch {}
      apiLog.push({ url: u, status: res.status(), body: body.slice(0, 5000) });
    }
  });

  await login(page);

  // ── 3 Viral Score via API (authenticated cookies) ──
  console.log("\n=== 3 VIRAL SCORE ===");
  const before3 = await getCreditsDb(admin, uid);
  console.log("Credits DB before:", before3);

  await page.goto(`${BASE}/dashboard/viral-score`);
  await page.waitForTimeout(1500);

  const script =
    "[HOOK] Stell dir vor: Du startest jeden Tag mit 10 Minuten Fokus — ohne Handy, nur Atem und ein klares Ziel. [MAIN] Drei Schritte: Hydration, Bewegung, eine Priorität. [CTA] Teste es morgen!";
  const apiRes = await page.evaluate(
    async ({ script, thumbnail, niche }) => {
      const r = await fetch("/api/viral-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, thumbnail_idea: thumbnail, niche, language: "de" }),
      });
      const text = await r.text();
      return { status: r.status, body: text };
    },
    {
      script,
      thumbnail: "Gesicht müde vs fokussiert, Text: 10-Min-Routine",
      niche: "Produktivität",
    }
  );

  console.log("API status:", apiRes.status);
  console.log("API body:", apiRes.body.slice(0, 2000));
  const after3 = await getCreditsDb(admin, uid);
  console.log("Credits DB after:", after3);

  let parsed;
  try {
    parsed = JSON.parse(apiRes.body);
  } catch {}
  if (parsed?.success && parsed?.score) {
    console.log(
      `(a) Score OK: ${parsed.score.total_score}/100 (hook=${parsed.score.hook_score})`
    );
    console.log(`(b) Credits OK: ${before3.credits} → ${after3.credits} (−${before3.credits - after3.credits})`);
  } else {
    console.log("(a)(b) FAIL — siehe API body oben");
  }

  // ── 4 KI Agent ──
  console.log("\n=== 4 KI AGENT ===");
  const before4 = await getCreditsDb(admin, uid);
  console.log("Credits DB before:", before4);

  await page.goto(`${BASE}/dashboard/agent`);
  await page.waitForTimeout(2000);

  const textarea = page.locator("textarea").first();
  await textarea.fill("Erstelle einen kompletten Short über Morgenroutinen");

  const sendBtn = page.locator('button[type="submit"], button').filter({ has: page.locator("svg") }).last();
  await sendBtn.click();

  try {
    await page.waitForSelector('span.text-\\[\\#B4FF00\\].ml-1', { timeout: 300000 });
    const doneCount = await page.locator("span.text-\\[\\#B4FF00\\].ml-1").count();
    console.log(`(a) Tool steps: ${doneCount} completed (✓ markers)`);

    await page.waitForTimeout(5000);
    const chatText = await page.locator("main").innerText();
    console.log(`(b) Result length: ${chatText.length} chars`);
    console.log("Preview:", chatText.slice(-800));

    const after4 = await getCreditsDb(admin, uid);
    console.log(`(c) Credits: ${before4.credits} → ${after4.credits} (−${before4.credits - after4.credits})`);
  } catch (e) {
    console.log("Agent error/timeout:", e.message);
    for (const entry of apiLog.filter((x) => x.url.includes("/api/agent"))) {
      console.log("Agent API:", entry.status, entry.body.slice(0, 1500));
    }
  }

  await browser.close();
}

main().catch(console.error);
