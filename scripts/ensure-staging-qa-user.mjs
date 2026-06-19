/**
 * Ensure staging QA test user exists for browser / e2e smoke tests.
 *
 * Requirements:
 *   - Linked Supabase project: influexai-staging (jvjmqtxlqfqaoyjklpxh)
 *   - .env.local with valid NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY
 *   - ADMIN_EMAIL_ALLOWLIST=test@influexai.test in .env.local (dashboard plan gate bypass)
 *
 * Run: node scripts/ensure-staging-qa-user.mjs
 *
 * Does NOT touch production. Does NOT commit secrets.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const DEFAULT_EMAIL = "test@influexai.test";
const DEFAULT_PASSWORD = "TestPassword123!";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.TEST_USER_EMAIL ?? DEFAULT_EMAIL;
const password = process.env.TEST_USER_PASSWORD ?? DEFAULT_PASSWORD;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!url?.includes(STAGING_REF)) {
  fail(
    `NEXT_PUBLIC_SUPABASE_URL must point to staging (${STAGING_REF}). Current: ${url ?? "missing"}`
  );
}

if (!serviceKey || !anonKey) {
  fail("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}

const allowlist = process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
if (!allowlist.toLowerCase().includes(email.toLowerCase())) {
  console.warn(
    `⚠️  Add to .env.local: ADMIN_EMAIL_ALLOWLIST=${email}\n` +
      "   (Required for dashboard access without a paid plan row in profiles.)"
  );
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

async function probeSignIn() {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) return null;
  return data.user ?? null;
}

console.log("=== Ensure Staging QA User ===\n");
console.log(`Project: ${STAGING_REF}`);
console.log(`Email:   ${email}\n`);

let user = null;
try {
  user = await findUserByEmail(email);
} catch (err) {
  console.warn("⚠️  listUsers failed, trying sign-in probe:", err.message);
  user = await probeSignIn();
}

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Staging QA User" },
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
    console.log("✅ Password synced to TEST_USER_PASSWORD");
  }
}

try {
  execSync(
    `npx supabase db query --linked --output json "update public.profiles set onboarding_completed = true where id = '${user.id}' returning onboarding_completed;"`,
    { stdio: "pipe", encoding: "utf8" }
  );
  console.log("✅ onboarding_completed = true");
} catch (err) {
  console.warn("⚠️  onboarding update via db query failed:", err.message?.slice(0, 200));
}

const { error: signErr } = await anon.auth.signInWithPassword({ email, password });
if (signErr) fail(`signInWithPassword: ${signErr.message}`);
console.log("✅ Sign-in with anon key OK");

console.log("\nNext: restart `npm run dev` if ADMIN_EMAIL_ALLOWLIST was just added.");
console.log("Then open: http://localhost:3000/dashboard/ki-agent");
