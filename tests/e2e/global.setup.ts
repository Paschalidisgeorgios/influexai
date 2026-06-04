import { test as setup } from "@playwright/test";
import path from "path";
import { createTestUser } from "./helpers/supabase";
import { emailInput, passwordInput } from "./helpers/auth";

const authFile = path.join(__dirname, ".auth/user.json");

setup("create test users and save auth state", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
  const password = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "⚠️ SUPABASE_SERVICE_ROLE_KEY missing — skipping user creation; login may fail"
    );
  } else {
    try {
      await createTestUser(email, password);
      console.log("✅ Test user ready:", email);
    } catch (err) {
      console.log("Test user setup:", (err as Error).message);
    }
  }

  await page.goto("/login");
  await emailInput(page).fill(email);
  await passwordInput(page).fill(password);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });

  await page.context().storageState({ path: authFile });
  console.log("✅ Auth state saved to", authFile);
});
