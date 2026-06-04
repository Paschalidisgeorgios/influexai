import { deleteTestUser } from "./helpers/supabase";

export default async function globalTeardown() {
  const email = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("⏭ Skipping teardown — no service role key");
    return;
  }

  try {
    await deleteTestUser(email);
    console.log("✅ Test user cleaned up:", email);
  } catch (err) {
    console.log("Teardown:", (err as Error).message);
  }
}
