import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.test"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function findUserByEmail(email: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

export async function createTestUser(email: string, password: string) {
  const supabase = getAdminClient();
  const existing = await findUserByEmail(email);
  if (existing) {
    await resetUserCredits(email, 100);
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Test User" },
  });
  if (error) throw error;

  await supabase
    .from("profiles")
    .update({ credits: 100, onboarding_completed: true })
    .eq("id", data.user.id);

  return data.user;
}

export async function deleteTestUser(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return;
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) throw error;
}

export async function resetUserCredits(email: string, credits = 100) {
  const user = await findUserByEmail(email);
  if (!user) return;
  const supabase = getAdminClient();
  await supabase.from("profiles").update({ credits }).eq("id", user.id);
}
