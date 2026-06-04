import { test, expect } from "@playwright/test";
import { loginAs, logout } from "../helpers/auth";

test.describe("Logout Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("logs out from dashboard and clears session", async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);

    await page.getByTestId("user-menu-trigger").click();
    await expect(page.getByTestId("auth-logout")).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/login/, { timeout: 15000 }),
      page.getByTestId("auth-logout").click(),
    ]);

    await page.goto("/dashboard", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("logout helper ends on public page", async ({ page }) => {
    await logout(page);
    await expect(page).not.toHaveURL(/dashboard/);
  });
});
