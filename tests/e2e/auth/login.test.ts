import { test, expect } from "@playwright/test";
import { TEST_USER, emailInput, passwordInput } from "../helpers/auth";

test.describe("Login Flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows login form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /willkommen|welcome back/i })
    ).toBeVisible();
    await expect(emailInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await emailInput(page).fill("wrong@email.com");
    await passwordInput(page).fill("wrongpassword");
    await page.getByRole("button", { name: /anmelden|sign in/i }).click();
    await expect(
      page.getByText(/falsch|falsche|ungültig|invalid|incorrect/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test("redirects to dashboard after successful login", async ({ page }) => {
    await emailInput(page).fill(TEST_USER.email);
    await passwordInput(page).fill(TEST_USER.password);
    await page.getByRole("button", { name: /anmelden|sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("redirects to login when accessing protected route", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/dashboard", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await context.close();
  });

  test("has link to signup page", async ({ page }) => {
    await page
      .getByRole("link", { name: /registrieren|sign up|jetzt registrieren/i })
      .click();
    await expect(page).toHaveURL(/signup/);
  });
});
