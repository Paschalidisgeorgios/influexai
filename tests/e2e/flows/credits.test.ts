import { test, expect } from "@playwright/test";
import { AUTH_STATE, setTestCredits } from "../helpers/flow";

test.use({ storageState: AUTH_STATE });

test.describe("Credits Page", () => {
  test.beforeEach(async ({ page, request }) => {
    await setTestCredits(request, 100);
    await page.goto("/dashboard/credits");
  });

  test("shows current credit balance", async ({ page }) => {
    const balance = page.getByTestId("credits-balance");
    await expect(balance).toBeVisible();
    await expect(balance).toContainText(/\d+/, { timeout: 10000 });
    const text = await balance.textContent();
    const value = parseInt(text?.replace(/[^\d]/g, "") ?? "0", 10);
    expect(value).toBeGreaterThan(0);
  });

  test("shows 4 pricing tiers", async ({ page }) => {
    await expect(page.getByTestId("pricing-card")).toHaveCount(4);
  });

  test("marks recommended pack", async ({ page }) => {
    const popularCard = page.getByTestId("pricing-card").filter({ hasText: /Empfohlen/i });
    await expect(popularCard).toBeVisible();
  });

  test("clicking buy calls Stripe checkout API", async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/credits/checkout") &&
          resp.request().method() === "POST",
        { timeout: 15000 }
      ),
      page
        .getByTestId("pricing-card")
        .first()
        .getByRole("button", { name: /jetzt kaufen|kaufen|buy/i })
        .click(),
    ]);
    expect(response.status()).toBe(200);
  });

  test("shows credit usage examples", async ({ page }) => {
    const examples = page.getByTestId("credit-usage-examples");
    await expect(examples).toBeVisible();
    await expect(examples.getByText(/Viral Hooks/i)).toBeVisible();
  });
});
