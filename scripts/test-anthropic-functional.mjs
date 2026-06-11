/**
 * Real Anthropic functional tests (dev server must be running, E2E_MOCK unset).
 * Run: node scripts/test-anthropic-functional.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const results = [];

function log(section, msg) {
  console.log(`[${section}] ${msg}`);
}

function record(name, checks) {
  results.push({ name, checks, ts: new Date().toISOString() });
}

async function findUserId(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (!user) throw new Error(`Test user ${EMAIL} not found — run playwright global setup first`);
  return user.id;
}

async function ensureTestUser(admin) {
  let uid;
  try {
    uid = await findUserId(admin);
  } catch {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Test User" },
    });
    if (error) throw error;
    uid = data.user.id;
  }
  await admin.from("profiles").update({ credits: 500, plan: "pro", onboarding_completed: true }).eq("id", uid);
  return uid;
}

function attachDiagnostics(page, label) {
  const consoleLogs = [];
  const networkErrors = [];

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      consoleLogs.push({ type, text: msg.text() });
    }
  });

  page.on("pageerror", (err) => {
    consoleLogs.push({ type: "pageerror", text: err.message, stack: err.stack });
  });

  page.on("response", async (res) => {
    const u = res.url();
    if (!u.includes("/api/") && !u.includes("_next")) return;
    const status = res.status();
    if (status >= 400) {
      let body = "";
      try {
        body = await res.text();
      } catch {
        body = "(body unreadable)";
      }
      networkErrors.push({ url: u, status, body: body.slice(0, 4000) });
    }
  });

  return {
    label,
    dump() {
      return { consoleLogs, networkErrors };
    },
  };
}

async function getCredits(page) {
  const el = page.getByTestId("credits-display");
  await el.waitFor({ state: "visible", timeout: 20000 });
  const text = await el.textContent();
  return parseInt(text?.replace(/\D/g, "") ?? "0", 10);
}

async function dismissOverlays(page) {
  const close = page.getByRole("button", { name: /schließen|close/i }).first();
  if (await close.isVisible({ timeout: 1500 }).catch(() => false)) {
    await close.click();
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.getByTestId("auth-email").fill(EMAIL);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await dismissOverlays(page);
}

async function main() {
  if (!url || !serviceKey) {
    console.error("Missing SUPABASE env");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")) {
    console.error("ANTHROPIC_API_KEY missing");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const userId = await ensureTestUser(admin);
  log("setup", `User ${EMAIL} ready (pro, 500 credits)`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const diag = attachDiagnostics(page, "global");

  await login(page);
  let creditsStart = await getCredits(page);
  log("setup", `Credits after login: ${creditsStart}`);

  // ── 1. Script Generator ──
  {
    const topic = "Morgenroutine für mehr Fokus";
    const checks = {};
    const creditsBefore = await getCredits(page);
    await page.goto(`${BASE}/dashboard/script-generator`);
    await dismissOverlays(page);
    await getCredits(page);

    await page.getByLabel(/thema|topic/i).fill(topic);
    await page.getByLabel(/länge|duration|video-länge/i).selectOption("60 Sek").catch(() => {});
    await page.getByRole("button", { name: /script generieren|generate script/i }).click();

    try {
      await page.getByTestId("generation-result").waitFor({ timeout: 120000 });
      const scriptText = await page.getByTestId("generation-result").innerText();
      checks.a_sinnvolles_ergebnis =
        scriptText.length > 80 && /hook|main|cta|\[HOOK\]/i.test(scriptText)
          ? `OK (${scriptText.length} Zeichen, Struktur erkannt)`
          : `FAIL: zu kurz/leer — ${scriptText.slice(0, 200)}`;

      await page.waitForTimeout(2000);
      const creditsAfterGen = await getCredits(page);
      checks.b_credits =
        creditsAfterGen <= creditsBefore - 2
          ? `OK (${creditsBefore} → ${creditsAfterGen}, −${creditsBefore - creditsAfterGen})`
          : `FAIL: erwartet −2, war ${creditsBefore} → ${creditsAfterGen}`;

      await page.getByRole("button", { name: /speichern|save/i }).click();
      await page.waitForTimeout(2000);
      const { data: saved, error: saveErr } = await admin
        .from("saved_scripts")
        .select("id, topic, created_at")
        .eq("user_id", userId)
        .eq("topic", topic)
        .order("created_at", { ascending: false })
        .limit(1);
      checks.c_saved_scripts = saveErr
        ? `FAIL DB: ${saveErr.code} ${saveErr.message}`
        : saved?.length
          ? `OK (id=${saved[0].id})`
          : "FAIL: kein Eintrag in saved_scripts nach Speichern";
    } catch (e) {
      checks.error = String(e.message ?? e);
      const errText = await page.locator("text=/fehlgeschlagen|error|nicht verfügbar/i").first().textContent().catch(() => "");
      if (errText) checks.ui_error = errText;
    }

    const d = diag.dump();
    if (d.networkErrors.length) checks.network = d.networkErrors;
    if (d.consoleLogs.length) checks.browser_console = d.consoleLogs;
    record("1_script_generator", checks);
    log("1", JSON.stringify(checks, null, 2));
  }

  // ── 2. Niche Analyzer ──
  {
    const topic = "KI-Tools für Anfänger";
    const checks = {};
    const creditsBefore = await getCredits(page);
    await page.goto(`${BASE}/dashboard/niche-analyzer`);
    await dismissOverlays(page);
    await getCredits(page);

    await page.getByLabel(/thema|topic|interesse/i).fill(topic);
    await page.getByRole("button", { name: /analysieren|analyze/i }).click();

    try {
      await page.getByTestId("generation-result").waitFor({ timeout: 120000 });
      const cards = page.getByTestId("niche-card");
      const count = await cards.count();
      const firstTitle = count > 0 ? await cards.first().innerText() : "";
      checks.a_analyse =
        count >= 1 && firstTitle.length > 20
          ? `OK (${count} Nischen, erste: ${firstTitle.slice(0, 80)}…)`
          : `FAIL: ${count} Karten, Text: ${firstTitle.slice(0, 120)}`;

      await page.waitForTimeout(2000);
      const creditsAfter = await getCredits(page);
      checks.b_credits =
        creditsAfter <= creditsBefore - 2
          ? `OK (${creditsBefore} → ${creditsAfter})`
          : `FAIL: ${creditsBefore} → ${creditsAfter}`;

      await page.getByRole("button", { name: /diese niche wählen|choose niche/i }).first().click();
      await page.waitForTimeout(3000);
      const { data: nicheSaves, error: nicheErr } = await admin
        .from("niche_saves")
        .select("id, created_at, niche_data")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
      checks.c_niche_saves = nicheErr
        ? `FAIL DB: ${nicheErr.code} ${nicheErr.message}`
        : nicheSaves?.length
          ? `OK (id=${nicheSaves[0].id}, title=${nicheSaves[0].niche_data?.title ?? "?"})`
          : "FAIL: kein Eintrag in niche_saves";
    } catch (e) {
      checks.error = String(e.message ?? e);
    }

    const d = diag.dump();
    if (d.networkErrors.length) checks.network = d.networkErrors;
    if (d.consoleLogs.length) checks.browser_console = d.consoleLogs;
    record("2_niche_analyzer", checks);
    log("2", JSON.stringify(checks, null, 2));
  }

  // ── 3. Viral Score ──
  {
    const checks = {};
    const creditsBefore = await getCredits(page);
    const script =
      "[HOOK] Stell dir vor: Du startest jeden Tag mit 10 Minuten Fokus — ohne Handy, nur Atem und ein klares Ziel. [MAIN] In dieser Morgenroutine zeige ich dir drei Schritte: Hydration, Bewegung und die eine Sache, die deinen Tag definiert. [CTA] Speichere das Video und teste es morgen früh!";
    const thumbnail = "Split-Screen: müde vs. fokussiert, Text: 10-Min-Fokus-Routine";
    const niche = "Produktivität & Mindset";

    await page.goto(`${BASE}/dashboard/viral-score`);
    await dismissOverlays(page);
    await getCredits(page);

    const textareas = page.locator("textarea");
    await textareas.first().fill(script);
    await page.getByPlaceholder(/Schock-Emoji|Thumbnail/i).fill(thumbnail);
    await page.getByPlaceholder(/Fitness, Tech/i).fill(niche);
    await page.getByRole("button", { name: /Viral Score berechnen/i }).click();

    try {
      await page.waitForSelector(".viral-score-results-top, text=/Stärken|strengths/i", {
        timeout: 120000,
      });
      const scoreText = await page.locator("span").filter({ hasText: /^\d{1,3}$/ }).first().textContent().catch(() => "0");
      const scoreNum = parseInt(scoreText ?? "0", 10);
      checks.a_score =
        scoreNum >= 0 && scoreNum <= 100
          ? `OK (Score ${scoreNum}/100)`
          : `FAIL: Score=${scoreText}`;

      await page.waitForTimeout(2000);
      const creditsAfter = await getCredits(page);
      checks.b_credits =
        creditsAfter <= creditsBefore - 2
          ? `OK (${creditsBefore} → ${creditsAfter})`
          : `FAIL: ${creditsBefore} → ${creditsAfter}`;

      const apiRes = diag.dump().networkErrors.filter((n) => n.url.includes("/api/viral-score"));
      if (apiRes.length) checks.api_error = apiRes;
    } catch (e) {
      checks.error = String(e.message ?? e);
      const errP = await page.locator("p").filter({ hasText: /fehlgeschlagen|Credits|Analyse/i }).first().textContent().catch(() => "");
      if (errP) checks.ui_error = errP;
      const apiRes = diag.dump().networkErrors.filter((n) => n.url.includes("/api/viral-score"));
      if (apiRes.length) checks.api_error = apiRes;
    }

    record("3_viral_score", checks);
    log("3", JSON.stringify(checks, null, 2));
  }

  // ── 4. KI Agent ──
  {
    const checks = {};
    const creditsBefore = await getCredits(page);
    const prompt = "Erstelle einen kompletten Short über Morgenroutinen";

    await page.goto(`${BASE}/dashboard/agent`);
    await dismissOverlays(page);
    await getCredits(page);

    const input = page.getByPlaceholder(/Befehl|Agent|Master|prompt/i);
    await input.fill(prompt);
    await page.locator("button").filter({ has: page.locator("svg") }).last().click();

    try {
      await page.getByText(/Nische|Script|Viral|Thumbnail/i).first().waitFor({ timeout: 15000 });
      await page.waitForFunction(
        () => {
          const done = document.querySelectorAll("span.text-\\[\\#B4FF00\\].ml-1");
          return done.length >= 1;
        },
        { timeout: 300000 }
      ).catch(async () => {
        const running = await page.locator(".animate-pulse").count();
        checks.timeline_note = `Timeout — ${running} running indicators`;
      });

      const doneChecks = await page.locator("span.text-\\[\\#B4FF00\\].ml-1").count();
      checks.a_tool_steps = doneChecks >= 1 ? `OK (${doneChecks} Schritte ✓)` : "FAIL: keine abgeschlossenen Tool-Schritte";

      const msgBlocks = await page.locator("p, div").allInnerTexts();
      const combined = msgBlocks.join("\n").slice(-3000);
      checks.b_ergebnis =
        combined.length > 100
          ? `OK (${combined.length} Zeichen Antwort)`
          : `FAIL: Antwort zu kurz — ${combined.slice(0, 300)}`;

      await page.waitForTimeout(3000);
      const creditsAfter = await getCredits(page);
      checks.c_credits =
        creditsAfter < creditsBefore
          ? `OK (${creditsBefore} → ${creditsAfter}, −${creditsBefore - creditsAfter})`
          : `FAIL: keine Credit-Reduktion ${creditsBefore} → ${creditsAfter}`;

      const apiErr = diag.dump().networkErrors.filter((n) => n.url.includes("/api/agent"));
      if (apiErr.length) checks.api_error = apiErr;
    } catch (e) {
      checks.error = String(e.message ?? e);
      const apiErr = diag.dump().networkErrors.filter((n) => n.url.includes("/api/agent"));
      if (apiErr.length) checks.api_error = apiErr;
    }

    record("4_ki_agent", checks);
    log("4", JSON.stringify(checks, null, 2));
  }

  await browser.close();

  writeFileSync(
    resolve(process.cwd(), "scripts/anthropic-functional-results.json"),
    JSON.stringify(results, null, 2)
  );

  const failed = results.filter((r) =>
    Object.values(r.checks).some((v) => typeof v === "string" && v.startsWith("FAIL"))
  );
  console.log("\n=== SUMMARY ===");
  console.log(`${results.length} tools tested, ${failed.length} with FAIL checks`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
