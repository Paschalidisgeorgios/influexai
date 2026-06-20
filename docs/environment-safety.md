# Environment Safety & Staging Setup

This document describes how to develop and test mutating features **without** touching production data, billing, or provider costs.

## Problem

Local `.env.local` must not point at:

- Production Supabase (`NEXT_PUBLIC_SUPABASE_URL` with the production project ref)
- Stripe **live** keys (`sk_live_` / `pk_live_`)
- Production Stripe Price IDs
- Production provider keys (FAL, Akool) without explicit disable flags
- Production `SUPABASE_SERVICE_ROLE_KEY`

Mutating API routes (POST/DELETE/PATCH and side-effectful GET polling) can otherwise insert rows, charge credits, call providers, or start Stripe checkouts against real production resources.

The **Development Write Guard** reduces this risk but is **not** a substitute for a dedicated staging environment.

---

## Environment tiers

| Tier | Purpose | Supabase | Stripe | Providers | Typical runtime |
|------|---------|----------|--------|-----------|-----------------|
| **Local Safe Dev** | UI work, read-only API checks | Staging project or none | Test keys or unset | `PROVIDERS_DISABLED=true` | `next dev`, `VERCEL_ENV=development` |
| **Staging / Preview** | Authenticated E2E, billing QA, tool flows | Dedicated staging project | Test mode + test price IDs | Disabled first, then sandbox | Vercel Preview or local with staging `.env` |
| **Production** | Live users | Production project | Live keys | Live keys | `VERCEL_ENV=production` |

### Local Safe Dev

- Copy `.env.staging.example` → `.env.local`
- Use a **separate** Supabase staging project (create in Supabase dashboard — not in this repo)
- Stripe **test** keys only (`sk_test_` / `pk_test_`)
- `PROVIDERS_DISABLED=true` until sandbox credentials exist
- Do **not** set guard override variables for day-to-day work

### Staging / Preview

- Same isolation rules as local safe dev
- Vercel Preview env vars should mirror staging (test Stripe, staging Supabase, providers off)
- Run authenticated smoke tests here before production releases
- Webhook tests use Stripe CLI + test mode secrets only

### Production

- Live Supabase, live Stripe, live providers
- Dev Write Guard **never** blocks (`VERCEL_ENV=production`)
- No mutating smoke tests against production except controlled mini-purchases with test accounts

---

## Signal matrix

| Signal | Local Safe Dev | Staging | Production | Dev Write Guard (non-prod) | Risk if wrong locally |
|--------|----------------|---------|------------|----------------------------|------------------------|
| Supabase ref | Staging ref / placeholder | Staging ref | Production ref | Blocks if production ref | **P0** — real user data |
| Stripe secret | `sk_test_` or unset | `sk_test_` | `sk_live_` | Blocks if `sk_live_` | **P0** — real charges |
| Stripe publishable | `pk_test_` or unset | `pk_test_` | `pk_live_` | Blocks if `pk_live_` | **P0** |
| Stripe Price IDs | `price_test_...` | `price_test_...` | Live price IDs | Not directly detected* | **P1** — wrong checkout target |
| Provider keys | Disabled or sandbox | Sandbox when enabled | Live | Blocks if active + not disabled | **P0** — real API cost |
| Service role key | Staging only | Staging | Production | Blocks if present (non-prod) | **P0** — bypasses RLS |
| `VERCEL_ENV` | `development` / unset | `preview` / `development` | `production` | Guard off only in production | — |
| `PROVIDERS_DISABLED` | `true` (default) | `true` initially | unset / false | Suppresses provider signal | — |

\*Use `node scripts/check-env-safety.mjs` to detect live-style `price_` IDs in env files.

### Allowed vs forbidden tests by tier

