import { test, expect } from "@playwright/test";
import { AUTH_STATE, setTestCredits } from "../helpers/flow";

test.use({ storageState: AUTH_STATE });

test.describe("Main Dashboard", () => {
  test.beforeEach(async ({ page, request }) => {
    await setTestCredits(request, 100);
    await page.goto("/dashboard");
  });

  test.afterEach(async ({ request }) => {
    await setTestCredits(request, 100);
  });

  test("shows personalized greeting", async ({ page }) => {
    await expect(
      page.getByText(
        /guten|good (morning|afternoon|evening|night)|günaydın|buenos|bonjour|καλη/i
      )
    ).toBeVisible();
  });

  test("shows credits display", async ({ page }) => {
    await expect(page.getByTestId("credits-display")).toBeVisible();
  });

  test("shows all flow cards", async ({ page }) => {
    const flows = [
      /script generator/i,
      /niche analyzer/i,
      /outlier detector/i,
      /thumbnail/i,
    ];
    for (const flow of flows) {
      await expect(page.getByText(flow).first()).toBeVisible();
    }
  });

  test("flow cards navigate to correct routes", async ({ page }) => {
    await page
      .getByText(/script generator/i)
      .first()
      .click();
    await expect(page).toHaveURL(/script-generator/);
  });

  test("mobile bottom nav visible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("mobile-bottom-nav")).toBeVisible();
  });

  test("shows low credits warning when credits < 10", async ({
    page,
    request,
  }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem("influexai_credits_banner_dismissed");
    });
    await setTestCredits(request, 5);
    await page.reload();
    await expect(page.getByTestId("credits-warning-banner")).toBeVisible({
      timeout: 15000,
    });
  });
});
