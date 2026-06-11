import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { resetUserCredits } from "./supabase";

export const AUTH_STATE = "tests/e2e/.auth/user.json";

export async function waitForGeneration(page: Page) {
  await expect(page.getByTestId("generation-result")).toBeVisible({
    timeout: 30000,
  });
}

export async function getCreditsFromPage(page: Page): Promise<number> {
  const text = await page.getByTestId("credits-display").textContent();
  return parseInt(text?.replace(/\D/g, "") ?? "0", 10);
}

export async function expectCreditsDeducted(
  page: Page,
  before: number,
  cost: number
) {
  const after = await getCreditsFromPage(page);
  expect(after).toBe(before - cost);
}

export async function selectOption(page: Page, label: string, value: string) {
  await page.getByLabel(label).selectOption(value);
}

export async function setTestCredits(
  _request: APIRequestContext,
  credits: number
) {
  const email = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
  await resetUserCredits(email, credits);
}

/** Dismiss re-engagement overlay if present. */
export async function dismissOverlays(page: Page) {
  const close = page.getByRole("button", { name: /schließen|close/i }).first();
  if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
    await close.click();
    await page.waitForTimeout(300);
  }
}

/** Waits until the dashboard header and flow hooks have loaded credit balance. */
export async function waitForCreditsReady(page: Page) {
  await dismissOverlays(page);
  await expect(page.getByTestId("credits-display")).toContainText(/\d+/, {
    timeout: 15000,
  });
  await page.waitForTimeout(400);
}
