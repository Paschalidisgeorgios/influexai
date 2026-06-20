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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

async function findUserIdViaProfile(targetEmail) {
  const normalized = targetEmail.toLowerCase();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", normalized)
    .maybeSingle();
  if (error || !data?.id) return null;
  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
    data.id
  );
  if (userErr || !userData?.user) return null;
  return userData.user;
}

async function findUserByEmail(targetEmail) {
  const normalized = targetEmail.toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === normalized
    );
    if (found) return found;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

function isDuplicateUserError(error) {
  const msg = (error?.message ?? "").toLowerCase();
  return (
    msg.includes("already been registered") ||
    msg.includes("already exists") ||
    msg.includes("duplicate")
  );
}

async function probeSignIn(targetEmail) {
  if (!anonKey) return null;
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({
    email: targetEmail,
    password,
  });
  if (error || !data.user) return null;
  return data.user;
}

async function verifyAnonSignIn(contextLabel) {
  if (!anonKey) fail(`Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for verification (${contextLabel})`);
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password,
  });
  if (error || !data.user) {
    fail(
      `Anon sign-in verification failed (${contextLabel}): ${error?.code ?? error?.message ?? "unknown"}`
    );
  }
  console.log(`✅ Anon sign-in verified (${contextLabel})`);
}

async function resolveAuthUser() {
  let user =
    (await findUserByEmail(EMAIL).catch((err) => {
      console.warn(
        `⚠️  listUsers lookup failed: ${String(err.message ?? err).slice(0, 120)}`
      );
      return null;
    })) ??
    (await findUserIdViaProfile(EMAIL)) ??
    (await probeSignIn(EMAIL));

  if (user) {
    console.log("✅ Auth user exists:", user.id);
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) fail(`updateUserById: ${error.message}`);
    console.log("✅ Password synced, email_confirm=true");
    await verifyAnonSignIn("after updateUserById");
    return { user, authCreated: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Staging Visual QA User" },
  });

  if (error) {
    if (isDuplicateUserError(error)) {
      user =
        (await findUserByEmail(EMAIL).catch(() => null)) ??
        (await findUserIdViaProfile(EMAIL)) ??
        (await probeSignIn(EMAIL));
      if (!user) {
        fail(
          `User ${EMAIL} exists but could not be resolved after createUser duplicate`
        );
      }
      console.log("✅ Auth user exists (recovered after duplicate):", user.id);
      const { error: updateErr } = await admin.auth.admin.updateUserById(
        user.id,
        { password, email_confirm: true }
      );
      if (updateErr) fail(`updateUserById: ${updateErr.message}`);
      console.log("✅ Password synced, email_confirm=true");
      await verifyAnonSignIn("after duplicate recovery");
      return { user, authCreated: false };
    }
    fail(`createUser: ${error.message}`);
  }

  console.log("✅ Created auth user:", data.user.id);
  await verifyAnonSignIn("after createUser");
  return { user: data.user, authCreated: true };
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

async function ensureProfileFields(userId) {
  let profile = await readProfile(userId);
  const needsPlanFix =
    profile?.plan !== TARGET_PLAN ||
    profile?.role !== "user" ||
    profile?.is_admin === true;

  if (!needsPlanFix) return profile;

  const { error } = await admin
    .from("profiles")
    .update({
      plan: TARGET_PLAN,
      onboarding_completed: true,
      role: "user",
      is_admin: false,
    })
    .eq("id", userId);

  if (error) {
    console.warn(`⚠️  profiles update failed: ${error.message}`);
    try {
      await syncProfileViaDbQuery(userId);
    } catch (err) {
      console.warn(
        `   db query fallback skipped: ${String(err.message ?? err).slice(0, 200)}`
      );
    }
  } else {
    console.log(`✅ Profile plan enforced: ${TARGET_PLAN}`);
  }

  profile = await readProfile(userId);
  if (profile?.plan !== TARGET_PLAN) {
    fail(`Profile plan must be ${TARGET_PLAN} (current: ${profile?.plan ?? "null"})`);
  }
  return profile;
}

async function main() {
  const { user, authCreated } = await resolveAuthUser();

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: EMAIL,
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
  const profile = await ensureProfileFields(user.id);

  await verifyAnonSignIn("final");

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
      auth_updated: !authCreated,
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
}

main().catch((err) => {
  fail(err?.message ?? String(err));
});
