/**
 * Stripe test billing / webhook smoke (G.10-K) — staging + test mode only.
 *
 * Usage:
 *   node scripts/stripe-billing-smoke.mjs audit
 *   node scripts/stripe-billing-smoke.mjs verify-prices
 *   node scripts/stripe-billing-smoke.mjs baseline
 *   node scripts/stripe-billing-smoke.mjs webhook-smoke
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
  postSignedWebhook,
} from "./lib/stripe-webhook-fixture.mjs";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env.local");
const RESULT_PATH = resolve(ROOT, "scripts/stripe-billing-smoke-result.json");
const STAGING_REF = "jvjmqtxlqfqaoyjklpxh";
const PROD_REF = "hszjafdelcydnppyolkm";
const WEBHOOK_ROUTE = "/api/stripe/webhook";

config({ path: ENV_PATH });

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL =
  process.env.STRIPE_BILLING_TEST_EMAIL ?? "stripebillingtest@influexai.test";

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
  if ((process.env.PROVIDERS_DISABLED ?? "").trim().toLowerCase() !== "true") {
    blockers.push("providers_not_disabled");
  }
  if (
    process.env.ALLOW_SAFE_DEV_PROVIDER_SMOKE?.trim().toLowerCase() === "true"
  ) {
    blockers.push("provider_smoke_window_open");
  }

  const creditPack25 = priceIdEnvStatus(process.env.STRIPE_CREDITS_25);
  const subscriptionKeys = [
    "NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY",
    "NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY",
  ];
  const subscriptionPriceIds = Object.fromEntries(
    subscriptionKeys.map((key) => [key, priceIdEnvStatus(process.env[key])])
  );

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
    credit_pack_small_price_status: creditPack25,
    subscription_price_sample: subscriptionPriceIds,
    checkout_price_ids_ready: !hasInvalidCheckoutPriceIds({
      creditPack25,
      subscriptionPriceIds,
      creditPackPriceIds: {},
    }),
    blockers,
    safe_to_proceed: blockers.length === 0,
  };

  writeFileSync(RESULT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.safe_to_proceed) fail("Safety audit failed — see blockers");
  return report;
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) fail("Supabase admin env missing");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function findUser(admin) {
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const password =
    process.env.STRIPE_BILLING_TEST_PASSWORD ?? "StripeBilling123!";

  try {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (!error) {
      const found = data.users.find(
        (u) => u.email?.toLowerCase() === EMAIL.toLowerCase()
      );
      if (found) return found;
    }
  } catch {
    /* fall through */
  }

  const { data, error } = await anon.auth.signInWithPassword({
    email: EMAIL,
    password,
  });
  if (error || !data.user) {
    fail(`User ${EMAIL} not found — run staging:ensure-stripe-billing-user`);
  }
  return data.user;
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

  const { count: processedSessions } = await admin
    .from("processed_checkout_sessions")
    .select("stripe_session_id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    profile: profile ?? null,
    credit_transactions_recent: txs ?? [],
    processed_checkout_sessions_count: processedSessions ?? 0,
  };
}

async function verifyPrices() {
  auditEnv();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const priceIds = [
    process.env.STRIPE_CREDITS_25,
    process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY,
  ].filter(Boolean);

  const results = [];
  for (const priceId of priceIds) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      results.push({
        priceId: `${priceId.slice(0, 12)}…`,
        livemode: price.livemode,
        active: price.active,
        ok: price.livemode === false && price.active === true,
      });
      if (price.livemode) fail(`Price ${priceId} is LIVE mode — stop`);
    } catch (e) {
      results.push({
        priceId: `${String(priceId).slice(0, 12)}…`,
        error: String(e.message ?? e).slice(0, 120),
        ok: false,
      });
    }
  }

  const report = {
    phase: "verify-prices",
    prices: results,
    all_ok: results.length > 0 && results.every((r) => r.ok),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.all_ok) fail("Stripe price verification failed");
  return report;
}

