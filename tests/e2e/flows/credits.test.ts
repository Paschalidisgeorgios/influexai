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

  test("shows 3 pricing tiers", async ({ page }) => {
    await expect(page.getByTestId("pricing-card")).toHaveCount(3);
  });

  test("marks Creator plan as most popular", async ({ page }) => {
    const creatorCard = page.getByTestId("pricing-card").nth(1);
    await expect(
      creatorCard.getByText(/most popular|beliebtesten|empfohlen/i)
    ).toBeVisible();
  });

  test("clicking buy calls Stripe checkout API", async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/stripe/checkout") &&
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

  test("shows credit calculator", async ({ page }) => {
    const slider = page.getByTestId("credit-calculator-slider");
    await expect(slider).toBeVisible();

    await slider.evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = "1";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect(
      page
        .locator("li")
        .filter({ hasText: /scripts/i })
        .getByText("60")
    ).toBeVisible();
  });
});
