/**
 * Staging billing smoke user — NOT in ADMIN_EMAIL_ALLOWLIST.
 * Alias: scripts/ensure-provider-billing-smoke-user.mjs (same script)
 *
 * Run: npm run staging:ensure-billing-user
 *
 * Prefer existing user billingtest@influexai.test if already provisioned via
 * ensure-staging-billing-qa-user.mjs — verify with:
 *   TEST_USER_EMAIL=billingtest@influexai.test npm run smoke:generate-image:credit-check
 */
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const DEFAULT_EMAIL = "billing-smoke@influexai.test";
const DEFAULT_PASSWORD = "BillingSmoke123!";
const TARGET_CREDITS = 75;
const TARGET_PLAN = "starter";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.TEST_BILLING_USER_EMAIL ?? DEFAULT_EMAIL;
const password = process.env.TEST_BILLING_USER_PASSWORD ?? DEFAULT_PASSWORD;

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

const allowlist = parseAllowlist();
if (allowlist.includes(email.toLowerCase())) {
  fail(
    `${email} is in ADMIN_EMAIL_ALLOWLIST — billing smoke user must NOT be credit-exempt.`
  );
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

console.log("=== Ensure Staging Billing Smoke User ===\n");
console.log(`Email: ${email}`);
console.log(`In ADMIN_EMAIL_ALLOWLIST: no\n`);

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  );
}

async function readProfile(userId) {
  const { data } = await admin
    .from("profiles")
    .select("credits, plan, is_admin, role")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function syncProfileViaDbQuery(userId) {
  const sql = `
select set_config('request.jwt.claim.role', 'service_role', true);
update public.profiles
set plan = '${TARGET_PLAN}',
    onboarding_completed = true,
    is_admin = false,
    role = 'user'
where id = '${userId}'
returning id, plan, credits;
`.trim();

  const out = execSync(
    `npx supabase db query --linked --output json ${JSON.stringify(sql)}`,
    { stdio: "pipe", encoding: "utf8" }
  );
  const parsed = JSON.parse(out);
  return parsed.rows?.[0] ?? null;
}

async function ensureCredits(userId, currentCredits) {
  const need = TARGET_CREDITS - (currentCredits ?? 0);
  if (need <= 0) return currentCredits ?? TARGET_CREDITS;

  const { data, error } = await admin.rpc("add_credits", {
    p_user_id: userId,
    p_amount: need,
  });
  if (error) {
    fail(`add_credits RPC: ${error.message}`);
  }
  return data ?? TARGET_CREDITS;
}

let user = await findUserByEmail(email).catch(() => null);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Staging Billing Smoke User" },
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

let profile = await readProfile(user.id);

const { error: profileErr } = await admin.from("profiles").upsert(
  {
    id: user.id,
    plan: TARGET_PLAN,
    credits: TARGET_CREDITS,
    onboarding_completed: true,
    role: "user",
    is_admin: false,
  },
  { onConflict: "id" }
);

if (profileErr) {
  console.warn(`⚠️  profiles upsert via client failed: ${profileErr.message}`);
  console.warn("   Trying linked supabase db query for plan/role…");
  try {
    const row = await syncProfileViaDbQuery(user.id);
    if (row?.plan) {
      console.log("✅ Profile plan set via db query:", row.plan);
      profile = row;
    } else {
      console.warn("   db query did not return plan — profile may rely on auth trigger");
    }
  } catch (err) {
    console.warn(`   db query fallback skipped: ${String(err.message ?? err).slice(0, 200)}`);
  }
} else {
  console.log(`✅ Profile upsert: plan=${TARGET_PLAN}, credits=${TARGET_CREDITS}`);
}

profile = await readProfile(user.id);
const finalCredits = await ensureCredits(user.id, profile?.credits);
profile = await readProfile(user.id);

console.log("\n✅ Ready for G.10-I billing smoke:");
console.log(`   plan=${profile?.plan ?? TARGET_PLAN}, credits=${profile?.credits ?? finalCredits}`);
console.log(`   is_admin=${profile?.is_admin ?? false}, role=${profile?.role ?? "user"}`);
console.log("\nAdd to .env.local (never commit):");
console.log(`TEST_USER_EMAIL=${email}`);
console.log(`TEST_USER_PASSWORD=<your password>`);
console.log("\nVerify (no provider):");
console.log(`  TEST_USER_EMAIL=${email} npm run smoke:generate-image:credit-check`);
