# Stripe Test Billing / Webhook — G.10-K

**Date:** 2026-06-16  
**Branch:** `master`  
**Staging Supabase ref:** `jvjmqtxlqfqaoyjklpxh`  
**Scope:** Stripe Test Mode only — no provider calls, no live Stripe, no production Supabase.

---

## 1. Safety Status

| Check | Result |
|-------|--------|
| Branch | `master` |
| PROVIDERS_DISABLED | `true` |
| ALLOW_SAFE_DEV_PROVIDER_SMOKE | `false` |
| STRIPE_MODE | `test` |
| Supabase ref | `jvjmqtxlqfqaoyjklpxh` (staging) |
| Stripe secret prefix | `sk_test_` |
| Stripe publishable prefix | `pk_test_` |
| Webhook secret | present (`whsec_…`) |
| `.env.local` staged | **no** |
| `scripts/supervised-smoke-result.json` staged | **no** |
| `public/images/lora-training/` staged | **no** |
| Provider call executed | **no** |
| Production / Live Stripe | **blocked** |

---

## 2. Stripe Routes & Scripts

### API routes

| Route | Purpose |
|-------|---------|
| `POST /api/stripe/webhook` | Primary webhook — signature, livemode guard, idempotency |
| `POST /api/webhooks/stripe` | Legacy alias (same handler) |
| `POST /api/stripe/subscribe` | Platform subscription checkout |
| `POST /api/credits/checkout` | Credit pack checkout (canonical) |
| `POST /api/stripe/credits-checkout` | Credit pack checkout wrapper |
| `POST /api/stripe/checkout` | Legacy credit checkout (deprecated) |
| `GET /api/stripe/session` | Poll credits after success redirect |

### npm scripts (new G.10-K)

| Script | Command |
|--------|---------|
| `staging:ensure-stripe-billing-user` | Create/isolate `stripebillingtest@influexai.test` |
| `smoke:stripe:audit` | Env + staging ref + key prefix safety |
| `smoke:stripe:verify-prices` | Stripe Test API — `livemode=false`, active prices |
| `smoke:stripe:baseline` | Read-only billing state for test user |
| `smoke:stripe:webhook` | Signed fixture webhook smoke (requires dev server) |

### Existing scripts

- `scripts/check-stripe-checkout-env.mjs` — env/price ID audit
- `scripts/test-credits-payments.mjs` — Playwright UI smoke (not webhook)

---

## 3. Code Audit — Key Findings

### User mapping

Checkout sessions embed `metadata.user_id` (or `userId`). Webhook handlers reject sessions without a resolvable user id.

### Plan mapping

- `handlePlatformSubscription`: sets `profiles.plan`, `stripe_subscription_id`, `stripe_customer_id`, grants `SUBSCRIPTION_PLANS[plan].monthlyCredits`.
- `handlePlatformSubscriptionChange`: downgrades to `free` when subscription inactive; syncs plan from subscription metadata.

### Credit mapping

- Credit packs: `resolveCreditPurchaseAmount()` from metadata or price ID via `creditsForStripePriceId()`.
- Subscriptions: monthly credits from `SUBSCRIPTION_PLANS`.
- Renewals: `invoice.paid` with `billing_reason=subscription_cycle` via `processed_stripe_invoices`.

### Idempotency (three layers)

1. **`stripe_events`** — dedup by Stripe `event.id` (primary webhook idempotency).
2. **`processed_checkout_sessions`** — dedup by `stripe_session_id` (unique constraint).
3. **`processed_stripe_invoices`** — dedup by `stripe_invoice_id`.

`grantCreditsThenClaimCheckout`: grants credits first, then claims session. Duplicate event returns `{ duplicate: true }` without second grant when event id already in `stripe_events`.

### Cancel handling

- Credit pack cancel URL: `${SITE_URL}/dashboard?canceled=true`
- Subscription cancel URL: `${SITE_URL}/pricing?checkout=cancelled`
- **No webhook fires on cancel** — `checkout.session.completed` only on success. No credits/plan change without completed payment.

### Signature & livemode

- Missing/invalid signature → **400** `Ungültige Signatur`
- Live mode event in test/staging runtime → **403** `STRIPE_EVENT_MODE_BLOCKED`

### Price ID verification

`smoke:stripe:verify-prices` calls Stripe Test API; all sampled prices returned `livemode: false`, `active: true`.

### Open risks (documented in webhook code)

- Concurrent duplicate deliveries before claim insert could theoretically double-grant (race window).
- Crash after `addCredits` but before claim insert could double-grant on Stripe retry.
- Mitigation for MVP: event-level dedup + session claim; full pending/completed status column would need migration (not applied in G.10-K).