| Test type | Local Safe Dev | Staging | Production |
|-----------|----------------|---------|------------|
| Read-only pages (`/`, `/pricing`) | ✅ | ✅ | ✅ |
| Read-only GET APIs (401 expected) | ✅ | ✅ | ✅ |
| Mutating API (POST/DELETE) | ❌ if prod-like env; ✅ on staging DB | ✅ | ❌ smoke only |
| Stripe checkout | ❌ locally against prod; ✅ test mode on staging | ✅ test cards | Controlled only |
| Provider generation | ❌ unless sandbox + staging DB | ✅ when enabled | Live |
| Upload / training | ❌ against prod; ✅ staging after consent work | ✅ | Live users only |
| Webhook replay | ❌ against prod secrets | ✅ Stripe CLI + test whsec | Ops only |

---

## Development Write Guard

Server-only helper: `src/lib/environment-safety.server.ts`

### What it solves

- Blocks accidental mutating API calls during `next dev`, local `next start`, and Vercel Preview when production-like env signals are detected
- Returns HTTP **403** with code `DEV_WRITE_GUARD_BLOCKED` (no secrets in body)
- Covers ~105 mutating routes including GET polling with side effects

### What it does **not** solve

- Does **not** replace a staging Supabase project
- Does **not** block read-only routes that still leak data
- Does **not** guard webhooks (Stripe/FAL use their own signature/secret checks)
- Does **not** block production runtime (`VERCEL_ENV=production`)
- Does **not** prevent ops mistakes when override env vars are set

### When it blocks

Blocking applies when **all** of the following are true:

1. Runtime is non-production (`VERCEL_ENV=production` is the only exempt runtime)
2. At least one production-like signal is detected
3. No explicit override is set (both override env vars required)

### Production-like signals

| Signal | Detection |
|--------|-----------|
| Supabase production ref | `NEXT_PUBLIC_SUPABASE_URL` matches known production ref |
| Stripe live secret | `STRIPE_SECRET_KEY` starts with `sk_live_` |
| Stripe live publishable | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` |
| Active provider keys | FAL/Akool set unless `PROVIDERS_DISABLED=true` |
| Service role present | `SUPABASE_SERVICE_ROLE_KEY` is set |

### Override (local/preview only)

Both variables are **required** for the **legacy broad** override (discouraged for provider smoke):

```env
ALLOW_PRODUCTION_DEV_WRITES=true
I_UNDERSTAND_PRODUCTION_WRITES=true
```

**Preferred for supervised generate-image smoke (G.10-D):** narrow flag only on `POST /api/generate-image`:

```env
ALLOW_SAFE_DEV_PROVIDER_SMOKE=true
PROVIDERS_DISABLED=false
```

Requires staging Supabase ref, test Stripe, FAL key only, no Akool/ElevenLabs. See `docs/reports/provider-smoke-safe-path-g10d.md`.

**Production deployments (`VERCEL_ENV=production`) are never bypassed.**

### Webhooks (not dev-write-guarded)

External callbacks must remain reachable:

- `/api/stripe/webhook` — Stripe signature via `STRIPE_WEBHOOK_SECRET`
- `/api/lora/webhook` — `FAL_WEBHOOK_SECRET` (header or query)
- `/api/avatar/runpod-callback` — deprecated 410 stub

### Usage in API routes

```typescript
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;
  // ... existing handler
}
```

---

## Safe development rules

1. **No production-like `.env.local`** — use staging Supabase + Stripe test mode
2. **No live Stripe keys locally** — ever
3. **No provider keys locally** unless `PROVIDERS_DISABLED=false` on an isolated staging DB
4. **No real user data** for feature experiments
5. **No upload/training/billing tests** against production from a developer machine
6. **Validate env before work:** `node scripts/check-env-safety.mjs --file .env.local`
7. **Guard override is emergency-only** — not a daily workflow

---

## Staging setup runbook

### 1. Create Supabase staging project

1. In [Supabase Dashboard](https://supabase.com/dashboard), create a **new project** (not production)
2. Note the project ref and URL: `https://YOUR_STAGING_PROJECT_REF.supabase.co`
3. Apply migrations to staging (see `scripts/db/README-test-migration-059.md` for pattern):
   ```bash
   supabase link --project-ref YOUR_STAGING_PROJECT_REF
   supabase db push
   ```
