/**
 * Credits & payments functional test
 * Run: node scripts/test-credits-payments.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

config({ path: resolve(process.cwd(), ".env.local") });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const report = { block12_audit: {}, tests: [] };

async function getProfile(admin) {
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = users.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (!user) throw new Error(`User ${EMAIL} not found`);
  const { data: profile } = await admin
    .from("profiles")
    .select("credits, plan")
    .eq("id", user.id)
    .single();
  return { userId: user.id, ...profile };
}

async function setCredits(admin, userId, credits) {
  const { error } = await admin.from("profiles").update({ credits }).eq("id", userId);
  if (error) throw error;
}

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.getByTestId("auth-email").fill(EMAIL);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

async function clearCreditUiState(page) {
  await page.evaluate(() => {
    sessionStorage.removeItem("influexai_credits_banner_dismissed");
    sessionStorage.removeItem("influexai_buy_credits_low_shown");
  });
}

async function main() {
  if (!url || !serviceKey) throw new Error("Supabase env missing");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { userId, credits: currentCredits } = await getProfile(admin);

  // ── 1. Block 1+2 Abzugs-Audit (aus Test-Protokoll) ──
  const block12 = {
    current_credits_in_db: currentCredits,
    operations: [
      { block: 1, tool: "Script Generator", expected: 2, actual: 2, note: "generateScript OK" },
      { block: 1, tool: "Niche Analyzer", expected: 2, actual: 2, note: "analyzeNiche OK" },
      { block: 1, tool: "Viral Score", expected: 2, actual: 2, note: "200→198" },
      { block: 1, tool: "KI Agent", expected: "~11 (Schätzung)", actual: 10, note: "198→188, 5 Tools" },
      { block: 2, tool: "Bild Generator", expected: 1, actual: 1, note: "500→499 trotz DB-Fehler" },
      { block: 2, tool: "Produkt-Werbung", expected: 3, actual: 0, note: "Abbruch vor deductCredits" },
      { block: 2, tool: "KI-Ich", expected: "0 preview / 2 final", actual: 0, note: "Preview+Final fehlgeschlagen (DB)" },
    ],
    expected_total_deducted: 17,
    actual_total_deducted: 2 + 2 + 2 + 10 + 1 + 0 + 0,
    matches_defined_costs:
      "Teilweise — Agent −10 statt ~11 Schätzung; Produkt/KI-Ich 0 wegen generations-Tabelle; Bild −1 obwohl 500-Fehler",
  };
  report.block12_audit = block12;
  console.log("=== 1. BLOCK 1+2 CREDIT-AUDIT ===");
  console.log(JSON.stringify(block12, null, 2));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);

  // ── 2. Low credit warning (8 credits) ──
  await setCredits(admin, userId, 8);
  await page.reload();
  await clearCreditUiState(page);
  await page.reload();
  await page.waitForTimeout(2000);

  const banner = page.getByTestId("credits-warning-banner");
  const bannerVisible = await banner.isVisible().catch(() => false);
  const bannerVariant = bannerVisible ? await banner.getAttribute("data-variant") : null;
  const bannerText = bannerVisible ? await banner.innerText() : null;

  report.tests.push({
    name: "2_low_credit_banner",
    credits_set: 8,
    banner_visible: bannerVisible,
    banner_variant: bannerVariant,
    banner_text: bannerText,
    expected: "Banner bei credits < 20 (data-variant=low)",
    pass: bannerVisible && bannerVariant === "low",
    note: "Styling ist rot (#ef4444), nicht amber — low-Tier ab 5–19 Credits",
  });
  console.log("\n=== 2. LOW CREDIT (8) ===");
  console.log(JSON.stringify(report.tests.at(-1), null, 2));

  // Low-credits modal may also open once (sessionStorage gate)
  const buyModalLow = page.locator('[class*="max-w-4xl"]').filter({ hasText: /Credits|credit/i });
  const modalAt8 = await buyModalLow.first().isVisible().catch(() => false);

  // ── 3. Zero credits modal ──
  await setCredits(admin, userId, 0);
  await page.reload();
  await page.waitForTimeout(2500);

  const forceHint = page.getByText(/Lade Credits auf|top up|aufladen/i);
  const modalAt0 = await buyModalLow.first().isVisible().catch(() => false);
  const forceHintVisible = await forceHint.first().isVisible().catch(() => false);
  const closeBtn = page.getByRole("button", { name: /schließen|close|×/i }).first();
  const canDismiss = await closeBtn.isVisible().catch(() => false);

  let checkoutResult = null;
  page.on("request", (req) => {
    if (req.url().includes("checkout.stripe.com")) {
      checkoutResult = { navigated: true, url: req.url() };
    }
  });

  // Intercept checkout API to capture Stripe URL without paying
  const checkoutApi = await page.evaluate(async () => {
    const res = await fetch("/api/credits/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: "small" }),
    });
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 2000) };
  });

  let stripeUrl = null;
  try {
    const parsed = JSON.parse(checkoutApi.body);
    stripeUrl = parsed.url ?? null;
  } catch {}

  const isTestMode =
    stripeUrl?.includes("checkout.stripe.com") &&
    (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_"));

  report.tests.push({
    name: "3_zero_credits_modal",
    credits_set: 0,
    modal_visible: modalAt0,
    force_open_hint_visible: forceHintVisible,
    modal_dismiss_blocked: modalAt0 && !canDismiss,
    checkout_api_status: checkoutApi.status,
    checkout_api_body: checkoutApi.body,
    stripe_checkout_url: stripeUrl,
    stripe_test_mode: isTestMode,
    pass: modalAt0 && checkoutApi.status === 200 && !!stripeUrl,
  });
  console.log("\n=== 3. ZERO CREDITS (0) ===");
  console.log(JSON.stringify(report.tests.at(-1), null, 2));

  // Click first package button if modal open (should trigger checkout URL in real browser)
  if (modalAt0) {
    const pkgBtn = page.getByTestId("pricing-card").first();
    if (await pkgBtn.isVisible().catch(() => false)) {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/credits/checkout"), { timeout: 15000 }).catch(() => null),
        pkgBtn.click(),
      ]);
      if (response) {
        const body = await response.json().catch(() => ({}));
        report.tests.at(-1).ui_checkout_click = {
          status: response.status(),
          url: body.url?.slice(0, 120),
        };
      }
    }
  }

  // ── 4. Restore 62 credits ──
  await setCredits(admin, userId, 62);
  const restored = await getProfile(admin);
  report.restore = { credits: restored.credits, email: EMAIL };
  console.log("\n=== 4. RESTORE ===");
  console.log(JSON.stringify(report.restore, null, 2));

  await browser.close();
  writeFileSync(resolve(process.cwd(), "scripts/credits-payments-results.json"), JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
