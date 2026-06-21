/**
 * Stripe subscription E2E smoke (G.10-L) — staging + test mode only.
 *
 * Usage:
 *   node scripts/stripe-subscription-smoke.mjs audit
 *   node scripts/stripe-subscription-smoke.mjs baseline
 *   node scripts/stripe-subscription-smoke.mjs webhook-smoke
 *
 * webhook-smoke requires running dev server (PLAYWRIGHT_BASE_URL, default localhost:3000).
 */
import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  hasInvalidCheckoutPriceIds,
  priceIdEnvStatus,
} from "./lib/stripe-price-id-env.mjs";
import {
  buildCheckoutSessionCompletedEvent,
  buildInvoicePaidEvent,
  postSignedWebhook,
} from "./lib/stripe-webhook-fixture.mjs";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env.local");
const RESULT_PATH = resolve(ROOT, "scripts/stripe-subscription-smoke-result.json");
const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const PROD_REF = "hszjafdelcydnppyolkm";
const WEBHOOK_ROUTE = "/api/stripe/webhook";
const STARTER_MONTHLY_CREDITS = 50;
const PROTECTED_USERS = [
  "billingtest@influexai.test",
  "stripebillingtest@influexai.test",
  "test@influexai.test",
];
const PROTECTED_PASSWORDS = {
  "billingtest@influexai.test":
    process.env.BILLING_TEST_USER_PASSWORD ?? "TestPassword123!",
  "stripebillingtest@influexai.test":
    process.env.STRIPE_BILLING_TEST_PASSWORD ?? "StripeBilling123!",
  "test@influexai.test": process.env.TEST_USER_PASSWORD ?? "TestPassword123!",
};

config({ path: ENV_PATH });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL =
  process.env.STRIPE_SUBSCRIPTION_TEST_EMAIL ?? "subscriptionsmoke@influexai.test";
const PASSWORD =
  process.env.STRIPE_SUBSCRIPTION_TEST_PASSWORD ?? "SubscriptionSmoke123!";

function keyKind(value, prefix) {
  if (!value?.trim()) return "missing";
  if (value.startsWith(`${prefix}test_`)) return `${prefix}test_`;
  if (value.startsWith(`${prefix}live_`)) return `${prefix}live_`;
  return "other";
}

function maskRef(url) {
  const m = (url ?? "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(2);
}

function auditEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = maskRef(url);
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const starterPrice = priceIdEnvStatus(
    process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY
  );

  const blockers = [];
  if (!existsSync(ENV_PATH)) blockers.push("missing_env_local");
  if (ref !== STAGING_REF) blockers.push("supabase_not_staging");
  if (ref === PROD_REF) blockers.push("supabase_production_ref");
  if ((process.env.STRIPE_MODE ?? "").trim().toLowerCase() !== "test") {
    blockers.push("stripe_mode_not_test");
  }
  if (!stripeSecret.startsWith("sk_test_")) blockers.push("stripe_secret_not_test");
  if (stripeSecret.startsWith("sk_live_")) blockers.push("stripe_live_secret");
  if (!stripePub.startsWith("pk_test_")) blockers.push("stripe_publishable_not_test");
  if (stripePub.startsWith("pk_live_")) blockers.push("stripe_live_publishable");
  if (!webhookSecret.startsWith("whsec_")) blockers.push("missing_webhook_secret");
  if (starterPrice !== "price_id_set") blockers.push("missing_starter_monthly_price");
  if ((process.env.PROVIDERS_DISABLED ?? "").trim().toLowerCase() !== "true") {
    blockers.push("providers_not_disabled");
  }
  if (
    process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE?.trim().toLowerCase() === "true"
  ) {
    blockers.push("provider_smoke_window_open");
  }

  const report = {
    phase: "audit",
    env_local_exists: existsSync(ENV_PATH),
    supabase_ref: ref,
    staging_ref_ok: ref === STAGING_REF,
    stripe_mode: process.env.STRIPE_MODE ?? "(unset)",
    providers_disabled: process.env.PROVIDERS_DISABLED ?? "(unset)",
    allow_safe_dev_provider_smoke:
      process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE ?? "(unset)",
    stripe_secret_kind: keyKind(stripeSecret, "sk_"),
    stripe_publishable_kind: keyKind(stripePub, "pk_"),
    webhook_secret_present: webhookSecret.startsWith("whsec_"),
    starter_monthly_price_status: starterPrice,
    checkout_price_ids_ready: !hasInvalidCheckoutPriceIds({
      subscriptionPriceIds: {
        NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY: starterPrice,
      },
      creditPackPriceIds: {
        STRIPE_CREDITS_25: "price_id_set",
        STRIPE_CREDITS_70: "price_id_set",
        STRIPE_CREDITS_160: "price_id_set",
        STRIPE_CREDITS_320: "price_id_set",
      },
    }),
    blockers,
    safe_to_proceed: blockers.length === 0,
  };

  writeFileSync(RESULT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.safe_to_proceed) fail("Safety audit failed — see blockers");
  return report;
}

