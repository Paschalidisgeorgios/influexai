# Stripe Subscription Initial Invoice Double-Credit Guard — G.10-L2

**Date:** 2026-06-16  
**Branch:** `master`  
**Staging Supabase ref:** `jvjmqtxlqfqaoyjklpxh`

---

## Why This Check

Stripe sends **both** events on new subscription checkout:

1. `checkout.session.completed` — handled by `handlePlatformSubscription` (+50 Starter credits)
2. `invoice.paid` with `billing_reason: subscription_create` — initial invoice

Without a guard, both handlers could grant monthly credits → **double +50**.

---

## Safety

| Check | Result |
|-------|--------|
| PROVIDERS_DISABLED | `true` |
| ALLOW_SAFE_DEV_PROVIDER_SMOKE | `false` |
| STRIPE_MODE | `test` |
| Staging ref | `jvjmqtxlqfqaoyjklpxh` |
| Provider call | **no** |
| Live / Production | **blocked** |

---

## Code Analysis

### checkout.session.completed (Subscription)

`handlePlatformSubscription` grants `SUBSCRIPTION_PLANS[plan].monthlyCredits` (Starter: **+50**) and sets `profiles.plan`, Stripe customer/subscription IDs.

### invoice.paid

`handleSubscriptionRenewal` calls `shouldGrantSubscriptionRenewalCredits(billing_reason)`:

- **`subscription_cycle`** → grant renewal credits (+50)
- **`subscription_create`** → **no grant** (initial invoice ignored)
- Other reasons → no grant

### Cross-Event Idempotency

| Layer | Scope |
|-------|-------|
| `stripe_events` | Per Stripe event ID (same event replay) |
| `processed_checkout_sessions` | Checkout session dedup |
| `processed_stripe_invoices` | Invoice dedup |
| **`billing_reason` guard** | **Cross-event business logic** — blocks checkout + initial invoice double credit |

---

## Fix Status

| Item | Result |
|------|--------|
| Double credit possible before? | **No** — guard existed (`billing_reason === subscription_cycle`) |
| Fix required? | **No behavior change** |
| Change made | Extracted `shouldGrantSubscriptionRenewalCredits()` in `src/lib/stripe-subscription-invoice.server.ts` for clarity + unit tests |

---

## Smoke Results (Fall A / B / C)

**Test user:** `subscriptiondoublecheck@influexai.test` (`27403c35-…`)

| Fall | Event | billing_reason | Credits | Delta | Expected |
|------|-------|----------------|---------|-------|----------|
| A | checkout.session.completed | — | 10 → **60** | +50 | +50 ✅ |
| B | invoice.paid (initial) | subscription_create | 60 → **60** | 0 | 0 ✅ |
| C | invoice.paid (renewal) | subscription_cycle | 60 → **110** | +50 | +50 ✅ |

- Credit transactions: **2** (Starter Plan + Plan-Verlängerung)
- No credit transaction for initial `subscription_create` invoice ✅
- Protected users unchanged ✅

Command: `npm run smoke:stripe:subscription-double-credit`

---

## Umsatz-MVP Billing

| Flow | Status |
|------|--------|
| Credit pack (G.10-K) | ✅ |
| Generation deduct (G.10-I) | ✅ |
| Subscription checkout (G.10-L) | ✅ |
| Initial invoice no double credit (G.10-L2) | ✅ |
| Renewal invoice (G.10-L / L2) | ✅ |

**Billing MVP is sufficient** for launch gate on webhook logic.

---

## Next Phase

**Generate Image UX Finalisierung** — polish post-billing generation UX (no billing changes required for MVP gate).

---

## Env (no secrets)

**Local:** `STRIPE_MODE=test`, `PROVIDERS_DISABLED=true`, staging Supabase, `sk_test_`/`pk_test_`/`whsec_`, optional `STRIPE_SUBSCRIPTION_DOUBLE_CHECK_EMAIL=subscriptiondoublecheck@influexai.test`

**Staging deploy:** same test keys + webhook `/api/stripe/webhook`
