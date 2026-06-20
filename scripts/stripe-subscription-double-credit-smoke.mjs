/**
 * G.10-L2 — Subscription initial invoice double-credit guard smoke.
 *
 * Fall A: checkout.session.completed → +50
 * Fall B: invoice.paid subscription_create → no extra credits
 * Fall C: invoice.paid subscription_cycle → +50 renewal
 *
 * Usage: node scripts/stripe-subscription-double-credit-smoke.mjs
 */
import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync, existsSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  buildCheckoutSessionCompletedEvent,
  buildInvoicePaidEvent,
  postSignedWebhook,
} from "./lib/stripe-webhook-fixture.mjs";

const ENV_PATH = resolve(process.cwd(), ".env.local");
const RESULT_PATH = resolve(
  process.cwd(),
  "scripts/stripe-subscription-double-credit-smoke-result.json"
);
const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const PROD_REF = "hszjafdelcydnppyolkm";
const WEBHOOK_ROUTE = "/api/stripe/webhook";
const STARTER_CREDITS = 50;
const PROTECTED = [
  "billingtest@influexai.test",
  "stripebillingtest@influexai.test",
  "subscriptionsmoke@influexai.test",
  "test@influexai.test",
];

config({ path: ENV_PATH });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL =
  process.env.STRIPE_SUBSCRIPTION_DOUBLE_CHECK_EMAIL ??
  "subscriptiondoublecheck@influexai.test";
const PASSWORD =
  process.env.STRIPE_SUBSCRIPTION_DOUBLE_CHECK_PASSWORD ??
  "SubscriptionDouble123!";

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(2);
}

function auditEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ?? null;
  const blockers = [];
  if (!existsSync(ENV_PATH)) blockers.push("missing_env_local");
  if (ref !== STAGING_REF) blockers.push("supabase_not_staging");
  if (ref === PROD_REF) blockers.push("supabase_production_ref");
  if ((process.env.STRIPE_MODE ?? "").toLowerCase() !== "test") {
    blockers.push("stripe_mode_not_test");
  }
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!sk.startsWith("sk_test_")) blockers.push("stripe_secret_not_test");
  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) {
    blockers.push("missing_webhook_secret");
  }
  if ((process.env.PROVIDERS_DISABLED ?? "").toLowerCase() !== "true") {
    blockers.push("providers_not_disabled");
  }
  if (
    process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE?.trim().toLowerCase() === "true"
  ) {
    blockers.push("provider_smoke_window_open");
  }
  const report = {
    phase: "audit",
    supabase_ref: ref,
    stripe_mode: process.env.STRIPE_MODE,
    providers_disabled: process.env.PROVIDERS_DISABLED,
    stripe_secret_kind: sk.startsWith("sk_test_") ? "sk_test_" : "other",
    blockers,
    safe_to_proceed: blockers.length === 0,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.safe_to_proceed) fail("Safety audit failed");
  return report;
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function findUser(admin) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data, error } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error || !data.user) {
    fail(`User ${EMAIL} not found — run staging:ensure-subscription-double-check-user`);
  }
  return data.user;
}

