import { test, expect } from "@playwright/test";
import {
  AUTH_STATE,
  waitForGeneration,
  getCreditsFromPage,
  setTestCredits,
  waitForCreditsReady,
} from "../helpers/flow";

test.use({ storageState: AUTH_STATE });

test.describe("Script Generator", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, request }) => {
    await setTestCredits(request, 100);
    await page.goto("/dashboard/script-generator");
    await waitForCreditsReady(page);
  });

  test.afterEach(async ({ request }) => {
    await setTestCredits(request, 100);
  });

  test("loads script generator page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /script generator/i })
    ).toBeVisible();
    await expect(page.getByText(/2.*credits/i)).toBeVisible();
  });

  test("shows all required inputs", async ({ page }) => {
    await expect(page.getByLabel(/thema|topic/i)).toBeVisible();
    await expect(page.getByLabel(/länge|duration|video-länge/i)).toBeVisible();
    await expect(page.getByLabel(/ton|stil/i)).toBeVisible();
    await expect(page.getByLabel(/sprache|language/i)).toBeVisible();
  });

  test("generates script successfully", async ({ page }) => {
    const creditsBefore = await getCreditsFromPage(page);

    await page
      .getByLabel(/thema|topic/i)
      .fill("Morning Routine für Produktivität");
    await page.getByLabel(/länge|duration|video-länge/i).selectOption("60 Sek");

    await page
      .getByRole("button", { name: /script generieren|generate script/i })
      .click();

    await waitForGeneration(page);
    await expect(page.getByTestId("generation-result")).not.toBeEmpty();
    await expect(page.getByText(/^HOOK$/)).toBeVisible();

    await expect
      .poll(async () => getCreditsFromPage(page), { timeout: 10000 })
      .toBeLessThanOrEqual(creditsBefore - 2);
  });

  test("shows copy button and copies to clipboard", async ({ page }) => {
    await page.getByLabel(/thema|topic/i).fill("Test Thema");
    await page
      .getByRole("button", { name: /script generieren|generate script/i })
      .click();
    await waitForGeneration(page);

    await page.getByRole("button", { name: /kopieren|copy/i }).click();
    await expect(
      page.getByRole("button", { name: /kopiert|copied/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows save button after generation", async ({ page }) => {
    await page.getByLabel(/thema|topic/i).fill("Test");
    await page
      .getByRole("button", { name: /script generieren|generate script/i })
      .click();
    await waitForGeneration(page);

    await expect(
      page.getByRole("button", { name: /speichern|save/i })
    ).toBeVisible();
  });

  test("blocks generation when no credits", async ({ page, request }) => {
    await setTestCredits(request, 0);
    await page.reload();
    await waitForCreditsReady(page);
    await expect
      .poll(async () => getCreditsFromPage(page), { timeout: 10000 })
      .toBe(0);

    await page.getByLabel(/thema|topic/i).fill("Test");
    await page
      .getByRole("button", { name: /script generieren|generate script/i })
      .click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByText(/brauchst.*2.*credits|nicht genug credits/i).first()
    ).toBeVisible();
    await expect(page.getByTestId("generation-result")).toHaveCount(0);
  });

  test("requires topic before generate", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /script generieren|generate script/i })
    ).toBeDisabled();
  });

  test("regenerate button works", async ({ page }) => {
    await page.getByLabel(/thema|topic/i).fill("Test");
    await page
      .getByRole("button", { name: /script generieren|generate script/i })
      .click();
    await waitForGeneration(page);

    await page
      .getByRole("button", { name: /neu generieren|regenerate/i })
      .click();
    await waitForGeneration(page);

    await expect(page.getByTestId("generation-result")).toBeVisible();
  });
});
