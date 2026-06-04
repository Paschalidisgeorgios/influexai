import { expect, type Page } from "@playwright/test";

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL ?? "test@influexai.test",
  password: process.env.TEST_USER_PASSWORD ?? "TestPassword123!",
  firstName: "Test",
};

export const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL ?? "admin@influexai.test",
  password: process.env.TEST_ADMIN_PASSWORD ?? "AdminPassword123!",
};

export function emailInput(page: Page) {
  return page.getByTestId("auth-email");
}

export function passwordInput(page: Page) {
  return page.getByTestId("auth-password");
}

export function nameInput(page: Page) {
  return page.getByTestId("auth-name");
}

export async function loginAs(
  page: Page,
  user: { email: string; password: string } = TEST_USER
) {
  await page.goto("/login");
  await emailInput(page).fill(user.email);
  await passwordInput(page).fill(user.password);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByText(/dashboard/i).first()).toBeVisible();
}

export async function logout(page: Page) {
  await page.goto("/dashboard");
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.getByTestId("user-menu-trigger").click();
  await expect(page.getByTestId("auth-logout")).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/login/, { timeout: 15000 }),
    page.getByTestId("auth-logout").click(),
  ]);
}

export async function getCredits(page: Page): Promise<number> {
  const text = await page.getByTestId("credits-display").textContent();
  return parseInt(text?.replace(/\D/g, "") ?? "0", 10);
}
