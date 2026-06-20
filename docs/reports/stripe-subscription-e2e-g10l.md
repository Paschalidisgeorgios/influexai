# Stripe Subscription E2E — G.10-L

**Date:** 2026-06-16  
**Branch:** `master`  
**Follow-up:** G.10-L2 initial-invoice double-credit guard — see [`stripe-subscription-double-credit-guard-g10l2.md`](./stripe-subscription-double-credit-guard-g10l2.md)

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
| Provider call | **no** |
| Production / Live | **blocked** |

---

## 2. Test User

| Field | Value |
|-------|-------|
| Email | `subscriptionsmoke@influexai.test` |
| User ID | `31ad70ba-f8ed-4faa-8985-2f9d31cc5ce3` |
| Admin / allowlist | **no** |
| credit_exempt | **false** (not in ADMIN_EMAIL_ALLOWLIST) |
| Baseline plan | `null` / free |
| Baseline credits | **10** |

**Protected users (unchanged after smoke):**

| Email | Credits | Plan |
|-------|---------|------|
| `billingtest@influexai.test` | 70 | starter |
| `stripebillingtest@influexai.test` | 35 | null |
| `test@influexai.test` | (exempt QA — not modified) |

---

## 3. Subscription Code Path

### Routes

| Route | Role |
|-------|------|
| `POST /api/stripe/subscribe` | Creates Stripe Checkout Session (`mode: subscription`) |
| `POST /api/stripe/webhook` | Processes `checkout.session.completed`, `invoice.paid`, subscription lifecycle |
| `/api/webhooks/stripe` | Legacy alias |

### Plan & Price Mapping

| Item | Value |
|------|-------|
| Plan tested | **Starter** (lowest paid plan) |
| Env price key | `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY` |
| Stripe API verify | `livemode=false`, `active=true` |
| Monthly credits | **50** (`SUBSCRIPTION_PLANS.starter.monthlyCredits`) |
| Credit model | **Additive** via `addCredits()` — not reset to quota |

### User Mapping

Checkout metadata: `user_id`, `plan`, `checkout_type: platform_subscription`.  
Webhook `handlePlatformSubscription` reads `metadata.user_id` and `metadata.plan`.

### Redirects

| Outcome | URL |
|---------|-----|
| Success | `/checkout/success?type=subscription&session_id={CHECKOUT_SESSION_ID}` |
| Cancel | `/pricing?checkout=cancelled` |

### Idempotency

1. `stripe_events` — event.id dedup (returns `{ duplicate: true }`)
2. `processed_checkout_sessions` — session dedup for initial subscription grant
3. `processed_stripe_invoices` — invoice dedup for renewal grants
4. **`billing_reason` guard** — `invoice.paid` with `subscription_create` does **not** grant credits (only `subscription_cycle` renewals). Prevents double credit with checkout.session.completed (G.10-L2).

### Cancel Handling

Aborted checkout sends **no** `checkout.session.completed` webhook → no plan/credit change (code audit + smoke documents no-op).

---

## 4. Smoke Results

### Commands

```bash
npm run staging:ensure-subscription-smoke-user
npm run smoke:stripe:subscription-baseline
npm run smoke:stripe:subscription-webhook
```

### Subscription webhook smoke — PASS

| Check | Before | After | Expected |
|-------|--------|-------|----------|
| Plan | free/null | **starter** | starter |
| Credits | 10 | **60** | +50 |
| stripe_customer_id | null | **set** | set |
| stripe_subscription_id | null | **set** | set |
| Credit transaction | — | **Starter Plan — +50 Credits** | yes |

| Security / idempotency | Result |
|------------------------|--------|
| Duplicate subscription webhook | 200 `{ duplicate: true }`, credits stay 60 |
| Bad signature | 400 |
| Live mode event | 403 blocked |
| Renewal `invoice.paid` | +50 credits (60 → 110) |
| Duplicate invoice webhook | 200 `{ duplicate: true }`, credits stay 110 |
| Renewal credit transaction | **Plan-Verlängerung — +50 Credits** |
| Cancel simulation | No webhook → no change |
| Protected users | Unchanged |

Result file (gitignored): `scripts/stripe-subscription-smoke-result.json`

---

## 5. DB Befund

| Table | Row |
|-------|-----|
| `profiles` | plan=starter, credits=110, stripe_customer_id + stripe_subscription_id set |
| `credit_transactions` | +50 subscription, +50 renewal |
| `stripe_events` | checkout + invoice event ids recorded |
| `processed_checkout_sessions` | `checkout_type=platform_subscription`, credits_granted=50 |
| `processed_stripe_invoices` | credits_granted=50 |

---

## 6. Automatisch vs Manuell

### Automatisch bewiesen ✅

- Starter subscription webhook → plan + credits + Stripe IDs
- Credit transactions for subscription + renewal
- Webhook idempotency (event + session + invoice layers)
- Invalid signature rejected
- Live mode blocked
- Protected G.10-I / G.10-K users unchanged

### Manuell offen ⏳

- Browser E2E with Stripe test card `4242 4242 4242 4242` via `/api/stripe/subscribe`
- Customer portal subscription cancel UI
- Stripe CLI forward to staging deploy URL

### Browser checkout steps (if needed)

1. `npm run dev`
2. Sign in as `subscriptionsmoke@influexai.test`
3. Open pricing → Starter → complete checkout with test card
4. `npm run smoke:stripe:subscription-baseline` to verify

---

## 7. Umsatz-MVP Billing Status

| Flow | Status |
|------|--------|
| Credit pack (G.10-K) | ✅ |
| Generation deduct (G.10-I) | ✅ |
| Subscription checkout webhook | ✅ |
| Subscription renewal webhook | ✅ |
| Browser checkout E2E | ⏳ Manual optional |
| **Overall MVP billing** | **✅ Sufficient** for launch gate |

---

## 8. Scripts Added

| Script | Purpose |
|--------|---------|
| `scripts/ensure-staging-subscription-smoke-user.mjs` | Create/isolate test user |
| `scripts/stripe-subscription-smoke.mjs` | audit / baseline / webhook-smoke |
| `scripts/lib/stripe-webhook-fixture.mjs` | Extended with `buildInvoicePaidEvent` |

### npm scripts

- `staging:ensure-subscription-smoke-user`
- `smoke:stripe:subscription-audit`
- `smoke:stripe:subscription-baseline`
- `smoke:stripe:subscription-webhook`

---

## 9. Env (no secrets)

**Local `.env.local` (never commit):**

- Staging Supabase URL + service role
- `STRIPE_MODE=test`
- `PROVIDERS_DISABLED=true`
- `ALLOW_SAFE_DEV_PROVIDER_SMOKE=false`
- `sk_test_…`, `pk_test_…`, `whsec_…`
- `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY` (test price id)
- Optional: `STRIPE_SUBSCRIPTION_TEST_EMAIL=subscriptionsmoke@influexai.test`

**Staging deploy:** same test keys + webhook endpoint `/api/stripe/webhook`.

---

## 10. Next Steps

1. Optional browser E2E with test card on fresh user reset
2. Deploy staging webhook endpoint verification with Stripe CLI
3. Customer portal cancel → verify `profiles.plan` reverts to free via `customer.subscription.updated`