async function baseline() {
  auditEnv();
  const admin = getAdmin();
  const user = await findUser(admin);
  const state = await readBillingState(admin, user.id);
  const report = {
    phase: "baseline",
    email: EMAIL,
    user_id: user.id,
    ...state,
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret?.startsWith("whsec_")) fail("STRIPE_WEBHOOK_SECRET missing");

  if (!(await serverReachable())) {
    fail(
      `Dev server not reachable at ${BASE} — start: npm run dev, then re-run webhook-smoke`
    );
  }

  const admin = getAdmin();
  const user = await findUser(admin);
  const before = await readBillingState(admin, user.id);
  const creditsBefore = before.profile?.credits ?? 0;

  const priceId = process.env.STRIPE_CREDITS_25?.trim() || "price_test_g10k";
  const creditGrant = 25;
  const sessionId = `cs_test_g10k_${Date.now()}`;
  const eventId = `evt_test_g10k_${Date.now()}`;

  const event = buildCheckoutSessionCompletedEvent({
    eventId,
    sessionId,
    userId: user.id,
    credits: creditGrant,
    priceId,
    checkoutType: "credit_pack",
    livemode: false,
  });

  const first = await postSignedWebhook(BASE, WEBHOOK_ROUTE, event, webhookSecret);
  const afterFirst = await readBillingState(admin, user.id);
  const creditsAfterFirst = afterFirst.profile?.credits ?? 0;
  const deltaFirst = creditsAfterFirst - creditsBefore;

  const duplicate = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    event,
    webhookSecret
  );
  const afterDup = await readBillingState(admin, user.id);
  const creditsAfterDup = afterDup.profile?.credits ?? 0;

  const badSig = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    event,
    "whsec_wrong_secret_for_test"
  );

  const liveEvent = buildCheckoutSessionCompletedEvent({
    eventId: `evt_test_g10k_live_${Date.now()}`,
    sessionId: `cs_test_g10k_live_${Date.now()}`,
    userId: user.id,
    credits: creditGrant,
    priceId,
    livemode: true,
  });
  const liveBlocked = await postSignedWebhook(
    BASE,
    WEBHOOK_ROUTE,
    liveEvent,
    webhookSecret
  );
  const afterLive = await readBillingState(admin, user.id);

  const { data: stripeEventRow } = await admin
    .from("stripe_events")
    .select("id, type")
    .eq("id", eventId)
    .maybeSingle();

  const { data: processedSession } = await admin
    .from("processed_checkout_sessions")
    .select("stripe_session_id, credits_granted")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  const creditTx = (afterDup.credit_transactions_recent ?? []).find(
    (t) => t.amount === creditGrant && t.description?.includes("Credits gekauft")
  );

  const report = {
    phase: "webhook-smoke",
    email: EMAIL,
    user_id: user.id,
    credits_before: creditsBefore,
    credits_after_first: creditsAfterFirst,
    credit_delta_first: deltaFirst,
    expected_delta: creditGrant,
    credits_after_duplicate: creditsAfterDup,
    duplicate_delta: creditsAfterDup - creditsAfterFirst,
    webhook_first: { status: first.status, body: first.json },
    webhook_duplicate: { status: duplicate.status, body: duplicate.json },
    webhook_bad_signature: { status: badSig.status, body: badSig.json },
    webhook_livemode_blocked: { status: liveBlocked.status, body: liveBlocked.json },
    credits_after_live_attempt: afterLive.profile?.credits ?? null,
    stripe_events_row: stripeEventRow,
    processed_checkout_session: processedSession,
    credit_transaction_found: Boolean(creditTx),
    pass:
      first.status === 200 &&
      deltaFirst === creditGrant &&
      duplicate.json?.duplicate === true &&
      creditsAfterDup === creditsAfterFirst &&
      badSig.status === 400 &&
      liveBlocked.status !== 200 &&
      afterLive.profile?.credits === creditsAfterDup &&
      Boolean(stripeEventRow) &&
      Boolean(processedSession),
  };

  writeFileSync(RESULT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.pass ? 0 : 1);
}

const cmd = process.argv[2] ?? "audit";
if (cmd === "audit") {
  auditEnv();
} else if (cmd === "verify-prices") {
  await verifyPrices();
} else if (cmd === "baseline") {
  await baseline();
} else if (cmd === "webhook-smoke") {
  await webhookSmoke();
} else {
  console.error("Unknown command:", cmd);
  console.error("Commands: audit | verify-prices | baseline | webhook-smoke");
  process.exit(1);
}
