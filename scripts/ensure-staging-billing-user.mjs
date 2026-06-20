/**
 * Staging billing smoke user — NOT in ADMIN_EMAIL_ALLOWLIST.
 * Run: node scripts/ensure-staging-billing-user.mjs
 *
 * Use TEST_BILLING_USER_EMAIL / TEST_BILLING_USER_PASSWORD in .env.local for
 * npm run smoke:generate-image:run-safe (with env vars pointedted to that user).
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const DEFAULT_EMAIL = "billing-smoke@influexai.test";
const DEFAULT_PASSWORD = "BillingSmoke123!";

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

const { error: profileErr } = await admin.from("profiles").upsert(
  {
    id: user.id,
    plan: "starter",
    credits: 75,
    onboarding_completed: true,
    role: "user",
    is_admin: false,
  },
  { onConflict: "id" }
);

if (profileErr) {
  fail(`profiles upsert: ${profileErr.message}`);
}

console.log("✅ Profile: plan=starter, credits=75, is_admin=false, role=user");
console.log("\nAdd to .env.local (never commit):");
console.log(`TEST_BILLING_USER_EMAIL=${email}`);
console.log(`TEST_BILLING_USER_PASSWORD=<your password>`);
console.log(
  "\nFor billing smoke, set TEST_USER_EMAIL to this address or pass env when running run-safe."
);