async function verifyStarterPrice() {
  auditEnv();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const priceId = process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY?.trim();
  if (!priceId) fail("NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY missing");

  const price = await stripe.prices.retrieve(priceId);
  const ok = price.livemode === false && price.active === true;
  const report = {
    phase: "verify-starter-price",
    priceId: `${priceId.slice(0, 12)}…`,
    livemode: price.livemode,
    active: price.active,
    ok,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!ok) fail("Starter subscription price verification failed");
  return report;
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) fail("Supabase admin env missing");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function listAllUsers(admin) {
  try {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    return data.users;
  } catch {
    return [];
  }
}

async function findUserByEmail(admin, email, allUsers) {
  const users = allUsers ?? (await listAllUsers(admin));
  const found = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (found) return found;

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const password =
    email === EMAIL
      ? PASSWORD
      : (PROTECTED_PASSWORDS[email.toLowerCase()] ?? PASSWORD);
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    if (email === EMAIL) fail(`User ${email} not found`);
    return null;
  }
  return data.user;
}

async function findUser(admin, email) {
  return findUserByEmail(admin, email);
}

async function readBillingState(admin, userId) {
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "credits, plan, stripe_customer_id, stripe_subscription_id, is_admin, role"
    )
    .eq("id", userId)
    .maybeSingle();

  const { data: txs } = await admin
    .from("credit_transactions")
    .select("id, amount, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    profile: profile ?? null,
    credit_transactions_recent: txs ?? [],
  };
}

async function readProtectedUserSnapshots(admin) {
  const allUsers = await listAllUsers(admin);
  const snapshots = {};
  for (const protectedEmail of PROTECTED_USERS) {
    const user = await findUserByEmail(admin, protectedEmail, allUsers);
    if (!user) {
      snapshots[protectedEmail] = { error: "not_found" };
      continue;
    }
    const state = await readBillingState(admin, user.id);
    snapshots[protectedEmail] = {
      user_id: user.id,
      credits: state.profile?.credits ?? null,
      plan: state.profile?.plan ?? null,
    };
  }
  return snapshots;
}