async function readState(admin, userId) {
  const { data: profile } = await admin
    .from("profiles")
    .select("credits, plan, stripe_customer_id, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();
  const { data: txs } = await admin
    .from("credit_transactions")
    .select("id, amount, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  return { profile, credit_transactions_recent: txs ?? [] };
}

async function protectedSnapshot(admin) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const passwords = {
    "billingtest@influexai.test":
      process.env.BILLING_TEST_USER_PASSWORD ?? "TestPassword123!",
    "stripebillingtest@influexai.test":
      process.env.STRIPE_BILLING_TEST_PASSWORD ?? "StripeBilling123!",
    "subscriptionsmoke@influexai.test":
      process.env.STRIPE_SUBSCRIPTION_TEST_PASSWORD ?? "SubscriptionSmoke123!",
    "test@influexai.test":
      process.env.TEST_USER_PASSWORD ?? "TestPassword123!",
  };
  const out = {};
  for (const e of PROTECTED) {
    const { data } = await anon.auth.signInWithPassword({
      email: e,
      password: passwords[e],
    });
    if (!data.user) {
      out[e] = { error: "signin_failed" };
      continue;
    }
    const { data: p } = await admin
      .from("profiles")
      .select("credits, plan")
      .eq("id", data.user.id)
      .maybeSingle();
    out[e] = { credits: p?.credits ?? null, plan: p?.plan ?? null };
  }
  return out;
}

async function serverReachable() {
  try {
    const res = await fetch(`${BASE}${WEBHOOK_ROUTE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return res.status === 400 || res.status === 200;
  } catch {
    return false;
  }
}

auditEnv();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret?.startsWith("whsec_")) fail("STRIPE_WEBHOOK_SECRET missing");
if (!(await serverReachable())) {
  fail(`Dev server not reachable at ${BASE} — start: npm run dev`);
}

const admin = getAdmin();
const protectedBefore = await protectedSnapshot(admin);
const user = await findUser(admin);
const before = await readState(admin, user.id);
const creditsStart = before.profile?.credits ?? 0;

const ts = Date.now();
const sessionId = `cs_test_g10l2_${ts}`;
const subscriptionId = `sub_test_g10l2_${ts}`;
const customerId = `cus_test_g10l2_${ts}`;

const checkoutEvent = buildCheckoutSessionCompletedEvent({
  eventId: `evt_test_g10l2_checkout_${ts}`,
  sessionId,
  userId: user.id,
  checkoutType: "platform_subscription",
  plan: "starter",
  customerId,
  subscriptionId,
});

const checkoutRes = await postSignedWebhook(
  BASE,
  WEBHOOK_ROUTE,
  checkoutEvent,
  webhookSecret
);
const afterCheckout = await readState(admin, user.id);
const creditsAfterCheckout = afterCheckout.profile?.credits ?? 0;

const initialInvoiceEvent = buildInvoicePaidEvent({
  eventId: `evt_test_g10l2_inv_create_${ts}`,
  invoiceId: `in_test_g10l2_create_${ts}`,
  subscriptionId,
  billingReason: "subscription_create",
});
const initialInvoiceRes = await postSignedWebhook(
  BASE,
  WEBHOOK_ROUTE,
  initialInvoiceEvent,
  webhookSecret
);
const afterInitialInvoice = await readState(admin, user.id);
const creditsAfterInitialInvoice = afterInitialInvoice.profile?.credits ?? 0;

const renewalInvoiceEvent = buildInvoicePaidEvent({
  eventId: `evt_test_g10l2_inv_cycle_${ts}`,
  invoiceId: `in_test_g10l2_cycle_${ts}`,
  subscriptionId,
  billingReason: "subscription_cycle",
});
const renewalInvoiceRes = await postSignedWebhook(
  BASE,
  WEBHOOK_ROUTE,
  renewalInvoiceEvent,
  webhookSecret
);
const afterRenewal = await readState(admin, user.id);
const creditsAfterRenewal = afterRenewal.profile?.credits ?? 0;

const protectedAfter = await protectedSnapshot(admin);
const protectedUnchanged = PROTECTED.every((e) => {
  const b = protectedBefore[e];
  const a = protectedAfter[e];
  return b?.credits === a?.credits && b?.plan === a?.plan;
});

const starterTxCount = (afterRenewal.credit_transactions_recent ?? []).filter(
  (t) =>
    t.amount === STARTER_CREDITS &&
    (t.description?.includes("Starter Plan") ||
      t.description?.includes("Plan-Verlängerung"))
).length;

const initialInvoiceTx = (afterInitialInvoice.credit_transactions_recent ?? []).find(
  (t) =>
    t.description?.includes("Plan-Verlängerung") ||
    (t.amount === STARTER_CREDITS && t.created_at >= new Date(ts - 60000).toISOString())
);

const report = {
  phase: "double-credit-guard",
  email: EMAIL,
  user_id: user.id,
  fall_a_checkout: {
    credits_before: creditsStart,
    credits_after: creditsAfterCheckout,
    delta: creditsAfterCheckout - creditsStart,
    expected_delta: STARTER_CREDITS,
    webhook_status: checkoutRes.status,
  },
  fall_b_initial_invoice: {
    billing_reason: "subscription_create",
    credits_before: creditsAfterCheckout,
    credits_after: creditsAfterInitialInvoice,
    delta: creditsAfterInitialInvoice - creditsAfterCheckout,
    expected_delta: 0,
    webhook_status: initialInvoiceRes.status,
    unexpected_credit_transaction: Boolean(
      initialInvoiceTx &&
        initialInvoiceTx.description?.includes("Plan-Verlängerung")
    ),
  },
  fall_c_renewal: {
    billing_reason: "subscription_cycle",
    credits_before: creditsAfterInitialInvoice,
    credits_after: creditsAfterRenewal,
    delta: creditsAfterRenewal - creditsAfterInitialInvoice,
    expected_delta: STARTER_CREDITS,
    webhook_status: renewalInvoiceRes.status,
  },
  credit_transactions_starter_or_renewal_count: starterTxCount,
  protected_users_unchanged: protectedUnchanged,
  guard_already_present: true,
  fix_applied: "extracted shouldGrantSubscriptionRenewalCredits helper (no behavior change)",
  pass:
    checkoutRes.status === 200 &&
    creditsAfterCheckout - creditsStart === STARTER_CREDITS &&
    initialInvoiceRes.status === 200 &&
    creditsAfterInitialInvoice === creditsAfterCheckout &&
    renewalInvoiceRes.status === 200 &&
    creditsAfterRenewal - creditsAfterInitialInvoice === STARTER_CREDITS &&
    starterTxCount === 2 &&
    protectedUnchanged,
};

writeFileSync(RESULT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
