/**
 * Staging Stripe billing smoke user — separate from billingtest@ (G.10-I provider proof).
 * Run: npm run staging:ensure-stripe-billing-user
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const DEFAULT_EMAIL = "stripebillingtest@influexai.test";
const DEFAULT_PASSWORD = "StripeBilling123!";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.STRIPE_BILLING_TEST_EMAIL ?? DEFAULT_EMAIL;
const password = process.env.STRIPE_BILLING_TEST_PASSWORD ?? DEFAULT_PASSWORD;

function parseAllowlist() {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST?.trim();
  const defaults = [
    "paschalidisgeorgios38@gmail.com",
    "paschalidis.georgio38@gmail.com",
  ];
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : defaults;
  return [...new Set(list)];
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!url?.includes(STAGING_REF)) {
  fail(`NEXT_PUBLIC_SUPABASE_URL must point to staging (${STAGING_REF}).`);
}
if (!serviceKey) fail("Missing SUPABASE_SERVICE_ROLE_KEY");

if (parseAllowlist().includes(email.toLowerCase())) {
  fail(`${email} must NOT be in ADMIN_EMAIL_ALLOWLIST for billing smoke.`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

console.log("=== Ensure Staging Stripe Billing User ===\n");
console.log(`Email: ${email}\n`);

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );
}

let user = await findUserByEmail(email).catch(() => null);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Staging Stripe Billing Test" },
  });
  if (error) fail(`createUser: ${error.message}`);
  user = data.user;
  console.log("✅ Created auth user:", user.id);
} else {
  console.log("✅ Auth user exists:", user.id);
  await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
}

const { error: profileErr } = await admin.from("profiles").upsert(
  {
    id: user.id,
    plan: "free",
    credits: 10,
    onboarding_completed: true,
    role: "user",
    is_admin: false,
  },
  { onConflict: "id" }
);

if (profileErr) {
  console.warn(`⚠️  profiles upsert: ${profileErr.message} — trying RPC add_credits if row exists`);
}

const { data: profile } = await admin
  .from("profiles")
  .select("credits, plan")
  .eq("id", user.id)
  .maybeSingle();

if ((profile?.credits ?? 0) < 10) {
  const need = 10 - (profile?.credits ?? 0);
  const { error: rpcErr } = await admin.rpc("add_credits", {
    p_user_id: user.id,
    p_amount: need,
  });
  if (rpcErr) fail(`add_credits: ${rpcErr.message}`);
}

console.log("✅ Ready: plan=free, credits=10 (baseline for Stripe smokes)");
console.log(`\nSet in .env.local (never commit):`);
console.log(`STRIPE_BILLING_TEST_EMAIL=${email}`);
