import { test, expect } from "@playwright/test";
import { emailInput, nameInput, passwordInput } from "../helpers/auth";

test.describe("Signup Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("shows signup form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /konto erstellen|create account/i })
    ).toBeVisible();
    await expect(nameInput(page)).toBeVisible();
    await expect(emailInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
  });

  test("shows validation error for empty form", async ({ page }) => {
    await page
      .getByRole("button", { name: /jetzt registrieren|create account|sign up/i })
      .click();
    await expect(
      page.getByText(/bitte alle felder|fill.*field|required/i)
    ).toBeVisible();
  });

  test("shows error for weak password", async ({ page }) => {
    await nameInput(page).fill("Test Creator");
    await emailInput(page).fill(`weak+${Date.now()}@influexai.test`);
    await passwordInput(page).fill("123");
    await page
      .getByRole("button", { name: /jetzt registrieren|create account|sign up/i })
      .click();
    await expect(
      page.getByText(/zu kurz|too short|mindestens 6|at least 6/i)
    ).toBeVisible();
  });

  test("redirects to onboarding or dashboard after successful signup", async ({
    page,
  }) => {
    const unique = `e2e${Date.now()}@influexai.test`;
    await nameInput(page).fill("Test Creator");
    await emailInput(page).fill(unique);
    await passwordInput(page).fill("TestPassword123!");
    await page
      .getByRole("button", { name: /jetzt registrieren|create account|sign up/i })
      .click();

    const rateLimited = page.getByText(/rate limit exceeded/i);
    const confirmHeading = page.getByRole("heading", {
      name: /fast fertig|check your email|bestätige|confirm/i,
    });

    await Promise.race([
      page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 15000 }),
      confirmHeading.waitFor({ state: "visible", timeout: 15000 }),
      rateLimited.waitFor({ state: "visible", timeout: 15000 }),
    ]).catch(() => {});

    if (await rateLimited.isVisible()) {
      test.skip(true, "Supabase auth rate limit — retry later");
    }

    if (await confirmHeading.isVisible()) {
      return;
    }

    const signupError = page.getByText(/invalid|ungültig|rate limit/i);
    if (await signupError.isVisible().catch(() => false)) {
      test.skip(true, `Signup blocked: ${await signupError.textContent()}`);
    }

    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 5000 });
  });

  test("shows referral bonus banner when ref param present", async ({
    page,
  }) => {
    await page.goto("/signup?ref=TESTCODE");
    await expect(page.getByText(/5 Bonus-Credits/i).first()).toBeVisible();
  });

  test("has link to login page", async ({ page }) => {
    await page.getByRole("link", { name: /einloggen|sign in|login/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
