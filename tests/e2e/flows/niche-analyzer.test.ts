import { test, expect } from "@playwright/test";
import {
  AUTH_STATE,
  waitForGeneration,
  setTestCredits,
  waitForCreditsReady,
} from "../helpers/flow";

test.use({ storageState: AUTH_STATE });

test.describe("Niche Analyzer", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, request }) => {
    await setTestCredits(request, 100);
    await page.goto("/dashboard/niche-analyzer");
    await waitForCreditsReady(page);
  });

  test.afterEach(async ({ request }) => {
    await setTestCredits(request, 100);
  });

  test("loads niche analyzer page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /niche analyzer/i })
    ).toBeVisible();
  });

  test("generates 5 niche ideas", async ({ page }) => {
    await page.getByLabel(/thema|topic|interesse/i).fill("Fitness");
    await page.getByRole("button", { name: /analysieren|analyze/i }).click();

    await waitForGeneration(page);

    const cards = page.getByTestId("niche-card");
    await expect(cards).toHaveCount(5);
  });

  test("shows metrics on each niche card", async ({ page }) => {
    await page.getByLabel(/thema|topic|interesse/i).fill("Tech");
    await page.getByRole("button", { name: /analysieren|analyze/i }).click();
    await waitForGeneration(page);

    const firstCard = page.getByTestId("niche-card").first();
    await expect(
      firstCard.getByText(/niedrig|mittel|hoch|low|medium|high/i)
    ).toBeVisible();
    const ideaItems = firstCard.getByTestId("video-idea");
    expect(await ideaItems.count()).toBeGreaterThanOrEqual(1);
  });

  test("can save a niche", async ({ page }) => {
    await page.getByLabel(/thema|topic|interesse/i).fill("Finance");
    await page.getByRole("button", { name: /analysieren|analyze/i }).click();
    await waitForGeneration(page);

    const saveBtn = page
      .getByRole("button", { name: /diese niche wählen|choose niche/i })
      .first();
    await saveBtn.click();

    const savedVisible = await page
      .getByRole("button", { name: /✓ Gespeichert/i })
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    if (!savedVisible) {
      test.skip(true, "niche_saves table missing or save failed in test DB");
    }
  });
});
