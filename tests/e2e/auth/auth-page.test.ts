import { test, expect } from "@playwright/test";

test.describe("/auth combined page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  test("shows login mode by default", async ({ page }) => {
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("can switch to signup mode", async ({ page }) => {
    await page.getByRole("button", { name: /^registrieren$/i }).click();
    await expect(page.locator("input[type='text']")).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.locator("input[type='email']").fill("bad@example.com");
    await page.locator("input[type='password']").fill("wrongpass");
    await page.getByRole("button", { name: /^einloggen →$/i }).click();
    await expect(
      page.getByText(/falsch|falsche|ungültig|invalid/i)
    ).toBeVisible({ timeout: 8000 });
  });
});
