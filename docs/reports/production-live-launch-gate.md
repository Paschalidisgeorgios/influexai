# Production Live Launch Gate — LIVE-1

Generated: 2026-06-21T07:06:12.323Z

## Go/No-Go

| Check | Result |
|-------|--------|
| Live Launch Status | **NO-GO** |
| Provider runs | 0 (max 1) |
| Secrets logged | **no** |

## Safety

- Branch: `master`
- HEAD: `6f49e98 docs: record production dry run gate`
- Production deploy: no
- Provider window closed on failure: n/a

## Required Env

- Production Supabase ref: jvjmqtxlqfqaoyjklpxh
- Stripe mode: test
- Stripe key mode: sk_test_
- Provider key: FAL_API_KEY
- Missing env keys: STRIPE_CREDITS_50

## Production Supabase Readiness

- Local migrations max: n/a / 68
- Remote migration 068: no/unknown
- Tables: n/a
- deduct_credits RPC: fail
- Storage: fail
- Readiness: FAIL

## Dry-Run Deploy (Provider Disabled)

- Landing: n/a
- Pricing: n/a
- Auth: n/a
- Dashboard route: n/a
- Provider guard: FAIL (n/a)

## Legal / Surface

- Impressum: fail
- Datenschutz: fail
- AGB: fail
- Footer legal links: no
- Testmode banner: no
- Refund/credit hint: not found

## Provider Live

- Provider opened: no
- Deploy after open: no
- Smoke user: `launchqa@influexai.test`
- Credits before: n/a
- Credits after: n/a
- generationId: n/a
- imageUrl: n/a
- Gallery: fail
- Provider remained active: no

## Blockers

- missing_STRIPE_CREDITS_50
- supabase_url_not_production_ref
- supabase_anon_not_production_ref
- staging_supabase_in_live_env
- stripe_mode_not_live
- next_public_stripe_mode_not_live
- stripe_secret_not_live
- stripe_publishable_not_live
- stripe_test_secret_in_live
- stripe_test_publishable_in_live
- public_providers_must_start_disabled

## Diagnosis

**missing_live_env**

## Immediate Next Action

Populate .env.production.local (never commit) with:
- Production Supabase (ref hszjafdelcydnppyolkm): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Stripe Live: STRIPE_MODE=live, NEXT_PUBLIC_STRIPE_MODE=live, STRIPE_SECRET_KEY (sk_live_), NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_), STRIPE_WEBHOOK_SECRET
- Live price IDs: all NEXT_PUBLIC_STRIPE_INFLUEXAI_* + STRIPE_CREDITS_* (incl. STRIPE_CREDITS_50)
- Provider start closed: PROVIDERS_DISABLED=true, NEXT_PUBLIC_PROVIDERS_DISABLED=true, ALLOW_SAFE_DEV_PROVIDER_SMOKE=false
- FAL_API_KEY or FAL_KEY
- Optional migration check: DATABASE_URL or SUPABASE_DB_PASSWORD
- Smoke: LAUNCH_QA_PASSWORD
Then: $env:LAUNCH_MODE='live'; $env:LIVE_LAUNCH_CONFIRM='I_UNDERSTAND_THIS_GOES_LIVE'; npm run launch:production

---
No secrets in this report.
