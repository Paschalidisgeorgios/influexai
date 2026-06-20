/**
 * Staging Visual QA user for Preview UI smoke — NOT in ADMIN_EMAIL_ALLOWLIST.
 *
 * Run: npm run staging:ensure-visual-qa-user
 * Alias: npm run auth:ensure-visual-qa-user
 *
 * Requires VISUAL_QA_PASSWORD in .env.local or environment (never logged).
 * Does NOT touch production. Does NOT commit secrets.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import {
  isCreditExemptProfile,
  isEmailInAdminAllowlist,
  parseAdminEmailAllowlist,
} from "./lib/credit-exempt.mjs";

const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const PROD_REF = "hszjafdelcydnppyolkm";
const EMAIL = "visualqa@influexai.test";
const TARGET_CREDITS = 75;
const TARGET_PLAN = "starter";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.VISUAL_QA_PASSWORD?.trim();

function maskRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function envSafetyAudit() {
  const ref = maskRef(url);
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const providersDisabled = (process.env.PROVIDERS_DISABLED ?? "").trim().toLowerCase();
  const allowSafeSmoke =
    process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE?.trim().toLowerCase() === "true";

  return {
    supabase_ref: ref,
    staging_ref_ok: ref === STAGING_REF,
    production_ref: ref === PROD_REF,
    providers_disabled: ["true", "1", "yes"].includes(providersDisabled),
    allow_safe_dev_provider_smoke: allowSafeSmoke,
    stripe_mode: process.env.STRIPE_MODE ?? "(unset)",
    stripe_live:
      stripeSecret.startsWith("sk_live_") || stripePub.startsWith("pk_live_"),
  };
}

const ref = maskRef(url);
if (ref === PROD_REF) {
  fail(`Production Supabase ref blocked (${PROD_REF}). Use staging (${STAGING_REF}).`);
}
if (ref !== STAGING_REF) {
  fail(`NEXT_PUBLIC_SUPABASE_URL must point to staging (${STAGING_REF}).`);
}
if (!serviceKey) fail("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
if (!password) {
  console.error("❌ Missing VISUAL_QA_PASSWORD (not logged).");
  console.error("");
  console.error("Add to .env.local (never commit), then run:");
  console.error("  npm run staging:ensure-visual-qa-user");
  console.error("");
  console.error("Or one-shot (replace with your password):");
  console.error(
    "  VISUAL_QA_PASSWORD='your-password' npm run staging:ensure-visual-qa-user"
  );
  process.exit(1);
}

const allowlist = parseAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
if (isEmailInAdminAllowlist(EMAIL, allowlist)) {
  fail(
    `${EMAIL} is in ADMIN_EMAIL_ALLOWLIST — visual QA user must NOT be credit-exempt.`
  );
}

const safety = envSafetyAudit();
if (safety.stripe_live) {
  fail("Stripe live keys detected — use test mode only.");
}
if (safety.stripe_mode !== "test") {
  fail(`STRIPE_MODE must be test (current: ${safety.stripe_mode}).`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

console.log("=== Ensure Staging Visual QA User ===\n");
console.log(`Email: ${EMAIL}`);
console.log(`Supabase ref: ${STAGING_REF}`);
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
returning id, plan, credits, is_admin, role;
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

let authCreated = false;
let user = await findUserByEmail(EMAIL).catch(() => null);

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Staging Visual QA User" },
  });
  if (error) fail(`createUser: ${error.message}`);
  user = data.user;
  authCreated = true;
  console.log("✅ Created auth user:", user.id);
} else {
  console.log("✅ Auth user exists:", user.id);
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (error) fail(`updateUserById: ${error.message}`);
  console.log("✅ Password synced, email_confirm=true");
}

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
    } else {
      console.warn("   db query did not return plan — profile may rely on auth trigger");
    }
  } catch (err) {
    console.warn(`   db query fallback skipped: ${String(err.message ?? err).slice(0, 200)}`);
  }
} else {
  console.log(`✅ Profile upsert: plan=${TARGET_PLAN}, credits=${TARGET_CREDITS}`);
}

await ensureCredits(user.id, (await readProfile(user.id))?.credits);
const profile = await readProfile(user.id);

const creditExempt = isCreditExemptProfile(
  EMAIL,
  profile,
  process.env.ADMIN_EMAIL_ALLOWLIST
);
if (creditExempt.exempt) {
  fail(
    `User is credit-exempt (${creditExempt.reason}) — visual QA must bill credits normally.`
  );
}

const result = {
  phase: "ensure-staging-visual-qa-user",
  success: true,
  user: {
    email: EMAIL,
    id: user.id,
    auth_created: authCreated,
    email_confirm: true,
    profile_present: Boolean(profile),
    plan: profile?.plan ?? TARGET_PLAN,
    credits: profile?.credits ?? TARGET_CREDITS,
    is_admin: profile?.is_admin ?? false,
    role: profile?.role ?? "user",
    credit_exempt: creditExempt.exempt,
    credit_exempt_reason: creditExempt.reason,
    in_admin_allowlist: isEmailInAdminAllowlist(EMAIL, allowlist),
  },
  safety,
  secrets_logged: false,
  login_route: "/auth/sign-in",
  other_smoke_users_modified: false,
};

console.log("\n✅ Ready for Preview UI smoke:");
console.log(`   plan=${result.user.plan}, credits=${result.user.credits}`);
console.log(`   is_admin=${result.user.is_admin}, role=${result.user.role}`);
console.log(`   credit_exempt=${result.user.credit_exempt}`);
console.log("\nMachine-readable result:");
console.log(JSON.stringify(result, null, 2));