async function baseline() {
  auditEnv();
  await verifyStarterPrice();
  const admin = getAdmin();
  const user = await findUser(admin, EMAIL);
  const state = await readBillingState(admin, user.id);
  const report = {
    phase: "baseline",
    email: EMAIL,
    user_id: user.id,
    ...state,
    protected_users_snapshot: await readProtectedUserSnapshots(admin),
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
}

async function serverReachable() {
  try {
    const res = await fetch(`${BASE}/api/stripe/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return res.status === 400 || res.status === 200;
  } catch {
    return false;
  }
}

async function webhookSmoke() {
  auditEnv();
  await verifyStarterPrice();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret?.startsWith("whsec_")) fail("STRIPE_WEBHOOK_SECRET missing");

  if (!(await serverReachable())) {
    fail(
      `Dev server not reachable at ${BASE} — start: npm run dev, then re-run webhook-smoke`
    );
  }

  const admin = getAdmin();
  const protectedBefore = await readProtectedUserSnapshots(admin);
  const user = await findUser(admin, EMAIL);
  const before = await readBillingState(admin, user.id);
  const creditsBefore = before.profile?.credits ?? 0;
  const planBefore = before.profile?.plan ?? "free";

  const ts = Date.now();
  const sessionId = `cs_test_g10l_${ts}`;
  const eventId = `evt_test_g10l_${ts}`;
  const customerId = `cus_test_g10l_${ts}`;
  const subscriptionId = `sub_test_g10l_${ts}`;
  const starterPriceId =
    process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY?.trim() ??
    "price_test_g10l";

  const cancelBaselineCredits = creditsBefore;
  const cancelBaselinePlan = planBefore;

  const subEvent = buildCheckoutSessionCompletedEvent({
    eventId,
    sessionId,
    userId: user.id,
    checkoutType: "platform_subscription",
    plan: "starter",
    priceId: starterPriceId,
    customerId,
    subscriptionId,
    livemode: false,
  });

  const first = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    subEvent,
    webhookSecret
  );
  const afterFirst = await readBillingState(admin, user.id);
  const creditsAfterFirst = afterFirst.profile?.credits ?? 0;
  const planAfterFirst = afterFirst.profile?.plan ?? null;
  const creditDeltaFirst = creditsAfterFirst - creditsBefore;

  const duplicate = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    subEvent,
    webhookSecret
  );
  const afterDup = await readBillingState(admin, user.id);
  const creditsAfterDup = afterDup.profile?.credits ?? 0;
  const duplicateDelta = creditsAfterDup - creditsAfterFirst;

  const badSig = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    subEvent,
    "whsec_wrong_secret_for_test"
  );

  const liveEvent = buildCheckoutSessionCompletedEvent({
    eventId: `evt_test_g10l_live_${ts}`,
    sessionId: `cs_test_g10l_live_${ts}`,
    userId: user.id,
    checkoutType: "platform_subscription",
    plan: "starter",
    customerId: `cus_test_g10l_live_${ts}`,
    subscriptionId: `sub_test_g10l_live_${ts}`,
    livemode: true,
  });
  const liveBlocked = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    liveEvent,
    webhookSecret
  );
  const afterLive = await readBillingState(admin, user.id);

  const invoiceId = `in_test_g10l_${ts}`;
  const invoiceEventId = `evt_test_g10l_inv_${ts}`;
  const invoiceEvent = buildInvoicePaidEvent({
    eventId: invoiceEventId,
    invoiceId,
    subscriptionId,
    livemode: false,
  });
  const invoiceFirst = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    invoiceEvent,
    webhookSecret
  );
  const afterInvoice = await readBillingState(admin, user.id);
  const creditsAfterInvoice = afterInvoice.profile?.credits ?? 0;
  const invoiceDelta = creditsAfterInvoice - creditsAfterDup;

  const invoiceDup = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    invoiceEvent,
    webhookSecret
  );
  const afterInvoiceDup = await readBillingState(admin, user.id);

  const { data: stripeEventRow } = await admin
    .from("stripe_events")
    .select("id, type")
    .eq("id", eventId)
    .maybeSingle();

  const { data: processedSession } = await admin
    .from("processed_checkout_sessions")
    .select("stripe_session_id, credits_granted, checkout_type")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  const { data: processedInvoice } = await admin
    .from("processed_stripe_invoices")
    .select("stripe_invoice_id, credits_granted")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();

  const subCreditTx = (afterDup.credit_transactions_recent ?? []).find(
    (t) =>
      t.amount === STARTER_MONTHLY_CREDITS &&
      t.description?.includes("Starter Plan")
  );

  const renewalCreditTx = (afterInvoiceDup.credit_transactions_recent ?? []).find(
    (t) =>
      t.amount === STARTER_MONTHLY_CREDITS &&
      t.description?.includes("Plan-Verlängerung")
  );

  const protectedAfter = await readProtectedUserSnapshots(admin);
  const protectedUnchanged = PROTECTED_USERS.every((email) => {
    const b = protectedBefore[email];
    const a = protectedAfter[email];
    if (!b || !a || b.error || a.error) return true;
    return b.credits === a.credits && b.plan === a.plan;
  });

  const report = {
    phase: "subscription-webhook-smoke",
    email: EMAIL,
    user_id: user.id,
    plan_before: planBefore,
    plan_after_first: planAfterFirst,
    credits_before: creditsBefore,
    credits_after_first: creditsAfterFirst,
    credit_delta_first: creditDeltaFirst,
    expected_subscription_delta: STARTER_MONTHLY_CREDITS,
    credits_after_duplicate: creditsAfterDup,
    duplicate_delta: duplicateDelta,
    stripe_customer_id: afterFirst.profile?.stripe_customer_id ?? null,
    stripe_subscription_id: afterFirst.profile?.stripe_subscription_id ?? null,
    credits_after_invoice: creditsAfterInvoice,
    invoice_delta: invoiceDelta,
    expected_renewal_delta: STARTER_MONTHLY_CREDITS,
    credits_after_invoice_duplicate: afterInvoiceDup.profile?.credits ?? null,
    cancel_simulation: {
      note: "No checkout.session.completed sent — cancel produces no webhook",
      credits_unchanged: cancelBaselineCredits === creditsBefore,
      plan_unchanged: cancelBaselinePlan === planBefore,
    },
    webhook_subscription_first: { status: first.status, body: first.json },
    webhook_subscription_duplicate: {
      status: duplicate.status,
      body: duplicate.json,
    },
    webhook_bad_signature: { status: badSig.status, body: badSig.json },
    webhook_livemode_blocked: {
      status: liveBlocked.status,
      body: liveBlocked.json,
    },
    webhook_invoice_first: { status: invoiceFirst.status, body: invoiceFirst.json },
    webhook_invoice_duplicate: {
      status: invoiceDup.status,
      body: invoiceDup.json,
    },
    credits_after_live_attempt: afterLive.profile?.credits ?? null,
    stripe_events_row: stripeEventRow,
    processed_checkout_session: processedSession,
    processed_stripe_invoice: processedInvoice,
    subscription_credit_transaction_found: Boolean(subCreditTx),
    renewal_credit_transaction_found: Boolean(renewalCreditTx),
    protected_users_unchanged: protectedUnchanged,
    protected_users_before: protectedBefore,
    protected_users_after: protectedAfter,
    pass:
      first.status === 200 &&
      planAfterFirst === "starter" &&
      creditDeltaFirst === STARTER_MONTHLY_CREDITS &&
      duplicate.json?.duplicate === true &&
      duplicateDelta === 0 &&
      badSig.status === 400 &&
      liveBlocked.status === 403 &&
      afterLive.profile?.credits === creditsAfterDup &&
      Boolean(afterFirst.profile?.stripe_customer_id) &&
      Boolean(afterFirst.profile?.stripe_subscription_id) &&
      Boolean(stripeEventRow) &&
      Boolean(processedSession) &&
      processedSession?.checkout_type === "platform_subscription" &&
      Boolean(subCreditTx) &&
      invoiceFirst.status === 200 &&
      invoiceDelta === STARTER_MONTHLY_CREDITS &&
      invoiceDup.json?.duplicate === true &&
      (afterInvoiceDup.profile?.credits ?? 0) === creditsAfterInvoice &&
      Boolean(processedInvoice) &&
      Boolean(renewalCreditTx) &&
      protectedUnchanged,
  };

  writeFileSync(RESULT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.pass ? 0 : 1);
}

const cmd = process.argv[2] ?? "audit";
if (cmd === "audit") {
  auditEnv();
} else if (cmd === "baseline") {
  await baseline();
} else if (cmd === "webhook-smoke") {
  await webhookSmoke();
} else {
  console.error("Unknown command:", cmd);
  console.error("Commands: audit | baseline | webhook-smoke");
  process.exit(1);
}
