/**
 * Ensure staging billing QA user with a paid test plan (no admin bypass).
 *
 * Requirements:
 *   - Linked Supabase staging: jvjmqtxlqfqaoyjklpxh
 *   - .env.local with NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: node scripts/ensure-staging-billing-qa-user.mjs
 *
 * Does NOT touch production. Does NOT commit secrets.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const DEFAULT_EMAIL = "billingtest@influexai.test";
const DEFAULT_PASSWORD = "TestPassword123!";
const DEFAULT_PLAN = "starter";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.BILLING_TEST_USER_EMAIL ?? DEFAULT_EMAIL;
const password = process.env.BILLING_TEST_USER_PASSWORD ?? DEFAULT_PASSWORD;
const plan = process.env.BILLING_TEST_USER_PLAN ?? DEFAULT_PLAN;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!url?.includes(STAGING_REF)) {
  fail(`NEXT_PUBLIC_SUPABASE_URL must point to staging (${STAGING_REF}).`);
}

if (!serviceKey || !anonKey) {
  fail("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );
}

console.log("=== Ensure Staging Billing QA User ===\n");
console.log(`Project: ${STAGING_REF}`);
console.log(`Email:   ${email}`);
console.log(`Plan:    ${plan}\n`);

let user = await findUserByEmail(email).catch(() => null);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Staging Billing QA User" },
  });
  if (error) fail(`createUser: ${error.message}`);
  user = data.user;
  console.log("✅ Created auth user:", user.id);
} else {
  console.log("✅ Auth user exists:", user.id);
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.warn("⚠️  Could not reset password:", error.message);
  } else {
    console.log("✅ Password synced");
  }
}

const sql = `
select set_config('request.jwt.claim.role', 'service_role', true);
update public.profiles
set plan = '${plan}',
    onboarding_completed = true,
    is_admin = false,
    role = 'user'
where id = '${user.id}'
returning id, plan, credits, stripe_subscription_id;
`.trim();

try {
  const out = execSync(
    `npx supabase db query --linked --output json ${JSON.stringify(sql)}`,
    { stdio: "pipe", encoding: "utf8" }
  );
  const parsed = JSON.parse(out);
  const row = parsed.rows?.[0];
  if (!row?.plan) {
    fail("profiles update via db query did not return plan row");
  }
  console.log("✅ Profile plan set:", row.plan);
  console.log("   credits:", row.credits ?? 0);
  console.log("   stripe_subscription_id:", row.stripe_subscription_id ?? "(none)");
} catch (err) {
  fail(`profiles update via db query: ${err.message?.slice(0, 300)}`);
}

const { error: signErr } = await anon.auth.signInWithPassword({ email, password });
if (signErr) fail(`signInWithPassword: ${signErr.message}`);
console.log("✅ Sign-in OK");

console.log("\nUse for credit-pack checkout smoke only — staging test plan, no Stripe subscription.");
