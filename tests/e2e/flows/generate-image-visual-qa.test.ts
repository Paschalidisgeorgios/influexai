import { test, expect, type Page } from "@playwright/test";
import { emailInput, passwordInput } from "../helpers/auth";

const QA_USER = {
  email: process.env.BILLING_TEST_USER_EMAIL ?? "billingtest@influexai.test",
  password: process.env.BILLING_TEST_USER_PASSWORD ?? "TestPassword123!",
};

const IMAGE_GEN_URL = /\/dashboard(\/image-generator|\?tool=image-gen)/;

async function dismissCookieBanner(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const accept = page.getByRole("button", { name: /^Akzeptieren$/i });
    if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
      await accept.click();
      await page.waitForTimeout(400);
      continue;
    }
    const dialog = page.getByRole("dialog", { name: /cookie/i });
    if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
      await dialog
        .getByRole("button", { name: /akzeptieren|accept/i })
        .click();
      await page.waitForTimeout(400);
    }
  }
}

async function loginForVisualQa(page: Page) {
  await page.goto(
    `/login?redirect=${encodeURIComponent("/dashboard/image-generator")}`
  );
  await dismissCookieBanner(page);
  await emailInput(page).fill(QA_USER.email);
  await passwordInput(page).fill(QA_USER.password);
  await dismissCookieBanner(page);
  const signIn = page.getByRole("button", {
    name: /anmelden|sign in|jetzt anmelden/i,
  });
  await Promise.all([
    page.waitForURL(IMAGE_GEN_URL, { timeout: 30000 }),
    signIn.click(),
  ]);
  await dismissCookieBanner(page);
  await expect(
    page.getByRole("heading", { name: /Bildgenerator/i })
  ).toBeVisible({ timeout: 15000 });
}

async function assertNoHorizontalScroll(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe("Generate Image visual QA (read-only, G.10-N)", () => {
  test("redirects /dashboard/image-gen to image-generator", async ({ request }) => {
    const res = await request.get("/dashboard/image-gen", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toMatch(/\/dashboard\/image-generator/);
  });

  test("desktop: SPA shell UX and provider-disabled state", async ({ page }) => {
    await loginForVisualQa(page);

    const prompt = page.getByTestId("image-gen-prompt");
    await expect(prompt).toBeVisible();
    await expect(page.getByText(/Bild & Produktvisuals/i)).toBeVisible();

    const generateBtn = page.getByRole("button", {
      name: /Bild generieren — 5 Credits/i,
    });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeDisabled();

    await prompt.fill("Staging QA — kein Submit");
    await expect(generateBtn).toBeDisabled();

    const banner = page.getByTestId("tool-execution-disabled-notice");
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toContainText(/deaktiviert/i);

    await expect(page.getByTestId("image-gen-credit-hint")).toContainText(
      /5 Credits pro Bild/i
    );
    await expect(page.getByText(/Galerie/i).first()).toBeVisible();

    await assertNoHorizontalScroll(page);
  });

  test("mobile 390px: layout without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginForVisualQa(page);

    await expect(page.getByTestId("image-gen-prompt")).toBeVisible();
    await expect(page.getByTestId("image-gen-credit-hint")).toContainText(
      /5 Credits pro Bild/i
    );

    const banner = page.getByTestId("tool-execution-disabled-notice");
    await expect(banner).toBeVisible({ timeout: 10000 });

    await assertNoHorizontalScroll(page);

    const promptBox = await page.getByTestId("image-gen-prompt").boundingBox();
    expect(promptBox?.width ?? 0).toBeGreaterThan(280);
  });

  test("gallery page loads and links to image generator", async ({ page }) => {
    await page.goto(
      `/login?redirect=${encodeURIComponent("/dashboard/gallery")}`
    );
    await dismissCookieBanner(page);
    await emailInput(page).fill(QA_USER.email);
    await passwordInput(page).fill(QA_USER.password);
    await dismissCookieBanner(page);
    await Promise.all([
      page.waitForURL(/\/dashboard\/gallery/, { timeout: 20000 }),
      page
        .getByRole("button", { name: /anmelden|sign in|jetzt anmelden/i })
        .click(),
    ]);
    const regenerate = page
      .getByRole("link", { name: /Neu generieren/i })
      .first();
    if (await regenerate.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await regenerate.getAttribute("href");
      expect(href).toMatch(/image-generator/);
    }
  });

  test("503 probe: generate-image blocked without provider call", async ({
    request,
  }) => {
    const res = await request.post("/api/generate-image", {
      data: {},
    });
    expect(res.status()).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("PROVIDERS_DISABLED");
  });
});
