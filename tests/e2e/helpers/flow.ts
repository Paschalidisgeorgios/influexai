import { expect, type APIRequestContext, type Page } from "@playwright/test";

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
  request: APIRequestContext,
  credits: number
) {
  const res = await request.post("/api/test/set-credits", {
    data: { credits },
  });
  expect(res.ok()).toBeTruthy();
}

/** Dismiss re-engagement overlay if present. */
export async function dismissOverlays(page: Page) {
  const close = page.getByRole("button", { name: /schließen|close/i });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
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