---

## 4. Test User

| Field | Value |
|-------|-------|
| Email | `stripebillingtest@influexai.test` |
| User ID | `24d70aa2-2dbf-4724-a888-00c83e8657d3` |
| Purpose | Isolated from `billingtest@influexai.test` (G.10-I provider proof preserved) |
| Baseline plan | `null` (free tier) |
| Baseline credits | **10** |

**Note:** `billingtest@influexai.test` was **not** modified (still credits=70, plan=starter from G.10-I).

---

## 5. Smoke Results

### Audit & verify-prices

- `safe_to_proceed: true`
- All blockers: `[]`
- Price IDs verified: `livemode=false`, `active=true` (3 sample prices)

### Webhook smoke (`npm run smoke:stripe:webhook`)

| Check | Result |
|-------|--------|
| Credits before | **10** |
| Credits after first webhook | **35** (+25) |
| Credit transaction | ✅ `25 Credits gekauft` |
| `stripe_events` row | ✅ |
| `processed_checkout_sessions` | ✅ `credits_granted: 25` |
| Duplicate webhook | **200** `{ duplicate: true }`, credits unchanged **35** |
| Bad signature | **400** |
| Live mode event | **403** blocked, credits unchanged |
| **pass** | **true** |

Result file (gitignored): `scripts/stripe-billing-smoke-result.json`

---

## 6. What Was Proven vs Manual

### Automatically proven ✅

- Stripe test env safety (keys, mode, staging ref)
- Test price IDs exist and are test-mode
- Credit pack webhook → +25 credits + `credit_transactions`
- Webhook idempotency (duplicate event → no double credit)
- Invalid signature rejected
- Live mode events blocked
- User mapping via `metadata.user_id`

### Code-audit proven (no runtime needed) ✅

- Cancel checkout does not trigger webhook → no grant
- Subscription plan update path exists in webhook handler
- Subscription cancel/downgrade via `customer.subscription.updated/deleted`

### Manual / next phase ⏳

- Full E2E subscription checkout with Stripe Test card (4242…)
- Stripe CLI `stripe listen` against deployed staging URL
- Subscription renewal (`invoice.paid`) idempotency smoke
- Customer portal cancel flow UI verification

---

## 7. Umsatz-MVP Billing Assessment

**Partially proven — sufficient for MVP launch gate with caveats:**

| Flow | Status |
|------|--------|
| Credit pack purchase (webhook) | ✅ Proven |
| Credit deduction on generation (G.10-I) | ✅ Proven |
| Subscription checkout E2E | ⏳ Manual Stripe test card |
| Subscription renewal | ⏳ Fixture/manual |
| Cancel = no grant | ✅ By design (code + no webhook) |

Core revenue loop (buy credits → spend on generation) is proven end-to-end across G.10-I + G.10-K.

---

## 8. Env Values

### Required now (local `.env.local`, never commit)

- `NEXT_PUBLIC_SUPABASE_URL` → staging ref `jvjmqtxlqfqaoyjklpxh`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` → `sk_test_…`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_test_…`
- `STRIPE_WEBHOOK_SECRET` → `whsec_…`
- `STRIPE_MODE=test`
- `PROVIDERS_DISABLED=true`
- `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`
- Credit/subscription price IDs (test mode)
- Optional: `STRIPE_BILLING_TEST_EMAIL=stripebillingtest@influexai.test`

### Required outside (staging deploy)

- Same Stripe test keys or dedicated staging webhook secret
- Webhook endpoint URL pointing to `/api/stripe/webhook`
- `STRIPE_MODE=test` enforced

---

## 9. Exact Next Steps

1. **Subscription E2E (manual):**
   ```bash
   npm run dev
   # Sign in as stripebillingtest@influexai.test
   # Complete Starter plan checkout with test card 4242 4242 4242 4242
   # Verify profiles.plan=starter and credit_transactions row
   ```

2. **Stripe CLI (optional staging):**
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # Set STRIPE_WEBHOOK_SECRET from CLI output in .env.local
   npm run smoke:stripe:webhook
   ```

3. **Re-run automated smokes after env changes:**
   ```bash
   npm run smoke:stripe:audit
   npm run smoke:stripe:verify-prices
   npm run smoke:stripe:baseline
   npm run smoke:stripe:webhook
   ```

---

## 10. Tests

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors (warnings only) |
| `npm run test:unit -- --run` | ✅ 218 passed |
| `npm run typecheck` | ✅ pass |
| `npm run build` | ✅ pass |

New unit test: `tests/unit/scripts/stripe-webhook-fixture.test.ts`
