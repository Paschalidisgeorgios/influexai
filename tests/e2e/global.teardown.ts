import { test as teardown } from "@playwright/test";
import { deleteTestUser } from "./helpers/supabase";

teardown("cleanup test users", async () => {
  const email = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      "⏭ Skipping teardown — no TEST_USER_EMAIL or service role key"
    );
    return;
  }

  try {
    await deleteTestUser(email);
    console.log("✅ Test user cleaned up:", email);
  } catch (err) {
    console.log("Teardown:", (err as Error).message);
  }
});