4. Create test users in staging Auth (not production emails)

### 2. Configure Stripe test mode

1. Stripe Dashboard → enable **Test mode**
2. Create test Products/Prices (subscription + credit packs)
3. Copy `sk_test_`, `pk_test_`, and `price_test_...` IDs into staging env
4. For webhooks: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`
5. Use test card `4242 4242 4242 4242`

### 3. Local env file

```bash
cp .env.staging.example .env.local
# Fill staging Supabase + Stripe test values — never production secrets
```

Defaults in template:

```env
PROVIDERS_DISABLED=true
STRIPE_MODE=test
VERCEL_ENV=development
```

### 4. Vercel Preview / staging deployment

1. Vercel project → Settings → Environment Variables
2. Add staging Supabase URL/keys for **Preview** environment only
3. Add Stripe **test** keys for Preview
4. Set `PROVIDERS_DISABLED=true` until provider QA is planned
5. Do **not** copy production env vars into Preview without review

### 5. Smoke tests

1. Run read-only checks locally (pages, GET APIs)
2. On staging: authenticated E2E per `docs/SMOKE_TEST_CHECKLIST.md` §0
3. Stripe test checkout + webhook dedup on staging
4. Credit deduction tests on staging only
5. Enable providers one at a time after DB isolation confirmed

### 6. Enable providers (when ready)

1. Confirm staging DB has no production data
2. Set sandbox/test FAL/Akool keys
3. Set `PROVIDERS_DISABLED=false`
4. Re-run `node scripts/check-env-safety.mjs --file .env.local`
5. Test one mutating tool end-to-end on staging

---

## Dev Write Guard vs Staging

| Concern | Dev Write Guard | Staging infrastructure |
|---------|-----------------|------------------------|
| Accidental POST in dev | Blocks when prod-like env | Prevents need for prod env |
| Realistic E2E testing | Blocks mutations unless safe env | Provides safe DB + billing |
| Webhook testing | Not guarded | Test mode + staging DB |
| Production runtime | Never blocks | N/A |
| Team onboarding | Automatic safety net | Documented workflow |
| Data isolation | No — same DB if misconfigured | Yes — separate project |

**Both are necessary:** Guard = last-line defense; Staging = correct architecture.

---

## Env safety validator

Read-only script (no dependencies):

```bash
node scripts/check-env-safety.mjs --example .env.local.example
node scripts/check-env-safety.mjs --example .env.staging.example
node scripts/check-env-safety.mjs --file .env.local
```

Prints signal **categories** only — never secret values. Exit 1 when production-like signals detected.

---

## UI hint (development only)

`AiCreatorEnvironmentHint` on `/dashboard/ai-creator` lists non-secret warnings when risky configuration is detected.

---

## QA checklist (no production mutations)

- `node scripts/check-env-safety.mjs --file .env.local` → exit 0 on safe staging config
- GET `/api/ai-creator/characters` → 200/401 (not 403)
- POST `/api/ai-creator/characters` with dummy body → 403 `DEV_WRITE_GUARD_BLOCKED` when production-like env loaded
- No DB insert, provider call, or Stripe session when guard blocks

See also: `docs/SMOKE_TEST_CHECKLIST.md`

---

## Files

| File | Purpose |
|------|---------|
| `.env.example` | Index pointing to templates |
| `.env.local.example` | Safe local template (test keys, providers disabled) |
| `.env.staging.example` | Staging-oriented placeholders |
| `scripts/check-env-safety.mjs` | Read-only env signal validator |
| `src/lib/environment-safety.server.ts` | Guard implementation (runtime) |
| `docs/SMOKE_TEST_CHECKLIST.md` | Manual QA including staging section |
